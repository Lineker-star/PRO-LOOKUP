<?php

namespace Tests\Feature\V1;

use App\Models\Post;
use App\Models\ProfileSlugHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Espace enseignant approuvé : publications, profil public, URL (brief §6, §7). */
class TeacherSpaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedReferences();
    }

    public function test_teacher_manages_own_posts_and_content_is_sanitized(): void
    {
        $teacher = User::factory()->create();

        $id = $this->actingAs($teacher)->postJson('/api/v1/me/posts', [
            'title' => 'Mon article',
            'content' => '<p onclick="alert(1)">Bonjour <script>alert(1)</script><strong>monde</strong></p>',
            'category_id' => $this->category->id,
            'status' => 'draft',
        ])->assertCreated()->json('data.id');

        $post = Post::findOrFail($id);
        $this->assertStringNotContainsString('script', $post->content);
        $this->assertStringNotContainsString('onclick', $post->content);
        $this->assertStringContainsString('<strong>monde</strong>', $post->content);
        $this->getJson("/api/v1/public/posts/{$id}")->assertNotFound();

        $this->actingAs($teacher)->putJson("/api/v1/me/posts/{$id}", [
            'title' => 'Mon article', 'content' => 'Texte publié', 'category_id' => $this->category->id, 'status' => 'published',
        ])->assertOk()->assertJsonPath('data.status', 'published');
        $this->getJson("/api/v1/public/posts/{$id}")->assertOk();

        $this->actingAs($teacher)->deleteJson("/api/v1/me/posts/{$id}")->assertOk();
        $this->assertDatabaseMissing('posts', ['id' => $id]);
    }

    public function test_teacher_cannot_touch_someone_elses_post(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->for($owner)->create();

        $this->actingAs($other)->getJson("/api/v1/me/posts/{$post->id}")->assertNotFound();
        $this->actingAs($other)->putJson("/api/v1/me/posts/{$post->id}", [
            'content' => 'Piratage', 'category_id' => $this->category->id, 'status' => 'published',
        ])->assertNotFound();
        $this->actingAs($other)->deleteJson("/api/v1/me/posts/{$post->id}")->assertNotFound();
        $this->assertDatabaseHas('posts', ['id' => $post->id]);
    }

    public function test_profile_update_cannot_change_role_status_or_raw_grade(): void
    {
        $teacher = User::factory()->create(['rank_id' => $this->grade->id]);

        $this->actingAs($teacher)->putJson('/api/v1/me/profile', [
            'bio' => 'Nouvelle bio', 'role' => 'admin', 'status' => 'approved', 'rank_id' => 999, 'teaches' => false,
        ])->assertOk();

        $teacher->refresh();
        $this->assertSame('Nouvelle bio', $teacher->bio);
        $this->assertSame('member', $teacher->role);
        $this->assertSame($this->grade->id, $teacher->rank_id);
        $this->assertTrue($teacher->teaches);
    }

    public function test_teacher_updates_own_grade_school_and_department(): void
    {
        $teacher = User::factory()->create(['slug' => 'prof-y', 'school' => 'Ancienne école', 'faculty_id' => null]);
        $other = \App\Models\Rank::create(['name' => 'Assistant', 'slug' => 'assistant', 'order' => 2, 'is_active' => true]);

        $this->actingAs($teacher)->putJson('/api/v1/me/profile', ['grade_id' => 999])
            ->assertUnprocessable()->assertJsonValidationErrors('grade_id');
        $this->actingAs($teacher)->putJson('/api/v1/me/profile', ['school' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors('school');

        $this->actingAs($teacher)->putJson('/api/v1/me/profile', [
            'grade_id' => $other->id, 'school' => 'ÉCOLE SUPÉRIEURE DES SCIENCES ET TECHNOLOGIES', 'department' => 'Génie logiciel',
        ])->assertOk();

        $teacher->refresh();
        $this->assertSame($other->id, $teacher->rank_id);
        $this->assertSame($this->school->id, $teacher->faculty_id);
        $this->getJson('/api/v1/public/teachers/prof-y')
            ->assertJsonPath('data.grade.name', 'Assistant')
            ->assertJsonPath('data.department', 'Génie logiciel');
    }

    public function test_admin_who_teaches_has_a_public_profile_without_role(): void
    {
        $admin = User::factory()->admin()->create(['first_name' => 'Ada', 'last_name' => 'Nkolo']);
        $teacher = User::factory()->create();

        $this->getJson('/api/v1/public/teachers')->assertJsonCount(1, 'data');

        // Un enseignant ne peut pas se retirer de l'annuaire.
        $this->actingAs($teacher)->putJson('/api/v1/me/public-profile', ['teaches' => false])->assertForbidden();

        $this->actingAs($admin)->getJson('/api/v1/me/public-profile')->assertJsonPath('data.can_toggle_teaches', true);
        $this->actingAs($admin)->putJson('/api/v1/me/public-profile', ['teaches' => true])->assertOk();
        $this->actingAs($admin)->putJson('/api/v1/me/profile', ['bio' => 'Mathématicienne', 'school' => $this->school->name, 'department' => 'Mathématiques'])->assertOk();

        $admin->refresh();
        $this->assertSame('ada-nkolo', $admin->slug);

        $list = $this->getJson('/api/v1/public/teachers')->assertJsonCount(2, 'data');
        $profile = $this->getJson('/api/v1/public/teachers/ada-nkolo')->assertOk()->assertJsonPath('data.bio', 'Mathématicienne');
        foreach ([$list->json(), $profile->json(), $this->getJson('/api/v1/public/search?q=Ada')->json()] as $payload) {
            $this->assertStringNotContainsStringIgnoringCase('admin', json_encode($payload));
        }

        // Il peut publier comme tout enseignant approuvé.
        $this->actingAs($admin)->postJson('/api/v1/me/posts', [
            'content' => 'Séminaire', 'category_id' => $this->category->id, 'status' => 'published',
        ])->assertCreated();

        $this->actingAs($admin)->putJson('/api/v1/me/public-profile', ['teaches' => false])->assertOk();
        $this->getJson('/api/v1/public/teachers/ada-nkolo')->assertNotFound();
        $this->getJson('/api/v1/public/posts')->assertJsonCount(0, 'data');
    }

    public function test_slug_rules_history_and_change_limit(): void
    {
        $teacher = User::factory()->create(['slug' => 'depart']);
        User::factory()->create(['slug' => 'deja-pris']);

        $this->actingAs($teacher)->getJson('/api/v1/me/slug/availability?slug=admin')->assertJsonPath('available', false);
        $this->actingAs($teacher)->getJson('/api/v1/me/slug/availability?slug=deja-pris')->assertJsonPath('available', false);
        $this->actingAs($teacher)->getJson('/api/v1/me/slug/availability?slug=Mauvais_Format')->assertJsonPath('available', false);
        $this->actingAs($teacher)->getJson('/api/v1/me/slug/availability?slug=libre-ok')->assertJsonPath('available', true);

        foreach (['slug-un', 'slug-deux', 'slug-trois', 'slug-quatre', 'slug-cinq'] as $slug) {
            $this->actingAs($teacher)->putJson('/api/v1/me/slug', ['slug' => $slug])->assertOk();
        }
        $this->actingAs($teacher)->putJson('/api/v1/me/slug', ['slug' => 'slug-six'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');

        $this->assertTrue(ProfileSlugHistory::where('slug', 'depart')->exists());
        $this->getJson('/api/v1/public/teachers/depart')->assertJsonPath('moved_to', 'slug-cinq');

        // Un ancien identifiant n'est jamais réattribué à un autre enseignant.
        $other = User::factory()->create();
        $this->actingAs($other)->getJson('/api/v1/me/slug/availability?slug=depart')->assertJsonPath('available', false);
    }

    public function test_masked_contact_and_section_disappear_from_public_api(): void
    {
        $teacher = User::factory()->create(['slug' => 'prof-x', 'office' => 'Bureau 12', 'show_office' => true]);
        $this->getJson('/api/v1/public/teachers/prof-x')->assertJsonPath('data.contacts.office', 'Bureau 12');

        $this->actingAs($teacher)->putJson('/api/v1/me/public-profile', [
            'show_office' => false, 'sections' => ['courses' => false],
        ])->assertOk();
        $teacher->profileItems()->create(['section' => 'course', 'title' => 'Cours privé']);

        $response = $this->getJson('/api/v1/public/teachers/prof-x');
        $response->assertJsonPath('data.contacts.office', null);
        $this->assertStringNotContainsString('Cours privé', json_encode($response->json()));
    }
}
