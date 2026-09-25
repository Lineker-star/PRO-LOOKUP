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
    protected static ?string $password;

    /** Par défaut : un enseignant approuvé avec un profil public. */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('Password123!'),
            'avatar_path' => null,
            'bio' => fake()->sentence(),
            'title' => 'Enseignant',
            'expertise' => 'Informatique',
            'department' => 'Informatique',
            'rank_id' => null,
            'role' => User::ROLE_TEACHER,
            'status' => 'approved',
            'slug' => fake()->unique()->slug(2),
            'approved_by' => null,
            'approved_at' => now(),
            'rejection_reason' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending', 'slug' => null, 'approved_at' => null]);
    }

    public function suspended(): static
    {
        return $this->state(fn () => ['status' => 'suspended', 'suspension_reason' => 'Test', 'suspended_at' => now()]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_ADMIN, 'slug' => null]);
    }
}
