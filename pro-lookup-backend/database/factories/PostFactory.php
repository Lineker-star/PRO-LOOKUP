<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /** Par défaut : une publication publiée. */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'content' => '<p>'.fake()->paragraph().'</p>',
            'status' => 'published',
            'published_at' => now(),
            'image_path' => null,
            'visibility' => 'public',
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft', 'published_at' => null]);
    }

    public function hidden(): static
    {
        return $this->state(fn () => ['status' => 'hidden', 'hidden_reason' => 'Contenu non conforme']);
    }
}
