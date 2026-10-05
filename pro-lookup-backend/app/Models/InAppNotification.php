<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Notification affichée dans le centre de notifications (cloche) de l'espace enseignant. */
class InAppNotification extends Model
{
    protected $table = 'platform_notifications';

    protected $fillable = ['user_id', 'category', 'title', 'body', 'action_url'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
