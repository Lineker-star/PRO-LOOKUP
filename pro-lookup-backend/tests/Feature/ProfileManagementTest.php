<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_user_is_not_visible_in_public_directory(): void
    {
        User::factory()->create([
            'first_name' => 'Alice',
            'last_name' => 'Pending',
            'email' => 'alice.pending@iuztf.cm',
            'status' => 'pending',
            'slug' => 'alice-pending',
        ]);

        $response = $this->getJson('/api/profiles');

        $response->assertOk()
            ->assertExactJson([]);
    }

    public function test_admin_can_approve_a_pending_user(): void
    {
        $admin = User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@iuztf.cm',
            'role' => 'admin',
            'status' => 'approved',
            'slug' => 'admin-user',
        ]);

        $pending = User::factory()->create([
            'first_name' => 'Student',
            'last_name' => 'Demo',
            'email' => 'student.demo@iuztf.cm',
            'status' => 'pending',
            'slug' => 'student-demo',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users/'.$pending->id.'/approve')
            ->assertOk()
            ->assertJsonPath('user.id', $pending->id)
            ->assertJsonPath('user.status', 'approved');

        $this->assertDatabaseHas('users', [
            'id' => $pending->id,
            'status' => 'approved',
            'approved_by' => $admin->id,
        ]);
    }

    public function test_user_can_update_their_profile(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Marie',
            'last_name' => 'Old',
            'email' => 'marie.old@iuztf.cm',
            'status' => 'approved',
            'slug' => 'marie-old',
            'bio' => 'Ancienne bio',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/profile/me', [
                'first_name' => 'Marie',
                'last_name' => 'New',
                'department' => 'Sciences de l\'informatique',
                'bio' => 'Nouvelle bio',
            ])
            ->assertOk()
            ->assertJsonPath('user.last_name', 'New')
            ->assertJsonPath('user.department', 'Sciences de l\'informatique')
            ->assertJsonPath('user.bio', 'Nouvelle bio');
    }
}
