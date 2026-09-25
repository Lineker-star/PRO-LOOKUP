<?php

namespace App\Services;

use App\Models\ProfileSlugHistory;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Règles de l'URL de profil `/in/<identifiant>` (brief §6.4).
 */
class SlugService
{
    public const MIN = 3;
    public const MAX = 100;
    public const MAX_CHANGES = 5;
    public const WINDOW_DAYS = 180;

    /** Identifiants interdits : ils entreraient en conflit avec des routes de l'application. */
    public const RESERVED = [
        'admin', 'api', 'connexion', 'inscription', 'parametres', 'publications', 'recherche',
        'enseignants', 'espace', 'in', 'mot-de-passe-oublie', 'reinitialiser-mot-de-passe',
        'confidentialite', 'conditions', 'aide', 'contact', 'login', 'logout', 'register',
        'static', 'assets', 'storage', 'www', 'mail', 'root', 'support', 'pro-lookup', 'ztf',
    ];

    /** Transforme « Prénom Nom » en identifiant : minuscules, sans accents, tirets. */
    public function base(string $firstName, string $lastName): string
    {
        $slug = Str::slug(Str::ascii("{$firstName} {$lastName}"));
        $slug = Str::limit($slug, self::MAX - 4, '');

        return strlen($slug) >= self::MIN ? $slug : 'enseignant';
    }

    /** Génère un identifiant libre (suffixe -2, -3… en cas de doublon). */
    public function generateFor(User $user): string
    {
        $base = $this->base($user->first_name, $user->last_name);
        $slug = $base;
        $counter = 2;

        while (! $this->isAvailable($slug, $user)) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /** Erreur de format, ou null si l'identifiant est bien formé. */
    public function formatError(string $slug): ?string
    {
        if (strlen($slug) < self::MIN || strlen($slug) > self::MAX) {
            return 'L’identifiant doit contenir entre 3 et 100 caractères.';
        }
        if (! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return 'Utilisez uniquement des lettres minuscules, des chiffres et des tirets.';
        }
        if (in_array($slug, self::RESERVED, true)) {
            return 'Cet identifiant est réservé.';
        }

        return null;
    }

    /**
     * Un identifiant est libre s'il n'est porté par aucun autre profil et s'il n'est pas
     * un ancien identifiant d'un autre enseignant (jamais réattribué).
     */
    public function isAvailable(string $slug, ?User $for = null): bool
    {
        $takenByProfile = User::where('slug', $slug)
            ->when($for, fn ($q) => $q->where('id', '!=', $for->id))
            ->exists();

        $takenByHistory = ProfileSlugHistory::where('slug', $slug)
            ->when($for, fn ($q) => $q->where('user_id', '!=', $for->id))
            ->exists();

        return ! $takenByProfile && ! $takenByHistory;
    }

    /** Nombre de changements faits par l'enseignant sur la période glissante de 180 jours. */
    public function changesInWindow(User $user): int
    {
        return ProfileSlugHistory::where('user_id', $user->id)
            ->where('by_admin', false)
            ->where('created_at', '>=', Carbon::now()->subDays(self::WINDOW_DAYS))
            ->count();
    }

    public function remainingChanges(User $user): int
    {
        return max(0, self::MAX_CHANGES - $this->changesInWindow($user));
    }

    /** Date à laquelle un nouveau changement redeviendra possible (si la limite est atteinte). */
    public function nextChangeAt(User $user): ?Carbon
    {
        if ($this->remainingChanges($user) > 0) {
            return null;
        }

        $oldest = ProfileSlugHistory::where('user_id', $user->id)
            ->where('by_admin', false)
            ->where('created_at', '>=', Carbon::now()->subDays(self::WINDOW_DAYS))
            ->orderBy('created_at')
            ->first();

        return $oldest?->created_at->copy()->addDays(self::WINDOW_DAYS);
    }

    /**
     * Change l'identifiant d'un profil. L'ancien est conservé dans l'historique
     * pour la redirection 301.
     */
    public function change(User $user, string $newSlug, ?User $actor = null, bool $byAdmin = false): void
    {
        if ($error = $this->formatError($newSlug)) {
            throw ValidationException::withMessages(['slug' => [$error]]);
        }
        if ($newSlug === $user->slug) {
            return;
        }
        if (! $this->isAvailable($newSlug, $user)) {
            throw ValidationException::withMessages(['slug' => ['Cet identifiant est déjà utilisé.']]);
        }
        if (! $byAdmin && $this->remainingChanges($user) === 0) {
            throw ValidationException::withMessages([
                'slug' => ['Vous avez atteint la limite de 5 changements sur 180 jours.'],
            ]);
        }

        // Un enseignant qui reprend un de ses anciens identifiants le retire de l'historique.
        ProfileSlugHistory::where('user_id', $user->id)->where('slug', $newSlug)->delete();

        if ($user->slug) {
            ProfileSlugHistory::create([
                'user_id' => $user->id,
                'slug' => $user->slug,
                'changed_by' => $actor?->id,
                'by_admin' => $byAdmin,
            ]);
        }

        $user->slug = $newSlug;
        $user->save();
    }
}
