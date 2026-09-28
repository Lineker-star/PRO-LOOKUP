<?php

namespace Tests;

use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** École supérieure de la liste gérée par l'administration. */
    protected Faculty $school;
    protected Rank $grade;
    protected PostCategory $category;

    /** Crée un jeu minimal de référentiels (école supérieure, grade, catégorie). */
    protected function seedReferences(): void
    {
        $this->school = Faculty::create(['name' => 'École Supérieure des Sciences et Technologies', 'slug' => 'ecole-superieure-des-sciences-et-technologies']);
        $this->grade = Rank::create(['name' => 'Professeur', 'slug' => 'professeur', 'order' => 1, 'is_active' => true]);
        $this->category = PostCategory::create(['name' => 'Actualité', 'slug' => 'actualite']);
    }
}
