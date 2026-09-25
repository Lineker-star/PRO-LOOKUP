<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Ancien identifiant de profil : sert aux redirections 301 et à la limite de changements. */
class ProfileSlugHistory extends Model
{
    protected $fillable = ['user_id', 'slug', 'changed_by', 'by_admin'];

    protected function casts(): array
    {
        return ['by_admin' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
