<?php

namespace Tests;

use App\Models\Department;
use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected Faculty $faculty;
    protected Department $dept;
    protected Rank $grade;
    protected PostCategory $category;

    /** Crée un jeu minimal de référentiels (faculté, département, grade, catégorie). */
    protected function seedReferences(): void
    {
        $this->faculty = Faculty::create(['name' => 'Faculté des Sciences', 'slug' => 'sciences']);
        $this->dept = Department::create(['faculty_id' => $this->faculty->id, 'name' => 'Informatique', 'slug' => 'informatique']);
        $this->grade = Rank::create(['name' => 'Professeur', 'slug' => 'professeur', 'order' => 1, 'is_active' => true]);
        $this->category = PostCategory::create(['name' => 'Actualité', 'slug' => 'actualite']);
    }
}
