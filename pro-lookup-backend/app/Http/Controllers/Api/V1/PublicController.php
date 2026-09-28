<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\PostResource;
use App\Http\Resources\V1\PublicTeacherResource;
use App\Http\Resources\V1\TeacherCardResource;
use App\Models\Faculty;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\ProfileSlugHistory;
use App\Models\Rank;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * API publique (zone A) : aucune authentification.
 * Ne renvoie que les profils approuvés et les publications publiées dont l'auteur est approuvé.
 */
class PublicController extends Controller
{
    /** Relations nécessaires à l'affichage d'une carte enseignant. */
    private const CARD_RELATIONS = ['rank'];

    /** Recherche insensible à la casse, compatible PostgreSQL (ILIKE) et SQLite (tests). */
    private function like(Builder $query, string $column, string $term, string $boolean = 'and'): Builder
    {
        $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        return $query->where($column, $operator, '%'.$term.'%', $boolean);
    }

    private function perPage(Request $request, int $default = 12): int
    {
        return min(max((int) $request->query('per_page', $default), 1), 50);
    }

    // ------------------------------------------------------------------ Enseignants

    /**
     * Filtres « école supérieure » (identifiant de la liste) et « département / filière »
     * (texte libre) communs à l'annuaire et au fil des publications.
     */
    private function applyAffiliationFilters(Builder $users, Request $request): Builder
    {
        $school = $request->filled('school') ? Faculty::where('slug', $request->query('school'))->first() : null;
        $department = trim((string) $request->query('department', ''));

        return $users
            ->when($request->filled('school'), fn (Builder $q) => $school ? $q->inSchool($school) : $q->whereRaw('1 = 0'))
            ->when($department !== '', fn (Builder $q) => $this->like($q, 'department', $department));
    }

