<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Rank;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $ranks = [
            ['name' => 'Professeur', 'slug' => 'professeur', 'order' => 1, 'badge_color' => '#D4A24C'],
            ['name' => 'Docteur', 'slug' => 'docteur', 'order' => 2, 'badge_color' => '#D4A24C'],
            ['name' => 'Ingénieur', 'slug' => 'ingenieur', 'order' => 3, 'badge_color' => '#00A9A5'],
            ['name' => 'Chercheur', 'slug' => 'chercheur', 'order' => 4, 'badge_color' => '#00A9A5'],
            ['name' => 'Étudiant', 'slug' => 'etudiant', 'order' => 5, 'badge_color' => '#E2E8F0'],
            ['name' => 'Personnel administratif', 'slug' => 'personnel-administratif', 'order' => 6, 'badge_color' => '#E2E8F0'],
        ];

        foreach ($ranks as $rank) {
            Rank::updateOrCreate(['slug' => $rank['slug']], $rank);
        }

        User::factory()->create([
            'first_name' => 'Administrateur',
            'last_name' => 'ZTF',
            'email' => 'admin@iuztf.cm',
            'password' => bcrypt('Password123!'),
            'role' => 'admin',
            'status' => 'approved',
            'slug' => 'administrateur-ztf',
            'rank_id' => Rank::where('slug', 'professeur')->value('id'),
        ]);
    }
}
