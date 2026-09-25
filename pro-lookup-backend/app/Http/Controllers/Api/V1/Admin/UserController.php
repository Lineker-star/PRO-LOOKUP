<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\OwnerProfileResource;
use App\Http\Resources\V1\Refs;
use App\Models\AdminAuditLog;
use App\Models\Department;
use App\Models\Report;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use App\Services\SlugService;
use App\Support\Emails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Gestion des enseignants : liste, fiche, création directe, grade, suspension, URL, suppression. */
class UserController extends Controller
{
    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    private function row(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'status' => $user->status,
            'matricule' => $user->matricule,
            'created_at' => $user->created_at?->toIso8601String(),
            'approved_at' => $user->approved_at?->toIso8601String(),
            'posts_count' => (int) ($user->posts_count ?? 0),
            ...Refs::teacherCard($user),
        ];
    }

    private function detail(User $user): array
    {
        $user->load(['rank', 'faculty', 'departmentRef', 'registrationRequest', 'profileItems']);

        return [
            ...OwnerProfileResource::forAdmin($user)->resolve(),
            'history' => AdminAuditLog::with('admin')
                ->where('target_type', 'user')->where('target_id', $user->id)
                ->latest('created_at')->limit(30)->get()
                ->map(fn ($l) => AuditController::present($l)),
        ];
    }

    private function findTeacher(int $id): User
    {
        return User::teachers()->findOrFail($id);
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');

        $users = User::teachers()
            ->with(['rank', 'faculty', 'departmentRef'])
            ->withCount('posts')
            ->when(in_array($status, ['pending', 'approved', 'rejected', 'suspended'], true), fn ($q) => $q->where('status', $status))
            ->when($request->filled('grade'), fn ($q) => $q->where('rank_id', $request->query('grade')))
            ->when($request->filled('faculty'), fn ($q) => $q->where('faculty_id', $request->query('faculty')))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $sub->whereRaw('LOWER(first_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(matricule, \'\')) LIKE ?', [$term]);
            }))
            ->orderBy('last_name')->orderBy('first_name')
            ->paginate(20);

        $counts = User::teachers()->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'data' => $users->getCollection()->map(fn ($u) => $this->row($u)),
            'meta' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total()],
            'counts' => [
                'all' => (int) $counts->sum(),
                'approved' => (int) ($counts['approved'] ?? 0),
                'pending' => (int) ($counts['pending'] ?? 0),
                'suspended' => (int) ($counts['suspended'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->detail($this->findTeacher($id))]);
    }

    /** Création directe : compte approuvé d'office, email pour définir le mot de passe (brief §5.2). */
    public function store(Request $request, SlugService $slugs): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'grade_id' => ['required', 'integer', Rule::exists('ranks', 'id')->where('is_active', true)],
            'faculty_id' => ['required', 'integer', Rule::exists('faculties', 'id')],
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')],
            'title' => ['nullable', 'string', 'max:150'],
            'expertise' => ['nullable', 'string', 'max:150'],
            'matricule' => ['nullable', 'string', 'max:50'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ], ['email.unique' => 'Un compte existe déjà avec cette adresse email.']);

        $department = Department::find($data['department_id']);
        if ((int) $department->faculty_id !== (int) $data['faculty_id']) {
            return response()->json(['message' => 'Ce département n’appartient pas à la faculté choisie.', 'errors' => [
                'department_id' => ['Ce département n’appartient pas à la faculté choisie.'],
            ]], 422);
        }

        $user = DB::transaction(function () use ($data, $request, $slugs, $department) {
            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => strtolower($data['email']),
                // Mot de passe aléatoire inutilisable : l'enseignant définit le sien via l'email reçu.
                'password' => Str::random(40),
                'rank_id' => $data['grade_id'],
                'faculty_id' => $data['faculty_id'],
                'department_id' => $data['department_id'],
                'title' => $data['title'] ?? null,
                'expertise' => $data['expertise'] ?? null,
                'matricule' => $data['matricule'] ?? null,
            ]);
            $user->role = User::ROLE_TEACHER;
            $user->status = UserStatus::Approved->value;
            $user->department = $department->name;
            $user->approved_by = $request->user()->id;
            $user->approved_at = now();
            $user->email_verified_at = now();
            $user->slug = $slugs->generateFor($user);
            $user->save();

            $this->audit->log($request->user(), 'user.created', $user, $data['reason'] ?? null);

            return $user;
        });

        Emails::accountCreated($user);
        $this->revalidator->teacher($user->slug);

        return response()->json([
            'message' => 'Compte créé et approuvé. Un email a été envoyé à l’enseignant pour définir son mot de passe.',
            'data' => $this->detail($user),
        ], 201);
    }

    /** Modification administrative : grade, faculté, département, titre. */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->findTeacher($id);
        $data = $request->validate([
            'grade_id' => ['sometimes', 'integer', Rule::exists('ranks', 'id')],
            'faculty_id' => ['sometimes', 'integer', Rule::exists('faculties', 'id')],
            'department_id' => ['sometimes', 'integer', Rule::exists('departments', 'id')],
            'title' => ['sometimes', 'nullable', 'string', 'max:150'],
        ]);

        $before = $user->only(['rank_id', 'faculty_id', 'department_id', 'title']);
        if (isset($data['grade_id'])) {
            $user->rank_id = $data['grade_id'];
        }
        $user->fill(array_intersect_key($data, array_flip(['faculty_id', 'department_id', 'title'])));
        if ($user->isDirty('department_id')) {
            $user->department = optional($user->departmentRef()->first())->name;
        }
        $user->save();

        $this->audit->log($request->user(), 'user.updated', $user, null, ['before' => $before, 'after' => $user->only(array_keys($before))]);
        $this->revalidator->teacher($user->slug);

        return response()->json(['message' => 'Fiche mise à jour.', 'data' => $this->detail($user)]);
    }

    /** Suspension : profil ET publications retirés immédiatement des pages publiques. */
    public function suspend(Request $request, int $id): JsonResponse
    {
        $user = $this->findTeacher($id);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']], [
            'reason.required' => 'Le motif de la suspension est obligatoire.',
        ]);
        if ($user->status !== UserStatus::Approved->value) {
            return response()->json(['message' => 'Seul un compte approuvé peut être suspendu.'], 422);
        }

        $user->status = UserStatus::Suspended->value;
        $user->suspension_reason = $data['reason'];
        $user->suspended_at = now();
        $user->save();
        $user->tokens()->delete(); // accès à l'espace enseignant bloqué immédiatement

        $this->audit->log($request->user(), 'user.suspended', $user, $data['reason']);
        Emails::suspended($user, $data['reason']);
        $this->revalidator->teacher($user->slug);

        return response()->json(['message' => 'Compte suspendu : le profil et les publications ne sont plus publics.', 'data' => $this->detail($user)]);
    }

    public function reactivate(Request $request, int $id): JsonResponse
    {
        $user = $this->findTeacher($id);
        if ($user->status !== UserStatus::Suspended->value) {
            return response()->json(['message' => 'Seul un compte suspendu peut être réactivé.'], 422);
        }

        $user->status = UserStatus::Approved->value;
        $user->suspension_reason = null;
        $user->suspended_at = null;
        $user->save();

        $this->audit->log($request->user(), 'user.reactivated', $user);
        Emails::reactivated($user);
        $this->revalidator->teacher($user->slug);

        return response()->json(['message' => 'Compte réactivé.', 'data' => $this->detail($user)]);
    }

    /** Réinitialise un identifiant inapproprié (retour à « prénom-nom »). */
    public function resetSlug(Request $request, int $id, SlugService $slugs): JsonResponse
    {
        $user = $this->findTeacher($id);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);
        $old = $user->slug;
        $new = $slugs->generateFor(tap(clone $user, fn ($u) => $u->slug = null));

        if ($new !== $old) {
            $slugs->change($user, $new, $request->user(), byAdmin: true);
        }

        $this->audit->log($request->user(), 'user.slug_reset', $user, $data['reason'], ['from' => $old, 'to' => $user->slug]);
        $this->revalidator->teacher($user->slug, array_filter([$old ? "teacher:{$old}" : null]));

        return response()->json(['message' => "Identifiant réinitialisé : /in/{$user->slug}", 'data' => $this->detail($user)]);
    }

    /** Suppression définitive, confirmée par la saisie de l'email du compte. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $this->findTeacher($id);
        $data = $request->validate(['confirm_email' => ['required', 'string'], 'reason' => ['required', 'string', 'min:5']]);
        if (strtolower($data['confirm_email']) !== strtolower($user->email)) {
            return response()->json(['message' => 'L’email de confirmation ne correspond pas.', 'errors' => [
                'confirm_email' => ['L’email de confirmation ne correspond pas.'],
            ]], 422);
        }

        $slug = $user->slug;
        $this->audit->log($request->user(), 'user.deleted', $user, $data['reason'], ['email' => $user->email]);

        // Les signalements ouverts sur ce profil ou ses publications n'ont plus d'objet.
        Report::where('status', 'open')
            ->where(fn ($q) => $q->where(fn ($p) => $p->where('target_type', 'profile')->where('target_id', $user->id))
                ->orWhere(fn ($p) => $p->where('target_type', 'post')->whereIn('target_id', $user->posts()->pluck('id'))))
            ->update(['status' => 'actioned', 'resolution' => 'target_deleted', 'handled_by' => $request->user()->id, 'handled_at' => now()]);
        $user->tokens()->delete();
        $user->delete();
        $this->revalidator->teacher($slug);

        return response()->json(['message' => 'Compte supprimé définitivement.']);
    }
}
