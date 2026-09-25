<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Grade d'un enseignant (Professeur, Maître de conférences…).
 * La table conserve son nom historique « ranks ».
 */
class Rank extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'order', 'badge_color', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'order' => 'integer'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
