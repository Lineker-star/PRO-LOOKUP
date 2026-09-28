<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Compte administrateur.
 *
 *   php artisan db:seed --class=AdminSeeder
 *
 * Identifiants lus dans le .env (ou dans la ligne de commande) :
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME
 *
 * En local, des valeurs par défaut sont utilisées (admin@iuztf.cm / Password123!).
 * En production, ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires.
 * Rejouable : si le compte existe, il est mis à jour (nom, mot de passe, rôle) ; son profil
 * public éventuel (administrateur qui enseigne) est conservé.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $production = app()->environment('production');
        $email = env('ADMIN_EMAIL') ?: ($production ? null : 'admin@iuztf.cm');
        $password = env('ADMIN_PASSWORD') ?: ($production ? null : 'Password123!');

        if (! $email || ! $password) {
            throw new RuntimeException('En production, définissez ADMIN_EMAIL et ADMIN_PASSWORD avant de lancer AdminSeeder.');
        }
        if ($production && strlen($password) < 12) {
            throw new RuntimeException('En production, ADMIN_PASSWORD doit contenir au moins 12 caractères.');
        }

        $admin = User::firstOrNew(['email' => strtolower($email)]);
        $admin->fill([
            'first_name' => env('ADMIN_FIRST_NAME', 'Administrateur'),
            'last_name' => env('ADMIN_LAST_NAME', 'PRO-LOOKUP'),
            'password' => $password,
        ]);
        // Rôle et statut hors $fillable : affectés explicitement.
        $admin->role = User::ROLE_ADMIN;
        $admin->status = 'approved';
        if (! $admin->exists) {
            // Nouveau compte : pas de profil public. L'administrateur qui enseigne l'activera
            // lui-même depuis son espace (Profil public), sans que son rôle y apparaisse.
            $admin->teaches = false;
            $admin->slug = null;
        }
        $admin->email_verified_at ??= now();
        $admin->save();

        $this->command?->info("Administrateur prêt : {$admin->email}".($production ? '' : " (mot de passe : {$password})"));
    }
}
