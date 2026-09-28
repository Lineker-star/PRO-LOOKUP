<?php

namespace App\Models;

use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'content', 'category_id', 'status',
        'hidden_reason', 'published_at', 'edited_at', 'image_path', 'visibility',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'edited_at' => 'datetime',
        ];
    }

    /**
     * Publications visibles publiquement : publiées ET dont l'auteur a un profil public
     * (compte approuvé qui enseigne) — brief §4 « Règle absolue ».
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('status', PostStatus::Published->value)
            ->whereHas('user', fn (Builder $q) => $q->publicTeachers());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PostCategory::class, 'category_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('position')->orderBy('id');
    }

    // Relations de l'ancien modèle « réseau social », conservées pour les données existantes.
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }
}
