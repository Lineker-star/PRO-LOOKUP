<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Listes de référence gérées ensuite par l'administration.
 * Les écoles supérieures sont PROVISOIRES : la liste officielle reste à fournir par l'université
 * (brief §17, point 2). Elles servent de suggestions à la saisie et de filtres ;
 * l'enseignant saisit librement son école et son département / filière.
 */
class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        // Grades du brief (§6.3) : même traitement visuel pour tous.
        $grades = ['Professeur', 'Maître de conférences', 'Chargé de cours', 'Assistant', 'Enseignant vacataire'];
        foreach ($grades as $i => $name) {
            Rank::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name, 'order' => $i + 1, 'badge_color' => '#D4A24C', 'is_active' => true,
            ]);
        }
        // Anciens rangs du modèle « réseau social » (désactivés auparavant) : supprimés.
        Rank::where('is_active', false)->whereNotIn('slug', array_map(fn ($g) => Str::slug($g), $grades))->get()
            ->each(function (Rank $rank) {
                $rank->users()->update(['rank_id' => null]);
                $rank->delete();
            });

        $schools = [
            'École Supérieure des Sciences et Technologies',
            'École Supérieure des Sciences de l’Ingénieur',
            'École Supérieure des Sciences Économiques et de Gestion',
            'École Supérieure des Lettres et Sciences Humaines',
        ];
        foreach ($schools as $i => $name) {
            Faculty::updateOrCreate(['slug' => Str::slug(Str::ascii($name))], ['name' => $name, 'position' => $i + 1, 'is_active' => true]);
        }

        foreach (['Actualité', 'Article', 'Événement', 'Annonce', 'Travaux de recherche'] as $i => $name) {
            PostCategory::updateOrCreate(['slug' => Str::slug(Str::ascii($name))], ['name' => $name, 'position' => $i + 1, 'is_active' => true]);
        }
    }
}
