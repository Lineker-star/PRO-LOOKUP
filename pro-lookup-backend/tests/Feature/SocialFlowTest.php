<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_user_can_create_a_post(): void
    {
        $user = User::factory()->create([
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'john-doe',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/posts', [
                'content' => 'Nouvelle publication de test',
                'visibility' => 'public',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('post.content', 'Nouvelle publication de test')
            ->assertJsonPath('post.user_id', $user->id);
    }

    public function test_user_can_comment_on_a_post(): void
    {
        $author = User::factory()->create([
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'author-user',
        ]);

        $commenter = User::factory()->create([
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'commenter-user',
        ]);

        $post = Post::factory()->create([
            'user_id' => $author->id,
            'visibility' => 'public',
        ]);

        $response = $this->actingAs($commenter, 'sanctum')
            ->postJson('/api/posts/'.$post->id.'/comments', [
                'content' => 'Très intéressant !',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('comment.content', 'Très intéressant !')
            ->assertJsonPath('comment.post_id', $post->id);
    }

    public function test_user_can_like_a_post_once(): void
    {
        $author = User::factory()->create([
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'author-like',
        ]);

        $liker = User::factory()->create([
            'status' => 'approved',
            'role' => 'member',
            'slug' => 'liker-user',
        ]);

        $post = Post::factory()->create([
            'user_id' => $author->id,
            'visibility' => 'public',
        ]);

        $first = $this->actingAs($liker, 'sanctum')
            ->postJson('/api/posts/'.$post->id.'/like');

        $first->assertOk()->assertJsonPath('liked', true);

        $second = $this->actingAs($liker, 'sanctum')
            ->postJson('/api/posts/'.$post->id.'/like');

        $second->assertStatus(409)
            ->assertJsonPath('message', 'Vous avez déjà aimé cette publication.');
    }
}
