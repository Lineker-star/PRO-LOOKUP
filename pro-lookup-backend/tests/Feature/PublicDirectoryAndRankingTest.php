<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicDirectoryAndRankingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_directory_returns_only_approved_profiles(): void
    {
        User::factory()->create([
            'first_name' => 'Approved',
            'last_name' => 'Member',
            'email' => 'approved@iuztf.cm',
            'status' => 'approved',
            'slug' => 'approved-member',
        ]);

        User::factory()->create([
            'first_name' => 'Pending',
            'last_name' => 'Member',
            'email' => 'pending@iuztf.cm',
            'status' => 'pending',
            'slug' => 'pending-member',
        ]);

        $response = $this->getJson('/api/profiles');

        $response->assertOk();
        $this->assertCount(1, $response->json());
        $this->assertSame('approved-member', $response->json()[0]['slug']);
    }

    public function test_profiles_can_be_filtered_by_search_term(): void
    {
        User::factory()->create([
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'department' => 'Informatique',
            'status' => 'approved',
            'slug' => 'jean-dupont',
        ]);

        User::factory()->create([
            'first_name' => 'Marie',
            'last_name' => 'Ngankam',
            'department' => 'Mathématiques',
            'status' => 'approved',
            'slug' => 'marie-ngankam',
        ]);

        $response = $this->getJson('/api/profiles?search=jean');

        $response->assertOk();
        $this->assertCount(1, $response->json());
        $this->assertSame('jean-dupont', $response->json()[0]['slug']);
    }
}
