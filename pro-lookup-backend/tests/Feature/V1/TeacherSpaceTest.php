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

    public function test_profile_update_cannot_change_role_status_or_grade(): void
    {
        $teacher = User::factory()->create(['rank_id' => $this->grade->id]);

        $this->actingAs($teacher)->putJson('/api/v1/me/profile', [
            'bio' => 'Nouvelle bio', 'role' => 'admin', 'status' => 'approved', 'rank_id' => 999,
        ])->assertOk();

        $teacher->refresh();
        $this->assertSame('Nouvelle bio', $teacher->bio);
        $this->assertSame('member', $teacher->role);
        $this->assertSame($this->grade->id, $teacher->rank_id);
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
