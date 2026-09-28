<?php

namespace App\Http\Resources\V1;

use App\Services\SlugService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Compte et profil complets, vus par leur propriétaire (/me) ou par un administrateur.
 *
 * @mixin \App\Models\User
 */
class OwnerProfileResource extends JsonResource
{
    public bool $forAdmin = false;

    public static function forAdmin($resource): static
    {
        $instance = new static($resource);
        $instance->forAdmin = true;

        return $instance;
    }

    public function toArray(Request $request): array
    {
        $user = $this->resource;
        $slugs = app(SlugService::class);
        $registration = $user->registrationRequest;

        $data = [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->isAdmin() ? 'admin' : 'teacher',
            'status' => $user->status,
            // Un administrateur peut aussi être enseignant avec un profil public (jamais marqué « admin »).
            'teaches' => (bool) $user->teaches,
            'school_id' => $user->faculty_id,
            ...Refs::teacherCard($user),
            'banner_url' => $user->bannerUrl(),
            'bio' => $user->bio,
            'expertise_tags' => array_values($user->expertise_tags ?? []),
            'matricule' => $user->matricule ?? $registration?->matricule,
            'phone' => $user->phone,
            'office' => $user->office,
            'links' => Refs::links($user->links),
            'cv' => $user->cv_path ? [
                'name' => $user->cv_name,
                'size' => $user->cv_size,
                'updated_at' => $user->cv_updated_at?->toIso8601String(),
            ] : null,
            'items' => Refs::items($user, onlyPublic: false),
            'visibility' => [
                'sections' => $user->sectionVisibility(),
                'show_email' => (bool) $user->show_email,
                'show_phone' => (bool) $user->show_phone,
                'show_office' => (bool) $user->show_office,
                'search_indexable' => (bool) $user->search_indexable,
            ],
            'slug_changes_remaining' => $user->slug ? $slugs->remainingChanges($user) : null,
            'slug_next_change_at' => $user->slug ? $slugs->nextChangeAt($user)?->toIso8601String() : null,
            'registration' => $registration ? [
                'id' => $registration->id,
                'status' => $registration->status,
                'reason' => $registration->reason,
                'matricule' => $registration->matricule,
                'document_name' => $registration->document_name,
                'has_document' => (bool) $registration->document_path,
                'submitted_at' => $registration->created_at?->toIso8601String(),
                'processed_at' => $registration->processed_at?->toIso8601String(),
            ] : null,
            'suspension_reason' => $user->suspension_reason,
            'approved_at' => $user->approved_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];

        if ($this->forAdmin) {
            $data['posts_count'] = $user->posts()->count();
            $data['published_posts_count'] = $user->posts()->where('status', 'published')->count();
            $data['slug_history'] = $user->slugHistory()->latest()->get(['slug', 'by_admin', 'created_at']);
            $data['approved_by'] = $user->approved_by;
            $data['suspended_at'] = $user->suspended_at?->toIso8601String();
        }

        return $data;
    }
}
