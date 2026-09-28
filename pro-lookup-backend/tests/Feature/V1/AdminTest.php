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
            'grade_id' => $this->grade->id, 'school' => $this->school->name, 'department' => 'Réseaux et télécoms',
        ])->assertCreated()->assertJsonPath('data.status', 'approved');

        $this->getJson('/api/v1/public/teachers/paul-direct')->assertOk()
            ->assertJsonPath('data.school', $this->school->name)
            ->assertJsonPath('data.department', 'Réseaux et télécoms');
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.created']);
    }

    public function test_admin_cannot_edit_a_teacher_or_reset_their_url(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['first_name' => 'Intact', 'slug' => 'intact']);
        $pending = User::factory()->pending()->create(['first_name' => 'Attente']);

        foreach ([$teacher, $pending] as $user) {
            $this->actingAs($admin)->putJson("/api/v1/admin/users/{$user->id}", ['first_name' => 'Modifié'])->assertStatus(405);
            $this->actingAs($admin)->postJson("/api/v1/admin/users/{$user->id}/reset-slug")->assertNotFound();
        }

        $this->assertSame('Intact', $teacher->fresh()->first_name);
        $this->assertSame('intact', $teacher->fresh()->slug);
        $this->assertSame('Attente', $pending->fresh()->first_name);
    }

    public function test_admin_names_another_administrator(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['slug' => 'futur-responsable']);
        $pending = User::factory()->pending()->create();

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$pending->id}/promote")->assertUnprocessable();
        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$teacher->id}/promote")->assertOk();

        $teacher->refresh();
        $this->assertTrue($teacher->isAdmin());
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.promoted', 'target_id' => $teacher->id]);

        // Le nouvel administrateur accède à l'administration…
        $this->actingAs($teacher)->getJson('/api/v1/admin/dashboard')->assertOk();
        // … et son profil public reste visible, sans jamais mentionner le rôle.
        $public = $this->getJson('/api/v1/public/teachers/futur-responsable')->assertOk();
        $this->assertStringNotContainsStringIgnoringCase('admin', json_encode($public->json('data')));
    }

    public function test_demotion_rules(): void
    {
        $first = User::factory()->admin()->create();
        $second = User::factory()->admin()->create();

        // Jamais à soi-même.
        $this->actingAs($first)->postJson("/api/v1/admin/users/{$first->id}/demote")->assertUnprocessable();

        $this->actingAs($first)->postJson("/api/v1/admin/users/{$second->id}/demote")->assertOk();
        $second->refresh();
        $this->assertFalse($second->isAdmin());
        $this->assertTrue($second->teaches);
        $this->assertNotNull($second->slug, 'Redevenu enseignant, il retrouve un profil public');
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.demoted', 'target_id' => $second->id]);

        // Jamais le dernier administrateur (même promu puis rétrogradé par un autre).
        $this->actingAs($first)->postJson("/api/v1/admin/users/{$second->id}/promote")->assertOk();
        $this->actingAs($second->fresh())->postJson("/api/v1/admin/users/{$first->id}/demote")->assertOk();
        $this->assertSame(1, User::where('role', User::ROLE_ADMIN)->count());
    }

    public function test_admins_cannot_be_suspended_or_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$other->id}/suspend", ['reason' => 'Test de suspension'])->assertUnprocessable();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$other->id}", ['reason' => 'Test de suppression', 'confirm_email' => $other->email])->assertUnprocessable();
        $this->assertSame('approved', $other->fresh()->status);
    }

    public function test_admin_manages_grades_categories_and_schools(): void
    {
        $admin = User::factory()->admin()->create();

        foreach (['grades' => 'Professeur associé', 'categories' => 'Soutenance', 'schools' => 'École Supérieure des Arts'] as $type => $name) {
            $this->actingAs($admin)->postJson("/api/v1/admin/references/{$type}", ['name' => $name])->assertOk();
            // Doublon refusé (casse ignorée).
            $this->actingAs($admin)->postJson("/api/v1/admin/references/{$type}", ['name' => mb_strtoupper($name)])->assertUnprocessable();
        }

        $grade = \App\Models\Rank::where('name', 'Professeur associé')->firstOrFail();
        $category = \App\Models\PostCategory::where('name', 'Soutenance')->firstOrFail();
        $school = \App\Models\Faculty::where('name', 'École Supérieure des Arts')->firstOrFail();

        $teacher = User::factory()->create(['rank_id' => $grade->id, 'school' => 'École Supérieure des Arts', 'faculty_id' => $school->id]);
        $post = Post::factory()->for($teacher)->create(['category_id' => $category->id]);

        $this->getJson("/api/v1/public/teachers?school={$school->slug}")->assertJsonCount(1, 'data');

        $this->actingAs($admin)->deleteJson("/api/v1/admin/references/grades/{$grade->id}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/references/categories/{$category->id}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/references/schools/{$school->id}")->assertOk();

        $teacher->refresh();
        $this->assertNull($teacher->rank_id);
        $this->assertNull($teacher->faculty_id);
        $this->assertSame('École Supérieure des Arts', $teacher->school, 'Le texte saisi par l’enseignant est conservé');
        $this->assertNull($post->fresh()->category_id);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'schools.deleted']);
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
