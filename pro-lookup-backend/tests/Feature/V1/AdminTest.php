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

    /** Les anciennes routes retirées (11 ter d'origine) restent absentes ; l'édition passe par /profile (11 ter révisé). */
    public function test_legacy_edit_and_reset_slug_routes_stay_removed(): void
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

    /** DECISIONS.md, point 11 ter révisé : l'admin peut désormais modifier le profil d'un enseignant. */
    public function test_admin_updates_a_teacher_profile(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['first_name' => 'Avant', 'slug' => 'avant-apres']);
        $otherSchool = \App\Models\Faculty::create(['name' => 'École Autre', 'slug' => 'ecole-autre']);

        $this->actingAs($admin)->putJson("/api/v1/admin/users/{$teacher->id}/profile", [
            'first_name' => 'Après',
            'school' => $otherSchool->name,
            'department' => 'Nouvelle filière',
            'grade_id' => $this->grade->id,
        ])->assertOk()->assertJsonPath('data.first_name', 'Après');

        $teacher->refresh();
        $this->assertSame('Après', $teacher->first_name);
        $this->assertSame($otherSchool->id, $teacher->faculty_id);
        $this->getJson('/api/v1/public/teachers/avant-apres')->assertJsonPath('data.first_name', 'Après');
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.profile_updated', 'target_id' => $teacher->id]);
    }

    /** DECISIONS.md, point 11 ter révisé : l'admin peut déposer un CV pour un enseignant. */
    public function test_admin_uploads_cv_for_a_teacher(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['slug' => 'photo-cv']);
        $cv = \Illuminate\Http\UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF");

        $this->actingAs($admin)->post("/api/v1/admin/users/{$teacher->id}/cv", ['cv' => $cv], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.cv.name', 'cv.pdf');

        $teacher->refresh();
        \Illuminate\Support\Facades\Storage::disk('local')->assertExists($teacher->cv_path);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.cv_updated', 'target_id' => $teacher->id]);
    }

    /**
     * DECISIONS.md, point 11 ter révisé : l'admin peut déposer la photo d'un enseignant.
     * Nécessite l'extension GD (absente de ce PHP CLI local, présente sur Railway — voir CvTest).
     */
    public function test_admin_uploads_avatar_for_a_teacher(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['slug' => 'photo-seule']);

        $this->actingAs($admin)->post(
            "/api/v1/admin/users/{$teacher->id}/images/avatar",
            ['image' => \Illuminate\Http\UploadedFile::fake()->image('photo.jpg', 400, 400)],
            ['Accept' => 'application/json'],
        )->assertOk();

        $teacher->refresh();
        $this->assertNotNull($teacher->avatar_path);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($teacher->avatar_path);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.image_updated', 'target_id' => $teacher->id]);
    }

    /** DECISIONS.md, point 11 ter révisé : publications ajoutées par l'admin, visibles comme celles de l'enseignant. */
    public function test_admin_adds_and_removes_a_scientific_publication_for_a_teacher(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create(['slug' => 'publie']);

        $res = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$teacher->id}/profile-items", [
            'section' => 'scientific_publication',
            'title' => 'Étude sur X',
            'author' => 'Tchoumi A.',
            'period' => '2024',
            'description' => 'Résumé de l’étude.',
            'url' => 'https://doi.org/10.1234/exemple',
        ])->assertCreated();

        $itemId = $res->json('data.items.scientific_publication.0.id');
        $this->getJson('/api/v1/public/teachers/publie')
            ->assertJsonPath('data.items.scientific_publication.0.title', 'Étude sur X')
            ->assertJsonPath('data.items.scientific_publication.0.author', 'Tchoumi A.');

        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$teacher->id}/profile-items/{$itemId}")->assertOk();
        $this->getJson('/api/v1/public/teachers/publie')->assertJsonPath('data.items.scientific_publication', []);
    }

    /** DECISIONS.md, point 11 ter révisé : mot de passe, CV et publications dès la création directe. */
    public function test_direct_creation_accepts_password_cv_and_publications(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $admin = User::factory()->admin()->create();
        $cv = \Illuminate\Http\UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF");

        $this->actingAs($admin)->post('/api/v1/admin/users', [
            'first_name' => 'Nadia', 'last_name' => 'Directe', 'email' => 'nadia.directe@example.cm',
            'password' => 'MotDePasse123', 'password_confirmation' => 'MotDePasse123',
            'grade_id' => $this->grade->id, 'school' => $this->school->name, 'department' => 'Mathématiques',
            'cv' => $cv,
            'publications' => [['title' => 'Premier article', 'author' => 'Directe N.', 'year' => '2023']],
        ], ['Accept' => 'application/json'])->assertCreated();

        $user = User::where('email', 'nadia.directe@example.cm')->first();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('MotDePasse123', $user->password));
        $this->assertNotNull($user->cv_path);
        $this->assertSame('Premier article', $user->profileItems()->where('section', 'scientific_publication')->first()?->title);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user.created', 'target_id' => $user->id]);

        // Avec mot de passe fourni, connexion possible immédiatement (pas besoin du lien email).
        $this->postJson('/api/v1/auth/login', ['email' => 'nadia.directe@example.cm', 'password' => 'MotDePasse123'])->assertOk();
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

    /** Message générique en français, pas l'exception technique de Laravel, sur un compte déjà supprimé. */
    public function test_acting_on_an_already_deleted_user_gives_a_friendly_message(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->create();
        $id = $teacher->id;

        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$id}", ['reason' => 'Compte en double', 'confirm_email' => $teacher->email])->assertOk();

        $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$id}", ['reason' => 'Compte en double', 'confirm_email' => $teacher->email])
            ->assertNotFound()
            ->assertJsonPath('message', 'Ce compte n’existe plus : il a peut-être déjà été supprimé.');
        $this->actingAs($admin)->getJson("/api/v1/admin/users/{$id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'Ce compte n’existe plus : il a peut-être déjà été supprimé.');
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
