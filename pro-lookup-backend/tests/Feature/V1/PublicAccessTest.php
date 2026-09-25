<?php

namespace Tests\Feature\V1;

use App\Models\Post;
use App\Models\ProfileSlugHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Visiteur sans compte : ce qu'il voit, et surtout ce qu'il ne voit jamais (brief §4, §16). */
class PublicAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_directory_lists_only_approved_teachers(): void
    {
        $approved = User::factory()->create(['last_name' => 'Visible']);
        User::factory()->pending()->create(['last_name' => 'EnAttente']);
        User::factory()->suspended()->create(['last_name' => 'Suspendu']);
        User::factory()->admin()->create(['last_name' => 'Admin']);

        $response = $this->getJson('/api/v1/public/teachers')->assertOk();

        $this->assertSame([$approved->slug], collect($response->json('data'))->pluck('slug')->all());
        $response->assertJsonMissingPath('data.0.email');
        $response->assertJsonMissingPath('data.0.status');
    }

    public function test_non_approved_profiles_return_the_same_404(): void
    {
        $pending = User::factory()->pending()->create(['slug' => 'en-attente']);
        $suspended = User::factory()->suspended()->create(['slug' => 'suspendu']);

        $a = $this->getJson('/api/v1/public/teachers/en-attente')->assertNotFound()->json('message');
        $b = $this->getJson('/api/v1/public/teachers/suspendu')->assertNotFound()->json('message');
        $c = $this->getJson('/api/v1/public/teachers/inexistant')->assertNotFound()->json('message');

        $this->assertSame($a, $b);
        $this->assertSame($b, $c);
        $this->assertNotNull($pending->id + $suspended->id);
    }

    public function test_public_profile_hides_private_fields_and_masked_sections(): void
    {
        $teacher = User::factory()->create([
            'slug' => 'jean-test',
            'matricule' => 'SECRET-123',
            'phone' => '+237 600 000 000',
            'show_phone' => false,
            'show_email' => false,
            'bio' => 'Biographie masquée',
            'public_sections' => ['about' => false],
        ]);
        $teacher->profileItems()->create(['section' => 'course', 'title' => 'Cours visible']);

        $response = $this->getJson('/api/v1/public/teachers/jean-test')->assertOk();

        $json = json_encode($response->json());
        $this->assertStringNotContainsString('SECRET-123', $json);
        $this->assertStringNotContainsString('+237 600 000 000', $json);
        $this->assertStringNotContainsString($teacher->email, $json);
        $this->assertStringNotContainsString('Biographie masquée', $json);
        $response->assertJsonPath('data.items.course.0.title', 'Cours visible');
        $response->assertJsonMissingPath('data.status');
        $response->assertJsonMissingPath('data.matricule');
    }

    public function test_old_slug_points_to_the_new_one(): void
    {
        $teacher = User::factory()->create(['slug' => 'nouveau-slug']);
        ProfileSlugHistory::create(['user_id' => $teacher->id, 'slug' => 'ancien-slug']);

        $this->getJson('/api/v1/public/teachers/ancien-slug')
            ->assertOk()
            ->assertJsonPath('moved_to', 'nouveau-slug');
    }

    public function test_drafts_hidden_posts_and_posts_of_suspended_authors_are_never_public(): void
    {
        $teacher = User::factory()->create();
        $suspended = User::factory()->suspended()->create();

        $published = Post::factory()->for($teacher)->create();
        $draft = Post::factory()->for($teacher)->draft()->create();
        $hidden = Post::factory()->for($teacher)->hidden()->create();
        $ofSuspended = Post::factory()->for($suspended)->create();

        $ids = collect($this->getJson('/api/v1/public/posts')->assertOk()->json('data'))->pluck('id')->all();
        $this->assertSame([$published->id], $ids);

        $this->getJson("/api/v1/public/posts/{$published->id}")->assertOk()->assertJsonMissingPath('data.status');
        $this->getJson("/api/v1/public/posts/{$draft->id}")->assertNotFound();
        $this->getJson("/api/v1/public/posts/{$hidden->id}")->assertNotFound();
        $this->getJson("/api/v1/public/posts/{$ofSuspended->id}")->assertNotFound();
    }

    public function test_visitor_can_report_a_post_but_honeypot_blocks_bots(): void
    {
        $post = Post::factory()->create();

        $this->postJson('/api/v1/public/reports', ['target_type' => 'post', 'target_id' => $post->id, 'reason' => 'spam'])
            ->assertCreated();
        $this->postJson('/api/v1/public/reports', ['target_type' => 'post', 'target_id' => $post->id, 'reason' => 'spam', 'website' => 'http://bot'])
            ->assertUnprocessable();

        $this->assertDatabaseCount('reports', 1);
    }

    public function test_search_and_stats_only_count_public_content(): void
    {
        User::factory()->create(['first_name' => 'Aminata', 'last_name' => 'Recherche']);
        User::factory()->pending()->create(['first_name' => 'Aminata', 'last_name' => 'Cachee']);

        $this->getJson('/api/v1/public/search?q=aminata')->assertOk()->assertJsonPath('totals.teachers', 1);
        $this->getJson('/api/v1/public/stats')->assertOk()->assertJsonPath('data.teachers', 1);
    }
}
