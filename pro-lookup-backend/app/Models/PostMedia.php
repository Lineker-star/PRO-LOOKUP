<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PostMedia extends Model
{
    protected $table = 'post_media';

    protected $fillable = ['post_id', 'type', 'path', 'url', 'alt', 'original_name', 'size', 'position'];

    protected function casts(): array
    {
        return ['size' => 'integer', 'position' => 'integer'];
    }

    /** URL publique du fichier, ou l'URL externe pour un lien. */
    public function publicUrl(): ?string
    {
        if ($this->type === 'link') {
            return $this->url;
        }

        return $this->path ? Storage::disk('public')->url($this->path) : null;
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