    /** Annuaire : recherche (facultative), filtres (école, département / filière, grade, expertise), tri alphabétique. */
    public function teachers(Request $request)
    {
        $search = trim((string) $request->query('q', ''));
        $expertise = trim((string) $request->query('expertise', ''));

        $teachers = User::query()
            ->publicTeachers()
            ->with(self::CARD_RELATIONS)
            ->withCount('publishedPosts')
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $sub) use ($search) {
                foreach (preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) as $word) {
                    $sub->where(function (Builder $w) use ($word) {
                        $this->like($w, 'first_name', $word);
                        $this->like($w, 'last_name', $word, 'or');
                        $this->like($w, 'title', $word, 'or');
                        $this->like($w, 'expertise', $word, 'or');
                        $this->like($w, 'school', $word, 'or');
                        $this->like($w, 'department', $word, 'or');
                    });
                }
            }))
            ->when($expertise !== '', fn (Builder $q) => $this->like($q, 'expertise', $expertise))
            ->tap(fn (Builder $q) => $this->applyAffiliationFilters($q, $request))
            ->when($request->filled('grade'), fn (Builder $q) => $q->whereHas('rank', fn ($r) => $r
                ->where('slug', $request->query('grade'))))
            ->orderBy($request->query('sort') === 'first_name' ? 'first_name' : 'last_name')
            ->orderBy('first_name')
            ->paginate($this->perPage($request));

        return TeacherCardResource::collection($teachers);
    }

    /**
     * Profil public. Trois cas (brief §9.4) : trouvé (200) · ancien identifiant
     * (200 avec « moved_to » pour une redirection 301) · introuvable (404, message unique).
     */
    public function teacher(string $slug): JsonResponse|PublicTeacherResource
    {
        $teacher = User::query()->publicTeachers()
            ->with([...self::CARD_RELATIONS, 'profileItems'])
            ->withCount('publishedPosts')
            ->where('slug', $slug)
            ->first();

        if ($teacher) {
            return new PublicTeacherResource($teacher);
        }

        $history = ProfileSlugHistory::where('slug', $slug)->first();
        $current = $history ? User::query()->publicTeachers()->find($history->user_id) : null;
        if ($current) {
            return response()->json(['moved_to' => $current->slug]);
        }

        return $this->profileNotFound();
    }

    /**
     * Téléchargement du CV d'un enseignant : uniquement si le profil est public et la section
     * « CV » visible. Sinon, la même réponse 404 neutre que pour un profil indisponible.
     */
    public function teacherCv(string $slug)
    {
        $user = User::query()->publicTeachers()->where('slug', $slug)->first();
        abort_unless($user && $user->hasPublicCv() && Storage::disk('local')->exists($user->cv_path), 404, 'Ce CV n’est pas disponible.');

        return Storage::disk('local')->download($user->cv_path, MeController::cvFileName($user), [
            'Content-Type' => 'application/pdf',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }

    public function teacherPosts(Request $request, string $slug)
    {
        $teacher = User::query()->publicTeachers()->where('slug', $slug)->first();
        if (! $teacher) {
            return $this->profileNotFound();
        }

        $posts = $teacher->posts()->publiclyVisible()
            ->with(['category', 'media', 'user' => fn ($q) => $q->with(self::CARD_RELATIONS)])
            ->latest('published_at')
            ->paginate($this->perPage($request, 10));

        return PostResource::collection($posts);
    }

    private function profileNotFound(): JsonResponse
    {
        return response()->json(['message' => 'Ce profil n’est pas disponible.'], 404);
    }

    // ------------------------------------------------------------------ Publications

    /** Fil public : filtres catégorie, école supérieure, département / filière, enseignant ; recherche par mot-clé. */
    public function posts(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('q', ''));

        $posts = Post::query()->publiclyVisible()
            ->with(['category', 'media', 'user' => fn ($q) => $q->with(self::CARD_RELATIONS)])
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $sub) use ($search) {
                $this->like($sub, 'title', $search);
                $this->like($sub, 'content', $search, 'or');
            }))
            ->when($request->filled('category'), fn (Builder $q) => $q->whereHas('category', fn ($c) => $c
                ->where('slug', $request->query('category'))))
            ->when($request->filled('teacher'), fn (Builder $q) => $q->whereHas('user', fn ($u) => $u
                ->where('slug', $request->query('teacher'))))
            ->when($request->filled('school') || $request->filled('department'), fn (Builder $q) => $q
                ->whereHas('user', fn (Builder $u) => $this->applyAffiliationFilters($u, $request)))
            ->latest('published_at')
            ->paginate($this->perPage($request, 10));

        return PostResource::collection($posts);
    }

    /** Détail d'une publication, avec d'autres publications du même auteur. */
    public function post(int $id): JsonResponse
    {
        $post = Post::query()->publiclyVisible()
            ->with(['category', 'media', 'user' => fn ($q) => $q->with(self::CARD_RELATIONS)])
            ->find($id);

        if (! $post) {
            return response()->json(['message' => 'Cette publication n’est pas disponible.'], 404);
        }

        $others = Post::query()->publiclyVisible()
            ->where('user_id', $post->user_id)
            ->where('id', '!=', $post->id)
            ->with(['category', 'media', 'user' => fn ($q) => $q->with(self::CARD_RELATIONS)])
            ->latest('published_at')
            ->limit(3)
            ->get();

        return response()->json([
            'data' => (new PostResource($post))->resolve(),
            'author_indexable' => (bool) $post->user->search_indexable,
            'others' => PostResource::collection($others)->resolve(),
        ]);
    }

    // ------------------------------------------------------------------ Recherche & chiffres

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json(['query' => $q, 'teachers' => [], 'posts' => [], 'totals' => ['teachers' => 0, 'posts' => 0]]);
        }

        $teacherQuery = User::query()->publicTeachers()->where(function (Builder $sub) use ($q) {
            $this->like($sub, 'first_name', $q);
            $this->like($sub, 'last_name', $q, 'or');
            $this->like($sub, 'title', $q, 'or');
            $this->like($sub, 'expertise', $q, 'or');
            $this->like($sub, 'school', $q, 'or');
            $this->like($sub, 'department', $q, 'or');
            // Recherche « prénom nom » complet ; la concaténation s'écrit différemment selon la base.
            $fullName = $sub->getConnection()->getDriverName() === 'mysql'
                ? "CONCAT(first_name, ' ', last_name)"
                : "first_name || ' ' || last_name";
            $sub->orWhereRaw("LOWER({$fullName}) LIKE ?", ['%'.mb_strtolower($q).'%']);
        });
        $postQuery = Post::query()->publiclyVisible()->where(function (Builder $sub) use ($q) {
            $this->like($sub, 'title', $q);
            $this->like($sub, 'content', $q, 'or');
        });

        $limit = min((int) $request->query('limit', 6), 20);

        return response()->json([
            'query' => $q,
            'teachers' => TeacherCardResource::collection(
                (clone $teacherQuery)->with(self::CARD_RELATIONS)->withCount('publishedPosts')->orderBy('last_name')->limit($limit)->get()
            )->resolve(),
            'posts' => PostResource::collection(
                (clone $postQuery)->with(['category', 'media', 'user' => fn ($u) => $u->with(self::CARD_RELATIONS)])
                    ->latest('published_at')->limit($limit)->get()
            )->resolve(),
            'totals' => ['teachers' => $teacherQuery->count(), 'posts' => $postQuery->count()],
        ]);
    }

    /** Chiffres clés de l'accueil. */
    public function stats(): JsonResponse
    {
        return response()->json(['data' => [
            'teachers' => User::query()->publicTeachers()->count(),
            'posts' => Post::query()->publiclyVisible()->count(),
            'schools' => Faculty::where('is_active', true)->count(),
            // Départements / filières distincts saisis par les enseignants publics.
            'departments' => User::query()->publicTeachers()->whereNotNull('department')->where('department', '!=', '')
                ->distinct()->count(DB::raw('LOWER(department)')),
        ]]);
    }

    // ------------------------------------------------------------------ Référentiels

    /** Écoles supérieures de la liste gérée par l'administration, avec leur nombre d'enseignants publics. */
    public function schools(): JsonResponse
    {
        $schools = Faculty::where('is_active', true)->orderBy('position')->orderBy('name')->get()
            ->map(fn (Faculty $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
                'teachers_count' => User::query()->publicTeachers()->inSchool($f)->count(),
            ]);

        return response()->json(['data' => $schools]);
    }

    /**
     * Suggestions pour les champs libres « École supérieure » et « Département / Filière » :
     * la liste officielle et les valeurs déjà saisies par les enseignants publics.
     */
    public function suggestions(): JsonResponse
    {
        $public = User::query()->publicTeachers();
        $unique = fn ($values) => $values->map(fn ($v) => trim((string) $v))->filter()
            ->unique(fn ($v) => mb_strtolower($v))->sort(fn ($a, $b) => strcoll($a, $b))->values();

        return response()->json(['data' => [
            'schools' => $unique(Faculty::where('is_active', true)->pluck('name')->merge((clone $public)->pluck('school'))),
            'departments' => $unique((clone $public)->pluck('department')),
        ]]);
    }

    public function grades(): JsonResponse
    {
        return response()->json(['data' => Rank::where('is_active', true)->orderBy('order')->orderBy('name')
            ->get(['id', 'name', 'slug'])]);
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => PostCategory::where('is_active', true)->orderBy('position')->orderBy('name')
            ->get(['id', 'name', 'slug'])]);
    }

    // ------------------------------------------------------------------ Signalements & SEO

    /**
     * Signalement d'une publication ou d'un profil par un visiteur.
     * Anti-abus : limite de fréquence (throttle:reports) + champ piège « website ».
     */
    public function report(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target_type' => ['required', 'in:post,profile'],
            // Un profil est désigné par son identifiant public (slug), jamais par l'id interne.
            'target_id' => ['required_without:target_slug', 'nullable', 'integer'],
            'target_slug' => ['required_without:target_id', 'nullable', 'string', 'max:100'],
            'reason' => ['required', 'in:inappropriate,false_information,spam,copyright,harassment,other'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'max:0'],
        ], [
            'website.max' => 'Signalement refusé.',
        ]);

        $targetId = $data['target_type'] === 'post'
            ? Post::query()->publiclyVisible()->whereKey($data['target_id'] ?? 0)->value('id')
            : User::query()->publicTeachers()
                ->when($data['target_slug'] ?? null, fn ($q, $slug) => $q->where('slug', $slug), fn ($q) => $q->whereKey($data['target_id'] ?? 0))
                ->value('id');

        if (! $targetId) {
            return response()->json(['message' => 'Le contenu signalé est introuvable.'], 404);
        }

        Report::create([
            'target_type' => $data['target_type'],
            'target_id' => $targetId,
            'reason' => $data['reason'],
            'comment' => $data['comment'] ?? null,
            'email' => $data['email'] ?? null,
            'ip_hash' => hash('sha256', $request->ip().config('app.key')),
        ]);

        return response()->json(['message' => 'Merci, votre signalement a été transmis à l’administration.'], 201);
    }

    /** Liste des pages indexables, pour sitemap.ts côté Next.js. */
    public function sitemap(): JsonResponse
    {
        $teachers = User::query()->publicTeachers()->where('search_indexable', true)->get(['slug', 'updated_at']);
        $posts = Post::query()->publiclyVisible()
            ->whereHas('user', fn ($q) => $q->where('search_indexable', true))
            ->get(['id', 'updated_at']);

        return response()->json([
            'teachers' => $teachers->map(fn ($t) => ['slug' => $t->slug, 'updated_at' => $t->updated_at?->toIso8601String()]),
            'posts' => $posts->map(fn ($p) => ['id' => $p->id, 'updated_at' => $p->updated_at?->toIso8601String()]),
        ]);
    }
}
