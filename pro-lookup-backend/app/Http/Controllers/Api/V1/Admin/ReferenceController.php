<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Listes gérées par l'administrateur : grades, catégories, facultés, départements.
 * Pas de suppression : on désactive (un élément désactivé disparaît des formulaires
 * mais reste affiché sur les profils et publications qui l'utilisent).
 */
class ReferenceController extends Controller
{
    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'grades' => Rank::withCount('users')->orderBy('order')->orderBy('name')->get()
                ->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'slug' => $g->slug, 'is_active' => $g->is_active, 'position' => $g->order, 'usage' => $g->users_count]),
            'categories' => PostCategory::orderBy('position')->orderBy('name')->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'is_active' => $c->is_active, 'position' => $c->position,
                    'usage' => \App\Models\Post::where('category_id', $c->id)->count()]),
            'faculties' => Faculty::with(['departments' => fn ($q) => $q->orderBy('name')])->orderBy('position')->orderBy('name')->get()
                ->map(fn ($f) => [
                    'id' => $f->id, 'name' => $f->name, 'slug' => $f->slug, 'is_active' => $f->is_active, 'position' => $f->position,
                    'usage' => \App\Models\User::where('faculty_id', $f->id)->count(),
                    'departments' => $f->departments->map(fn ($d) => [
                        'id' => $d->id, 'name' => $d->name, 'slug' => $d->slug, 'is_active' => $d->is_active, 'faculty_id' => $d->faculty_id,
                        'usage' => \App\Models\User::where('department_id', $d->id)->count(),
                    ]),
                ]),
        ]]);
    }

    /** Crée un élément ; $type ∈ grades | categories | faculties | departments. */
    public function store(Request $request, string $type): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'faculty_id' => [$type === 'departments' ? 'required' : 'nullable', 'integer', Rule::exists('faculties', 'id')],
        ]);

        $model = match ($type) {
            'grades' => Rank::create(['name' => $data['name'], 'slug' => $this->uniqueSlug(Rank::class, $data['name']), 'order' => (int) Rank::max('order') + 1, 'is_active' => true]),
            'categories' => PostCategory::create(['name' => $data['name'], 'slug' => $this->uniqueSlug(PostCategory::class, $data['name']), 'position' => (int) PostCategory::max('position') + 1]),
            'faculties' => Faculty::create(['name' => $data['name'], 'slug' => $this->uniqueSlug(Faculty::class, $data['name']), 'position' => (int) Faculty::max('position') + 1]),
            'departments' => Department::create(['name' => $data['name'], 'faculty_id' => $data['faculty_id'], 'slug' => $this->uniqueSlug(Department::class, $data['name'], ['faculty_id' => $data['faculty_id']])]),
            default => abort(404),
        };

        $this->audit->log($request->user(), "{$type}.created", $model);
        $this->revalidator->tags(['references', 'stats']);

        return $this->index();
    }

    /** Renommer ou activer / désactiver. */
    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $model = match ($type) {
            'grades' => Rank::findOrFail($id),
            'categories' => PostCategory::findOrFail($id),
            'faculties' => Faculty::findOrFail($id),
            'departments' => Department::findOrFail($id),
            default => abort(404),
        };

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $before = $model->only(['name', 'is_active']);
        $model->fill($data)->save();
        $action = isset($data['is_active']) && $data['is_active'] !== $before['is_active']
            ? ($data['is_active'] ? 'activated' : 'deactivated')
            : 'renamed';
        $this->audit->log($request->user(), "{$type}.{$action}", $model, null, ['before' => $before]);
        $this->revalidator->tags(['references', 'teachers', 'posts', 'stats']);

        return $this->index();
    }

    private function uniqueSlug(string $class, string $name, array $scope = []): string
    {
        $base = Str::slug(Str::ascii($name)) ?: 'element';
        $slug = $base;
        $i = 2;
        while ($class::where('slug', $slug)->where($scope)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
