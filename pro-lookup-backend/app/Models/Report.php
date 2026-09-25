<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Signalement public d'une publication ou d'un profil. */
class Report extends Model
{
    protected $fillable = [
        'target_type', 'target_id', 'reason', 'comment', 'email', 'ip_hash',
        'status', 'resolution', 'handled_by', 'handled_at',
    ];

    protected function casts(): array
    {
        return ['handled_at' => 'datetime', 'target_id' => 'integer'];
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /** Publication ou profil visé par le signalement. */
    public function target(): Post|User|null
    {
        return match ($this->target_type) {
            'post' => Post::with('user')->find($this->target_id),
            'profile' => User::find($this->target_id),
            default => null,
        };
    }
}
