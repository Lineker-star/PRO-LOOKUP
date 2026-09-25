<?php

namespace Tests\Feature\V1;

use App\Models\RegistrationRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Parcours clé : inscription → en attente → approbation / refus (brief §5). */
class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedReferences();
        Storage::fake('local');
        Storage::fake('public');
        Notification::fake();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Émilie',
            'last_name' => 'Ngo Mbarga',
            'email' => 'emilie@example.cm',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'faculty_id' => $this->faculty->id,
            'department_id' => $this->dept->id,
            'grade_id' => $this->grade->id,
            'matricule' => 'ENS-9999',
            'document' => UploadedFile::fake()->create('attestation.pdf', 200, 'application/pdf'),
            'title' => 'Professeure',
            'accept_terms' => '1',
            // Tentative d'auto-attribution du rôle admin : doit être ignorée.
            'role' => 'admin',
            'status' => 'approved',
        ], $overrides);
    }

    public function test_registration_creates_a_pending_account_with_a_private_document(): void
    {
        $this->post('/api/v1/auth/register', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('user.status', 'pending')
            ->assertJsonPath('user.role', 'teacher');

        $user = User::where('email', 'emilie@example.cm')->firstOrFail();
        $this->assertSame('member', $user->role);
        $this->assertSame('pending', $user->status);
        $this->assertNull($user->slug, 'Aucune URL publique avant approbation');

        $request = RegistrationRequest::where('user_id', $user->id)->firstOrFail();
        Storage::disk('local')->assertExists($request->document_path);
        Storage::disk('public')->assertMissing($request->document_path);
    }

    public function test_registration_requires_document_and_terms(): void
    {
        $this->post('/api/v1/auth/register', $this->payload(['document' => null, 'accept_terms' => null]), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document', 'accept_terms']);
    }

    public function test_pending_teacher_can_log_in_but_cannot_publish(): void
    {
        $pending = User::factory()->pending()->create();

        $token = $this->postJson('/api/v1/auth/login', ['email' => $pending->email, 'password' => 'Password123!'])
            ->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.status', 'pending');
        $this->withToken($token)->postJson('/api/v1/me/posts', [
            'content' => 'Test', 'category_id' => $this->category->id, 'status' => 'published',
        ])->assertForbidden();
    }

    public function test_login_error_message_does_not_reveal_which_field_is_wrong(): void
    {
        $user = User::factory()->create();

        $wrongPassword = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'mauvais'])->json('errors.email.0');
        $unknownEmail = $this->postJson('/api/v1/auth/login', ['email' => 'inconnu@example.cm', 'password' => 'mauvais'])->json('errors.email.0');

        $this->assertSame('Email ou mot de passe incorrect.', $wrongPassword);
        $this->assertSame($wrongPassword, $unknownEmail);
    }

    public function test_admin_approves_request_and_profile_becomes_public(): void
    {
        $admin = User::factory()->admin()->create();
        $this->post('/api/v1/auth/register', $this->payload(), ['Accept' => 'application/json'])->assertCreated();
        $request = RegistrationRequest::firstOrFail();

        $this->actingAs($admin)->postJson("/api/v1/admin/registration-requests/{$request->id}/approve")->assertOk();

        $user = $request->user->fresh();
        $this->assertSame('approved', $user->status);
        $this->assertSame('emilie-ngo-mbarga', $user->slug);
        $this->getJson('/api/v1/public/teachers/emilie-ngo-mbarga')->assertOk();
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'registration.approved', 'target_id' => $user->id]);
    }

    public function test_rejection_requires_a_reason(): void
    {
        $admin = User::factory()->admin()->create();
        $this->post('/api/v1/auth/register', $this->payload(), ['Accept' => 'application/json'])->assertCreated();
        $request = RegistrationRequest::firstOrFail();

        $this->actingAs($admin)->postJson("/api/v1/admin/registration-requests/{$request->id}/reject")
            ->assertUnprocessable()->assertJsonValidationErrors('reason');

        $this->actingAs($admin)->postJson("/api/v1/admin/registration-requests/{$request->id}/reject", ['reason' => 'Matricule introuvable'])
            ->assertOk();
        $this->assertSame('rejected', $request->user->fresh()->status);
        $this->getJson('/api/v1/public/teachers')->assertJsonCount(0, 'data');
    }

    public function test_only_admins_can_download_the_document(): void
    {
        $this->post('/api/v1/auth/register', $this->payload(), ['Accept' => 'application/json'])->assertCreated();
        $request = RegistrationRequest::firstOrFail();
        $teacher = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $this->getJson("/api/v1/admin/registration-requests/{$request->id}/document")->assertUnauthorized();
        $this->actingAs($teacher)->getJson("/api/v1/admin/registration-requests/{$request->id}/document")->assertForbidden();
        $this->actingAs($admin)->get("/api/v1/admin/registration-requests/{$request->id}/document")->assertOk();
    }
}
