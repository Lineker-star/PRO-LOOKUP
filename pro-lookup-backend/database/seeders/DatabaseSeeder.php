<?php

namespace Database\Seeders;

use App\Services\FrontendRevalidator;
use Illuminate\Database\Seeder;

/**
 * Données de DÉMONSTRATION (local uniquement). Rejouable sans erreur.
 *
 *   php artisan db:seed
 *
 * En production, lancez seulement :
 *   php artisan db:seed --class=ReferenceSeeder --force
 *   php artisan db:seed --class=AdminSeeder --force      (avec ADMIN_EMAIL / ADMIN_PASSWORD)
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ReferenceSeeder::class,       // grades, catégories, écoles supérieures
            AdminSeeder::class,           // admin@iuztf.cm / Password123!
            PersonnelSeeder::class,       // enseignants approuvés fictifs, leurs publications et leur CV
            PendingRequestsSeeder::class, // inscriptions en attente à approuver ou refuser
        ]);

        // Les données ont changé sans passer par l'API : les pages publiques en cache sont vidées.
        app(FrontendRevalidator::class)->tags(['teachers', 'posts', 'stats', 'references']);
    }
}
