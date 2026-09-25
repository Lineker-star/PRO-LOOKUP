<?php

namespace Tests\Feature\V1;

use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** Zone C : accès réservé, suspension, création directe, modération (brief §8, §16). */
class AdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedReferences();
        Notification::fake();
    }

    public function test_admin_routes_are_forbidden_to_teachers_and_visitors(): void
    {
        $teacher = User::factory()->create();

        $urls = ['/api/v1/admin/dashboard', '/api/v1/admin/users', '/api/v1/admin/registration-requests', '/api/v1/admin/audit-log'];

        foreach ($urls as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        foreach ($urls as $url) {
            $this->actingAs($teacher)->getJson($url)->assertForbidden();
        }
    }

    public function test_suspension_removes_profile_and_posts_immediately(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['slug' => 'a-suspendre']);
        $post = Post::factory()->for($teacher)->create();

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$teacher->id}/suspend")
            ->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$teacher->id}/suspend", ['reason' => 'Usurpation d’identité'])
            ->assertOk();

        $this->getJson('/api/v1/public/teachers/a-suspendre')->assertNotFound();
        $this->getJson("/api/v1/public/posts/{$post->id}")->assertNotFound();

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$teacher->id}/reactivate")->assertOk();
        $this->getJson('/api/v1/public/teachers/a-suspendre')->assertOk();
        $this->getJson("/api/v1/public/posts/{$post->id}")->assertOk();
    }

    public function test_direct_creation_is_approved_immediately(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'first_name' => 'Paul', 'last_name' => 'Direct', 'email' => 'paul.direct@example.cm',
            'grade_id' => $this->grade->id, 'faculty_id' => $this->faculty->id, 'department_id' => $this->dept->id,
        ])->assertCreated()->assertJsonPath('data.status', 'approved');

        $this->getJson('/api/v1/public/teachers/paul-direct')->assertOk();
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.created']);
    }

    public function test_admin_hides_post_with_mandatory_reason(): void
    {
        $admin = User::factory()->admin()->create();
        $post = Post::factory()->create();

        $this->actingAs($admin)->postJson("/api/v1/admin/posts/{$post->id}/hide")->assertUnprocessable();
        $this->actingAs($admin)->postJson("/api/v1/admin/posts/{$post->id}/hide", ['reason' => 'Contenu hors sujet'])->assertOk();

        $this->getJson("/api/v1/public/posts/{$post->id}")->assertNotFound();
        $this->actingAs($post->user)->getJson("/api/v1/me/posts/{$post->id}")
            ->assertJsonPath('data.status', 'hidden')
            ->assertJsonPath('data.hidden_reason', 'Contenu hors sujet');
    }

    public function test_admin_cannot_see_drafts(): void
    {
        $admin = User::factory()->admin()->create();
        $draft = Post::factory()->draft()->create();

        $this->actingAs($admin)->getJson("/api/v1/admin/posts/{$draft->id}")->assertNotFound();
    }

    public function test_deleting_a_teacher_closes_reports_about_them(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create();
        $post = Post::factory()->for($teacher)->create();
        $onProfile = Report::create(['target_type' => 'profile', 'target_id' => $teacher->id, 'reason' => 'spam']);
        $onPost = Report::create(['target_type' => 'post', 'target_id' => $post->id, 'reason' => 'spam']);

        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$teacher->id}", ['reason' => 'Compte en double', 'confirm_email' => $teacher->email])
            ->assertOk();

        $this->assertSame('actioned', $onProfile->fresh()->status);
        $this->assertSame('actioned', $onPost->fresh()->status);
    }

    public function test_report_can_lead_to_hiding_the_post(): void
    {
        $admin = User::factory()->admin()->create();
        $post = Post::factory()->create();
        $report = Report::create(['target_type' => 'post', 'target_id' => $post->id, 'reason' => 'spam']);

        $this->actingAs($admin)->postJson("/api/v1/admin/reports/{$report->id}/resolve", ['action' => 'hide_post', 'reason' => 'Spam avéré'])
            ->assertOk()->assertJsonPath('data.status', 'actioned');

        $this->assertSame('hidden', $post->fresh()->status);
    }
}
