<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Données de démarrage. Rejouable sans erreur (updateOrCreate partout).
 * Compte administrateur de démonstration : admin@iuztf.cm / Password123!
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(ReferenceSeeder::class);

        $admin = User::updateOrCreate(['email' => 'admin@iuztf.cm'], [
            'first_name' => 'Administrateur',
            'last_name' => 'PRO-LOOKUP',
            'password' => Hash::make('Password123!'),
        ]);
        // Rôle et statut hors $fillable : affectés explicitement.
        $admin->role = User::ROLE_ADMIN;
        $admin->status = 'approved';
        $admin->slug = null; // un administrateur n'a pas de profil public
        $admin->email_verified_at ??= now();
        $admin->save();

        $this->call(PersonnelSeeder::class);
    }
}
