<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_a_token(): void
    {
        $payload = [
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'email' => 'jean.dupont@iuztf.cm',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department' => 'Informatique',
            'bio' => 'Chercheur en IA',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('user.email', $payload['email'])
            ->assertJsonPath('user.status', 'pending')
            ->assertJsonStructure([
                'user' => ['id', 'first_name', 'last_name', 'email', 'status'],
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => $payload['email'],
            'status' => 'pending',
        ]);
    }

    public function test_user_can_login_and_receive_a_token(): void
    {
        $user = User::create([
            'first_name' => 'Marie',
            'last_name' => 'Ngankam',
            'email' => 'marie.ngankam@iuztf.cm',
            'password' => bcrypt('Password123!'),
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'marie-ngankam',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.status', 'approved')
            ->assertJsonStructure([
                'user' => ['id', 'email', 'status'],
                'token',
            ]);
    }
}
