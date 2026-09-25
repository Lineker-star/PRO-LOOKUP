<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Carte d'un enseignant dans l'annuaire et les résultats de recherche.
 *
 * @mixin \App\Models\User
 */
class TeacherCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...Refs::teacherCard($this->resource),
            'posts_count' => (int) ($this->published_posts_count ?? 0),
        ];
    }
}
