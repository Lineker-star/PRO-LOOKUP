<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Rank;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use App\Support\Names;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Listes gérées par l'administrateur : grades, catégories de publication, écoles supérieures.
 * L'administrateur peut ajouter, renommer et supprimer chaque élément.
 *
 * Effet d'une suppression :
 *  - grade      → les comptes concernés n'ont plus de grade (à choisir de nouveau par l'enseignant) ;
 *  - catégorie  → les publications concernées n'ont plus de catégorie ;
 *  - école      → les enseignants gardent l'école qu'ils ont saisie (texte libre), seul le lien à la liste disparaît.
 */
class ReferenceController extends Controller
{
    private const TYPES = ['grades', 'categories', 'schools'];

    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'grades' => Rank::withCount('users')->orderBy('order')->orderBy('name')->get()
                ->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'slug' => $g->slug, 'usage' => $g->users_count]),
            'categories' => PostCategory::orderBy('position')->orderBy('name')->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'usage' => Post::where('category_id', $c->id)->count()]),
            'schools' => Faculty::orderBy('position')->orderBy('name')->get()
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'slug' => $s->slug, 'usage' => User::query()->inSchool($s)->count()]),
        ]]);
    }

    private function find(string $type, int $id): Model
    {
        return match ($type) {
            'grades' => Rank::findOrFail($id),
            'categories' => PostCategory::findOrFail($id),
            'schools' => Faculty::findOrFail($id),
            default => abort(404),
        };
    }

    private function modelClass(string $type): string
    {
        return match ($type) {
            'grades' => Rank::class,
            'categories' => PostCategory::class,
            'schools' => Faculty::class,
            default => abort(404),
        };
    }

    /** Refuse un nom déjà utilisé dans la même liste (casse ignorée). */
    private function nameTaken(string $type, string $name, ?int $exceptId = null): bool
    {
        $class = $this->modelClass($type);

        return $class::query()->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->pluck('name')
            ->contains(fn ($existing) => Names::same($existing, $name));
    }

    private function duplicate(): JsonResponse
    {
        return response()->json(['message' => 'Cet élément existe déjà dans la liste.', 'errors' => ['name' => ['Cet élément existe déjà dans la liste.']]], 422);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        abort_unless(in_array($type, self::TYPES, true), 404);
        $name = trim($request->validate(['name' => ['required', 'string', 'max:150']])['name']);
        if ($this->nameTaken($type, $name)) {
            return $this->duplicate();
        }

        $class = $this->modelClass($type);
        $slug = $this->uniqueSlug($class, $name);
        $model = match ($type) {
            'grades' => Rank::create(['name' => $name, 'slug' => $slug, 'order' => (int) Rank::max('order') + 1, 'badge_color' => '#D4A24C', 'is_active' => true]),
            'categories' => PostCategory::create(['name' => $name, 'slug' => $slug, 'position' => (int) PostCategory::max('position') + 1, 'is_active' => true]),
            'schools' => $this->createSchool($name, $slug),
        };

        $this->audit->log($request->user(), "{$type}.created", $model);
        $this->revalidator->tags(['references', 'stats', 'teachers']);

        return $this->index();
    }

    /** Nouvelle école : les enseignants qui ont déjà saisi exactement ce nom y sont rattachés. */
    private function createSchool(string $name, string $slug): Faculty
    {
        $school = Faculty::create(['name' => $name, 'slug' => $slug, 'position' => (int) Faculty::max('position') + 1, 'is_active' => true]);
        $ids = User::whereNull('faculty_id')->whereNotNull('school')->get(['id', 'school'])
            ->filter(fn (User $u) => Names::same($u->school, $name))->pluck('id');
        User::whereIn('id', $ids)->update(['faculty_id' => $school->id]);

        return $school;
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        abort_unless(in_array($type, self::TYPES, true), 404);
        $model = $this->find($type, $id);
        $name = trim($request->validate(['name' => ['required', 'string', 'max:150']])['name']);
        if ($this->nameTaken($type, $name, $id)) {
            return $this->duplicate();
        }

        $before = $model->name;
        $model->name = $name;
        $model->save();

        $this->audit->log($request->user(), "{$type}.renamed", $model, null, ['before' => $before]);
        $this->revalidator->tags(['references', 'teachers', 'posts', 'stats']);

        return $this->index();
    }

    public function destroy(Request $request, string $type, int $id): JsonResponse
    {
        abort_unless(in_array($type, self::TYPES, true), 404);
        $model = $this->find($type, $id);

        DB::transaction(function () use ($type, $model) {
            // Les clés étrangères mettent déjà ces liens à NULL ; on le fait explicitement pour
            // rester correct quel que soit le moteur de base de données.
            match ($type) {
                'grades' => User::where('rank_id', $model->id)->update(['rank_id' => null]),
                'categories' => Post::where('category_id', $model->id)->update(['category_id' => null]),
                'schools' => User::where('faculty_id', $model->id)->update(['faculty_id' => null]),
            };
            $model->delete();
        });

        $this->audit->log($request->user(), "{$type}.deleted", $model);
        $this->revalidator->tags(['references', 'teachers', 'posts', 'stats']);

        return $this->index();
    }

    private function uniqueSlug(string $class, string $name): string
    {
        $base = Str::slug(Str::ascii($name)) ?: 'element';
        $slug = $base;
        $i = 2;
        while ($class::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
