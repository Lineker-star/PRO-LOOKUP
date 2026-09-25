<?php

namespace App\Http\Resources\V1;

use App\Services\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Publication. Trois variantes selon le lecteur :
 *  - public  : contenu publié uniquement, sans statut ni motif de masquage ;
 *  - owner   : l'auteur voit aussi le statut et le motif de masquage ;
 *  - admin   : comme owner, pour la modération.
 *
 * @mixin \App\Models\Post
 */
class PostResource extends JsonResource
{
    public string $audience = 'public';

    public static function forAudience($resource, string $audience): static
    {
        $instance = new static($resource);
        $instance->audience = $audience;

        return $instance;
    }

    public function toArray(Request $request): array
    {
        $post = $this->resource;
        $sanitizer = app(HtmlSanitizer::class);

        $data = [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'excerpt' => $sanitizer->plain((string) $post->content, 220),
            'category' => Refs::category($post->category),
            'media' => $post->media->map(fn ($m) => [
                'id' => $m->id,
                'type' => $m->type,
                'url' => $m->publicUrl(),
                'alt' => $m->alt,
                'original_name' => $m->original_name,
                'size' => $m->size,
            ])->values(),
            'published_at' => $post->published_at?->toIso8601String(),
            'edited_at' => $post->edited_at?->toIso8601String(),
            'author' => $post->relationLoaded('user') && $post->user ? Refs::teacherCard($post->user) : null,
        ];

        if ($this->audience !== 'public') {
            $data += [
                'status' => $post->status,
                'hidden_reason' => $post->hidden_reason,
                'category_id' => $post->category_id,
                'created_at' => $post->created_at?->toIso8601String(),
                'updated_at' => $post->updated_at?->toIso8601String(),
            ];
        }

        if ($this->audience === 'admin' && $post->relationLoaded('user') && $post->user) {
            $data['author']['id'] = $post->user->id;
            $data['author']['status'] = $post->user->status;
            $data['author']['email'] = $post->user->email;
        }

        return $data;
    }
}
