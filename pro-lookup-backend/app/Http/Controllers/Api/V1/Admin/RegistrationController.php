<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\OwnerProfileResource;
use App\Http\Resources\V1\Refs;
use App\Models\RegistrationRequest;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use App\Services\SlugService;
use App\Support\Emails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Demandes d'inscription : liste, fiche détaillée avec justificatif, approbation, refus. */
class RegistrationController extends Controller
{
    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    /** Résumé d'une demande pour les listes. */
    public static function summary(RegistrationRequest $r): array
    {
        $user = $r->user;

        return [
            'id' => $r->id,
            'status' => $r->status,
            'matricule' => $r->matricule,
            'submitted_at' => $r->created_at?->toIso8601String(),
            'processed_at' => $r->processed_at?->toIso8601String(),
            'reason' => $r->reason,
            'document_name' => $r->document_name,
            'has_document' => (bool) $r->document_path,
            'user' => $user ? [
                'id' => $user->id,
                'email' => $user->email,
                'status' => $user->status,
                ...Refs::teacherCard($user),
            ] : null,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending');
        $search = trim((string) $request->query('q', ''));

        $requests = RegistrationRequest::query()
            ->when(in_array($status, ['pending', 'approved', 'rejected'], true), fn ($q) => $q->where('status', $status))
            ->when($request->filled('faculty'), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('faculty_id', $request->query('faculty'))))
            ->when($request->filled('grade'), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('rank_id', $request->query('grade'))))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $sub->whereRaw('LOWER(matricule) LIKE ?', [$term])
                    ->orWhereHas('user', fn ($u) => $u->whereRaw('LOWER(first_name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$term]));
            }))
            ->with(['user.rank', 'user.faculty', 'user.departmentRef'])
            ->orderBy('created_at', $status === 'pending' ? 'asc' : 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $requests->getCollection()->map(fn ($r) => self::summary($r)),
            'meta' => ['current_page' => $requests->currentPage(), 'last_page' => $requests->lastPage(), 'total' => $requests->total()],
            'counts' => [
                'pending' => RegistrationRequest::where('status', 'pending')->count(),
                'approved' => RegistrationRequest::where('status', 'approved')->count(),
                'rejected' => RegistrationRequest::where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function show(RegistrationRequest $registration): JsonResponse
    {
        $registration->load(['user.rank', 'user.faculty', 'user.departmentRef', 'user.profileItems', 'processor']);

        return response()->json(['data' => [
            ...self::summary($registration),
            'document_mime' => $registration->document_mime,
            'processed_by' => $registration->processor?->full_name,
            'profile' => OwnerProfileResource::forAdmin($registration->user)->resolve(),
        ]]);
    }

    /** Justificatif (disque privé) : servi uniquement aux administrateurs. */
    public function document(RegistrationRequest $registration): StreamedResponse|JsonResponse
    {
        if (! $registration->document_path || ! Storage::disk('local')->exists($registration->document_path)) {
            return response()->json(['message' => 'Justificatif introuvable (supprimé après traitement ?).'], 404);
        }

        return Storage::disk('local')->response(
            $registration->document_path,
            $registration->document_name,
            ['Content-Type' => $registration->document_mime ?? 'application/octet-stream', 'Cache-Control' => 'private, no-store'],
        );
    }

    public function approve(Request $request, RegistrationRequest $registration, SlugService $slugs): JsonResponse
    {
        if ($registration->status !== 'pending') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $user = $registration->user;
        DB::transaction(function () use ($request, $registration, $user, $slugs) {
            $user->status = UserStatus::Approved->value;
            $user->approved_by = $request->user()->id;
            $user->approved_at = now();
            $user->rejection_reason = null;
            $user->matricule = $registration->matricule;
            // L'identifiant d'URL est créé à l'approbation (brief §6.4).
            if (! $user->slug) {
                $user->slug = $slugs->generateFor($user);
            }
            $user->save();

            $registration->update(['status' => 'approved', 'processed_by' => $request->user()->id, 'processed_at' => now()]);
            $this->audit->log($request->user(), 'registration.approved', $user, null, ['request_id' => $registration->id]);
        });

        Emails::approved($user);
        $this->revalidator->teacher($user->slug);

        return response()->json(['message' => 'Demande approuvée : le profil est maintenant public.', 'data' => self::summary($registration->fresh('user'))]);
    }

    public function reject(Request $request, RegistrationRequest $registration): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']], [
            'reason.required' => 'Le motif du refus est obligatoire.',
        ]);
        if ($registration->status !== 'pending') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $user = $registration->user;
        DB::transaction(function () use ($request, $registration, $user, $data) {
            $user->status = UserStatus::Rejected->value;
            $user->rejection_reason = $data['reason'];
            $user->save();
            $registration->update([
                'status' => 'rejected',
                'reason' => $data['reason'],
                'processed_by' => $request->user()->id,
                'processed_at' => now(),
            ]);
            $this->audit->log($request->user(), 'registration.rejected', $user, $data['reason'], ['request_id' => $registration->id]);
        });

        Emails::rejected($user, $data['reason']);

        return response()->json(['message' => 'Demande refusée. L’enseignant a été prévenu par email.', 'data' => self::summary($registration->fresh('user'))]);
    }
}
