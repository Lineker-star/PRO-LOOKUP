<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Listes de référence. Les facultés et départements sont PROVISOIRES :
 * la liste officielle reste à fournir par l'université (brief §17, point 2).
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
        // Anciens rangs du modèle « réseau social » : désactivés, pas supprimés.
        Rank::whereNotIn('slug', array_map(fn ($g) => Str::slug($g), $grades))->update(['is_active' => false]);

        $faculties = [
            'Faculté des Sciences et Technologies' => ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie'],
            'Faculté des Sciences de l’Ingénieur' => ['Génie civil', 'Génie électrique et énergétique', 'Génie agronomique'],
            'Faculté des Sciences Économiques et de Gestion' => ['Économie', 'Gestion et comptabilité'],
            'Faculté des Lettres et Sciences Humaines' => ['Langues et littératures', 'Histoire et géographie', 'Sciences de l’éducation'],
        ];
        $position = 0;
        foreach ($faculties as $facultyName => $departments) {
            $faculty = Faculty::updateOrCreate(['slug' => Str::slug(Str::ascii($facultyName))], [
                'name' => $facultyName, 'position' => ++$position, 'is_active' => true,
            ]);
            foreach ($departments as $departmentName) {
                Department::updateOrCreate(
                    ['faculty_id' => $faculty->id, 'slug' => Str::slug(Str::ascii($departmentName))],
                    ['name' => $departmentName, 'is_active' => true],
                );
            }
        }

        foreach (['Actualité', 'Article', 'Événement', 'Annonce', 'Travaux de recherche'] as $i => $name) {
            PostCategory::updateOrCreate(['slug' => Str::slug(Str::ascii($name))], ['name' => $name, 'position' => $i + 1, 'is_active' => true]);
        }
    }
}
