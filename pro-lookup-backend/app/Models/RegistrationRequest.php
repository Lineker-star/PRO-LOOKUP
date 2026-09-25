<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Demande d'inscription d'un enseignant, avec son matricule et son justificatif (disque privé). */
class RegistrationRequest extends Model
{
    protected $fillable = [
        'user_id', 'matricule', 'document_path', 'document_name', 'document_mime',
        'status', 'reason', 'processed_by', 'processed_at',
    ];

    protected function casts(): array
    {
        return ['processed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
