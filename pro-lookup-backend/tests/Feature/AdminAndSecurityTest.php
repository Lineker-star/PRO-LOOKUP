<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_pending_users(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'approved',
            'slug' => 'admin-user',
        ]);

        User::factory()->create([
            'status' => 'pending',
            'slug' => 'pending-user-1',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users/pending');

        $response->assertOk();
        $this->assertCount(1, $response->json());
    }

    public function test_non_admin_cannot_list_pending_users(): void
    {
        $user = User::factory()->create([
            'role' => 'member',
            'status' => 'approved',
            'slug' => 'regular-user',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/users/pending');

        $response->assertStatus(403);
    }

    public function test_non_approved_user_cannot_publish_post(): void
    {
        $user = User::factory()->create([
            'role' => 'member',
            'status' => 'pending',
            'slug' => 'pending-author',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/posts', [
                'content' => 'Tentative de publication',
                'visibility' => 'public',
            ]);

        $response->assertStatus(403);
    }
}
