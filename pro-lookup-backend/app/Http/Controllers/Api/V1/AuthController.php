<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RegisterRequest;
use App\Http\Resources\V1\OwnerProfileResource;
use App\Models\RegistrationRequest;
use App\Models\User;
use App\Services\ImageStore;
use App\Support\Emails;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/** Inscription, connexion, déconnexion et mot de passe oublié (brief §5). */
class AuthController extends Controller
{
    /**
     * Demande d'inscription d'un enseignant. Le compte est créé « en attente »,
     * le justificatif est stocké sur le disque PRIVÉ, les administrateurs sont prévenus.
     */
    public function register(RegisterRequest $request, ImageStore $images): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data, $request, $images) {
            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => strtolower($data['email']),
                'password' => $data['password'],
                'faculty_id' => $data['faculty_id'],
                'department_id' => $data['department_id'],
                'rank_id' => $data['grade_id'],
                'title' => $data['title'] ?? null,
                'expertise' => $data['expertise'] ?? null,
                'matricule' => $data['matricule'],
            ]);
            // Rôle et statut fixés côté serveur, jamais lus dans la requête.
            $user->role = User::ROLE_TEACHER;
            $user->status = UserStatus::Pending->value;
            $user->department = optional($user->departmentRef()->first())->name;

            if ($request->hasFile('photo')) {
                $user->avatar_path = $images->store($request->file('photo'), 'avatars', 800);
            }
            $user->save();

            $document = $request->file('document');
            RegistrationRequest::create([
                'user_id' => $user->id,
                'matricule' => $data['matricule'],
                'document_path' => $document->store('justificatifs', 'local'),
                'document_name' => $document->getClientOriginalName(),
                'document_mime' => $document->getMimeType(),
                'status' => 'pending',
            ]);

            return $user;
        });

        Emails::registrationReceived($user);
        Emails::newRegistrationForAdmins($user);

        return response()->json([
            'message' => 'Demande envoyée — en attente de validation par l’administration.',
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => (new OwnerProfileResource($user->fresh(['rank', 'faculty', 'departmentRef', 'registrationRequest'])))->resolve(),
        ], 201);
    }

    /**
     * Connexion. Message d'erreur unique, quel que soit le champ en cause (brief §5.3).
     * Les comptes en attente, refusés ou suspendus peuvent se connecter pour voir leur situation.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Email ou mot de passe incorrect.']]);
        }

        // « Rester connecté » : jeton valable 30 jours, sinon 12 heures.
        $expiresAt = ($data['remember'] ?? false) ? now()->addDays(30) : now()->addHours(12);
        $token = $user->createToken($request->userAgent() ? substr($request->userAgent(), 0, 120) : 'navigateur', ['*'], $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => (new OwnerProfileResource($user->load(['rank', 'faculty', 'departmentRef', 'registrationRequest', 'profileItems'])))->resolve(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Vous êtes déconnecté.']);
    }

    /** Toujours la même réponse, que l'email existe ou non (pas de fuite d'information). */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink(['email' => strtolower($request->input('email'))]);

        return response()->json([
            'message' => 'Si un compte existe pour cette adresse, un email contenant un lien de réinitialisation vient d’être envoyé.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password, 'email_verified_at' => $user->email_verified_at ?? now()])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => ['Ce lien de réinitialisation est invalide ou a expiré.']]);
        }

        return response()->json(['message' => 'Votre mot de passe a été modifié. Vous pouvez vous connecter.']);
    }
}
