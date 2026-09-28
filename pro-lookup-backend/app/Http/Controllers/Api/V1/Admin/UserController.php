<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\OwnerProfileResource;
use App\Http\Resources\V1\Refs;
use App\Models\AdminAuditLog;
use App\Models\Faculty;
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

/**
 * Gestion des comptes (enseignants et administrateurs).
 *
 * Règle : l'administration NE MODIFIE JAMAIS les informations ni le profil d'un enseignant,
 * qu'il soit en attente ou déjà validé. Elle peut uniquement : consulter, créer un compte
 * directement, suspendre / réactiver, supprimer, nommer ou retirer un administrateur.
 */
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
            'role' => $user->isAdmin() ? 'admin' : 'teacher',
            'teaches' => (bool) $user->teaches,
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
        $user->load(['rank', 'registrationRequest', 'profileItems']);

        return [
            ...OwnerProfileResource::forAdmin($user)->resolve(),
            'admins_count' => User::where('role', User::ROLE_ADMIN)->count(),
            'history' => AdminAuditLog::with('admin')
                ->where('target_type', 'user')->where('target_id', $user->id)
                ->latest('created_at')->limit(30)->get()
                ->map(fn ($l) => AuditController::present($l)),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $school = $request->filled('school') ? Faculty::find($request->query('school')) : null;

        $users = User::query()
            ->with('rank')
            ->withCount('posts')
            ->when($status === 'admin', fn ($q) => $q->where('role', User::ROLE_ADMIN))
            ->when(in_array($status, ['pending', 'approved', 'rejected', 'suspended'], true), fn ($q) => $q->where('status', $status))
            ->when($request->filled('grade'), fn ($q) => $q->where('rank_id', $request->query('grade')))
            ->when($school, fn ($q) => $q->inSchool($school))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $sub->whereRaw('LOWER(first_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(matricule, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(school, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(department, \'\')) LIKE ?', [$term]);
            }))
            ->orderBy('last_name')->orderBy('first_name')
            ->paginate(20);

        $counts = User::query()->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'data' => $users->getCollection()->map(fn ($u) => $this->row($u)),
            'meta' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total()],
            'counts' => [
                'all' => (int) $counts->sum(),
                'approved' => (int) ($counts['approved'] ?? 0),
                'pending' => (int) ($counts['pending'] ?? 0),
                'suspended' => (int) ($counts['suspended'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'admin' => User::where('role', User::ROLE_ADMIN)->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->detail(User::findOrFail($id))]);
    }

    /** Création directe : compte approuvé d'office, email pour définir le mot de passe (brief §5.2). */
    public function store(Request $request, SlugService $slugs): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'grade_id' => ['required', 'integer', Rule::exists('ranks', 'id')->where('is_active', true)],
            'school' => ['required', 'string', 'max:150'],
            'department' => ['required', 'string', 'max:150'],
            'title' => ['nullable', 'string', 'max:150'],
            'expertise' => ['nullable', 'string', 'max:150'],
            'matricule' => ['nullable', 'string', 'max:50'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ], [
            'email.unique' => 'Un compte existe déjà avec cette adresse email.',
            'school.required' => 'Indiquez l’école supérieure de l’enseignant.',
            'department.required' => 'Indiquez le département ou la filière de l’enseignant.',
        ]);

        $user = DB::transaction(function () use ($data, $request, $slugs) {
            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => strtolower($data['email']),
                // Mot de passe aléatoire inutilisable : l'enseignant définit le sien via l'email reçu.
                'password' => Str::random(40),
                'rank_id' => $data['grade_id'],
                'school' => trim($data['school']),
                'faculty_id' => Faculty::idForName($data['school']),
                'department' => trim($data['department']),
                'title' => $data['title'] ?? null,
                'expertise' => $data['expertise'] ?? null,
                'matricule' => $data['matricule'] ?? null,
            ]);
            $user->role = User::ROLE_TEACHER;
            $user->status = UserStatus::Approved->value;
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

    /** Un administrateur doit d'abord perdre ce rôle avant d'être suspendu ou supprimé. */
    private function refuseForAdmin(User $user): ?JsonResponse
    {
        return $user->isAdmin()
            ? response()->json(['message' => 'Ce compte est administrateur : retirez-lui d’abord ce rôle.'], 422)
            : null;
    }

    /** Suspension : profil ET publications retirés immédiatement des pages publiques. */
    public function suspend(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']], [
            'reason.required' => 'Le motif de la suspension est obligatoire.',
        ]);
        if ($refusal = $this->refuseForAdmin($user)) {
            return $refusal;
        }
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
        $user = User::findOrFail($id);
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

    /**
     * Nommer administrateur un compte approuvé. Il garde son profil public d'enseignant,
     * qui ne mentionne jamais ce rôle.
     */
    public function promote(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Ce compte est déjà administrateur.'], 422);
        }
        if ($user->status !== UserStatus::Approved->value) {
            return response()->json(['message' => 'Seul un compte approuvé peut être nommé administrateur.'], 422);
        }

        $user->role = User::ROLE_ADMIN;
        $user->save();

        $this->audit->log($request->user(), 'user.promoted', $user, $request->input('reason'));
        Emails::promoted($user);

        return response()->json(['message' => "{$user->full_name} est désormais administrateur.", 'data' => $this->detail($user)]);
    }

    /** Retirer le rôle d'administrateur (jamais à soi-même, jamais au dernier administrateur). */
    public function demote(Request $request, int $id, SlugService $slugs): JsonResponse
    {
        $user = User::findOrFail($id);
        if (! $user->isAdmin()) {
            return response()->json(['message' => 'Ce compte n’est pas administrateur.'], 422);
        }
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas retirer vos propres droits d’administrateur.'], 422);
        }
        if (User::where('role', User::ROLE_ADMIN)->count() <= 1) {
            return response()->json(['message' => 'La plateforme doit garder au moins un administrateur.'], 422);
        }

        // Redevenu enseignant, son profil est public.
        $user->role = User::ROLE_TEACHER;
        $user->teaches = true;
        if (! $user->slug) {
            $user->slug = $slugs->generateFor($user);
        }
        $user->save();
        $user->tokens()->delete(); // ses sessions ouvertes n'ont plus accès à l'administration

        $this->audit->log($request->user(), 'user.demoted', $user, $request->input('reason'));
        Emails::demoted($user);
        $this->revalidator->teacher($user->slug);

        return response()->json(['message' => "{$user->full_name} n’est plus administrateur.", 'data' => $this->detail($user)]);
    }

    /** Suppression définitive, confirmée par la saisie de l'email du compte. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate(['confirm_email' => ['required', 'string'], 'reason' => ['required', 'string', 'min:5']]);
        if ($refusal = $this->refuseForAdmin($user)) {
            return $refusal;
        }
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
