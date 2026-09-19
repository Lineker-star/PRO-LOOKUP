<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'avatar_path' => null,
            'bio' => fake()->sentence(),
            'department' => fake()->randomElement(['Informatique', 'Aéronautique', 'Sciences', 'Administration']),
            'rank_id' => null,
            'role' => 'member',
            'status' => 'approved',
            'slug' => fake()->unique()->slug(2),
            'approved_by' => null,
            'approved_at' => now(),
            'rejection_reason' => null,
            'remember_token' => Str::random(10),
        ];
    }
}
