<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Élément répétable d'un profil : diplôme, expérience, cours, axe de recherche,
 * publication scientifique, distinction ou langue (champ « section »).
 */
class ProfileItem extends Model
{
    protected $fillable = ['user_id', 'section', 'title', 'author', 'organization', 'period', 'description', 'url', 'position'];

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
