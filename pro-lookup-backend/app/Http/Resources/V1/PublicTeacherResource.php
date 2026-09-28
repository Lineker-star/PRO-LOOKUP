<?php

namespace App\Http\Resources\V1;

use App\Enums\ProfileSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Profil public complet d'un enseignant approuvé.
 * Ne contient JAMAIS : email de compte (sauf s'il est rendu public), matricule,
 * justificatif, statut, sections ou coordonnées masquées.
 *
 * @mixin \App\Models\User
 */
class PublicTeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->resource;
        $visible = fn (ProfileSection $s) => $user->sectionIsPublic($s);

        return [
            ...Refs::teacherCard($user),
            'banner_url' => $user->bannerUrl(),
            'bio' => $visible(ProfileSection::About) ? $user->bio : null,
            'expertise_tags' => $visible(ProfileSection::Expertise) ? array_values($user->expertise_tags ?? []) : [],
            'items' => Refs::items($user, onlyPublic: true),
            'links' => $visible(ProfileSection::Links) ? Refs::links($user->links) : Refs::links(null),
            'contacts' => [
                'email' => $user->show_email ? $user->email : null,
                'phone' => $user->show_phone ? $user->phone : null,
                'office' => $user->show_office ? $user->office : null,
            ],
            // CV téléchargeable (fichier servi par GET /public/teachers/{slug}/cv), jamais son nom de fichier d'origine.
            'cv' => $user->hasPublicCv() ? [
                'size' => $user->cv_size,
                'updated_at' => $user->cv_updated_at?->toIso8601String(),
            ] : null,
            'visible_sections' => collect($user->sectionVisibility())->filter()->keys()->values(),
            'search_indexable' => (bool) $user->search_indexable,
            'posts_count' => $this->whenCounted('publishedPosts', fn () => $this->published_posts_count),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }
}
