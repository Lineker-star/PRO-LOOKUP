<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Trace d'une action d'administration (qui, quoi, quand, motif). */
class AdminAuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['admin_id', 'action', 'target_type', 'target_id', 'target_label', 'reason', 'meta'];

    protected function casts(): array
    {
        return ['meta' => 'array', 'created_at' => 'datetime', 'target_id' => 'integer'];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
