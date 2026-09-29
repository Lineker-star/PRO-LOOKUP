<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProfileSection;
use App\Enums\UserStatus;
use App\Http\Controllers\Concerns\ManagesTeacherProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ProfileItemRequest;
use App\Http\Requests\V1\UpdateProfileRequest;
use App\Http\Resources\V1\OwnerProfileResource;
use App\Models\ProfileItem;
use App\Models\RegistrationRequest;
use App\Models\User;
use App\Services\FrontendRevalidator;
use App\Services\ImageStore;
use App\Services\SlugService;
use App\Support\Emails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/** Espace enseignant (zone B) : gestion de son propre compte et de son profil. */
class MeController extends Controller
{
    use ManagesTeacherProfile;

    public function __construct(private FrontendRevalidator $revalidator)
    {
    }

    private function profile(User $user): array
    {
        return (new OwnerProfileResource($user->fresh(['rank', 'registrationRequest', 'profileItems'])))->resolve();
    }

    /** Prévient Next.js si le profil est public (seuls les profils approuvés sont en cache public). */
    private function touchPublic(User $user, array $oldSlugs = []): void
    {
        if ($user->isApproved()) {
            $this->revalidator->teacher($user->slug, array_map(fn ($s) => "teacher:{$s}", $oldSlugs));
        }
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->profile($request->user())]);
    }

    /** État du compte, pour l'écran « en attente / refusé / suspendu ». */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user()->load('registrationRequest');

        return response()->json(['data' => [
            'status' => $user->status,
            'role' => $user->isAdmin() ? 'admin' : 'teacher',
            'registration_status' => $user->registrationRequest?->status,
            'rejection_reason' => $user->registrationRequest?->reason ?? $user->rejection_reason,
            'suspension_reason' => $user->suspension_reason,
            'submitted_at' => $user->registrationRequest?->created_at?->toIso8601String(),
        ]]);
    }

    /** Modification du profil. Un compte en attente modifie son brouillon (non public). */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->applyProfileFields($user, $request->validated());
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user), 'message' => 'Profil enregistré.']);
    }

    /** Photo de profil ou bannière (image ré-encodée, sans métadonnées). */
    public function uploadImage(Request $request, ImageStore $images, string $kind): JsonResponse
    {
        abort_unless(in_array($kind, ['avatar', 'banner'], true), 404);
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']]);

        $user = $request->user();
        $this->storeTeacherImage($user, $images, $request->file('image'), $kind);
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user), 'message' => 'Image enregistrée.']);
    }

    public function deleteImage(Request $request, ImageStore $images, string $kind): JsonResponse
    {
        abort_unless(in_array($kind, ['avatar', 'banner'], true), 404);
        $user = $request->user();
        $this->removeTeacherImage($user, $images, $kind);
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user)]);
    }

    // ------------------------------------------------------------------ CV (PDF)

    /**
     * Dépôt (ou remplacement) du CV. PDF uniquement, 10 Mo maximum, vérifié sur son contenu
     * (signature « %PDF »). Rangé sur le disque privé, sous un nom aléatoire.
     */
    public function uploadCv(Request $request): JsonResponse
    {
        $request->validate(
            ['cv' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:10240']],
            ['cv.mimes' => 'Le CV doit être un fichier PDF.', 'cv.mimetypes' => 'Le CV doit être un fichier PDF.', 'cv.max' => 'Le CV ne doit pas dépasser 10 Mo.'],
        );

        $user = $request->user();
        $this->storeTeacherCv($user, $request->file('cv'));
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user), 'message' => 'CV enregistré.']);
    }

    public function deleteCv(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->removeTeacherCv($user);
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user), 'message' => 'CV retiré.']);
    }

    /** Le propriétaire consulte son propre CV, quel que soit le statut du compte. */
    public function downloadCv(Request $request)
    {
        $user = $request->user();
        abort_unless($user->cv_path && Storage::disk('local')->exists($user->cv_path), 404);

        return Storage::disk('local')->response($user->cv_path, self::cvFileName($user), ['Content-Type' => 'application/pdf']);
    }

    /** Nom du fichier proposé au téléchargement : « cv-prenom-nom.pdf ». */
    public static function cvFileName(User $user): string
    {
        return 'cv-'.(Str::slug(Str::ascii($user->full_name)) ?: 'enseignant').'.pdf';
    }

    // ------------------------------------------------------------------ Sections répétables

    public function storeItem(ProfileItemRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->addTeacherProfileItem($user, $request->validated());
        $this->touchPublic($user);

        return response()->json(['data' => $this->profile($user)], 201);
    }

    public function updateItem(ProfileItemRequest $request, ProfileItem $item): JsonResponse
    {
        abort_unless($item->user_id === $request->user()->id, 404);
        $item->update($request->safe()->except('section'));
        $this->touchPublic($request->user());

        return response()->json(['data' => $this->profile($request->user())]);
    }

    public function destroyItem(Request $request, ProfileItem $item): JsonResponse
    {
        abort_unless($item->user_id === $request->user()->id, 404);
        $item->delete();
        $this->touchPublic($request->user());

        return response()->json(['data' => $this->profile($request->user())]);
    }

    // ------------------------------------------------------------------ Nouvelle demande après refus

    public function resubmit(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->status !== UserStatus::Rejected->value) {
            return response()->json(['message' => 'Seule une demande refusée peut être renouvelée.'], 422);
        }

        $data = $request->validate([
            'matricule' => ['required', 'string', 'max:50'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        RegistrationRequest::create([
            'user_id' => $user->id,
            'matricule' => $data['matricule'],
            'document_path' => $request->file('document')->store('justificatifs', 'local'),
            'document_name' => $request->file('document')->getClientOriginalName(),
            'document_mime' => $request->file('document')->getMimeType(),
            'status' => 'pending',
        ]);
        $user->matricule = $data['matricule'];
        $user->status = UserStatus::Pending->value;
        $user->rejection_reason = null;
        $user->save();

        Emails::registrationReceived($user);
        Emails::newRegistrationForAdmins($user);

        return response()->json(['data' => $this->profile($user), 'message' => 'Nouvelle demande envoyée.']);
    }

    // ------------------------------------------------------------------ Mon profil public (§6.6)

    public function publicProfile(Request $request, SlugService $slugs): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'slug' => $user->slug,
            // Profil visible dans l'annuaire ? Toujours vrai pour un enseignant ; au choix pour un administrateur.
            'teaches' => (bool) $user->teaches,
            'can_toggle_teaches' => $user->isAdmin(),
            'sections' => $user->sectionVisibility(),
            'show_email' => (bool) $user->show_email,
            'show_phone' => (bool) $user->show_phone,
            'show_office' => (bool) $user->show_office,
            'search_indexable' => (bool) $user->search_indexable,
            'slug_changes_remaining' => $slugs->remainingChanges($user),
            'slug_next_change_at' => $slugs->nextChangeAt($user)?->toIso8601String(),
            'slug_rules' => ['min' => SlugService::MIN, 'max' => SlugService::MAX, 'max_changes' => SlugService::MAX_CHANGES, 'window_days' => SlugService::WINDOW_DAYS],
        ]]);
    }

    public function updatePublicProfile(Request $request, SlugService $slugs): JsonResponse
    {
        $sectionKeys = array_map(fn (ProfileSection $s) => $s->value, ProfileSection::cases());
        $data = $request->validate([
            'sections' => ['sometimes', 'array'],
            'sections.*' => ['boolean'],
            'show_email' => ['sometimes', 'boolean'],
            'show_phone' => ['sometimes', 'boolean'],
            'show_office' => ['sometimes', 'boolean'],
            'search_indexable' => ['sometimes', 'boolean'],
            'teaches' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        // Un administrateur qui enseigne aussi peut publier son profil public
        // (son rôle d'administrateur n'y apparaît jamais). Un enseignant, lui, est toujours public.
        if (array_key_exists('teaches', $data)) {
            if (! $user->isAdmin()) {
                return response()->json(['message' => 'Seul un administrateur peut masquer ou afficher son profil enseignant.'], 403);
            }
            $user->teaches = $data['teaches'];
            if ($user->teaches && ! $user->slug) {
                $user->slug = $slugs->generateFor($user);
            }
        }

        if (isset($data['sections'])) {
            $user->public_sections = array_intersect_key(
                array_merge($user->sectionVisibility(), array_map('boolval', $data['sections'])),
                array_flip($sectionKeys)
            );
        }
        foreach (['show_email', 'show_phone', 'show_office', 'search_indexable'] as $key) {
            if (array_key_exists($key, $data)) {
                $user->{$key} = $data[$key];
            }
        }
        $user->save();
        $this->touchPublic($user);

        return $this->publicProfile($request, $slugs);
    }

    /** Vérification en direct de la disponibilité d'un identifiant. */
    public function slugAvailability(Request $request, SlugService $slugs): JsonResponse
    {
        $slug = strtolower(trim((string) $request->query('slug', '')));
        $error = $slugs->formatError($slug);
        $current = $slug === $request->user()->slug;
        $available = ! $error && ($current || $slugs->isAvailable($slug, $request->user()));

        return response()->json([
            'slug' => $slug,
            'available' => $available,
            'current' => $current,
            'message' => $error ?? ($available ? 'Cet identifiant est disponible.' : 'Cet identifiant est déjà utilisé.'),
        ]);
    }

    public function updateSlug(Request $request, SlugService $slugs): JsonResponse
    {
        $data = $request->validate(['slug' => ['required', 'string']]);
        $user = $request->user();
        $old = $user->slug;
        $slugs->change($user, strtolower(trim($data['slug'])), $user);
        $this->touchPublic($user, array_filter([$old]));

        return $this->publicProfile($request, $slugs);
    }

    // ------------------------------------------------------------------ Sécurité

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['Le mot de passe actuel est incorrect.']]);
        }

        $user->password = $data['password'];
        $user->save();
        // Les autres sessions sont fermées par sécurité.
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Mot de passe modifié. Vos autres sessions ont été fermées.']);
    }

    public function sessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->id;

        return response()->json(['data' => $request->user()->tokens()->latest('last_used_at')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'last_used_at' => $t->last_used_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
            'expires_at' => $t->expires_at?->toIso8601String(),
            'current' => $t->id === $currentId,
        ])]);
    }

    public function revokeSession(Request $request, int $id): JsonResponse
    {
        $request->user()->tokens()->where('id', $id)->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return $this->sessions($request);
    }

    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return $this->sessions($request);
    }

    /** Langue préférée de l'interface (FR/EN), stockée côté client ; accepte ici un simple écho. */
    public function settings(Request $request): JsonResponse
    {
        $request->validate(['locale' => ['sometimes', Rule::in(['fr', 'en'])]]);

        return response()->json(['message' => 'Préférences enregistrées.']);
    }
}
