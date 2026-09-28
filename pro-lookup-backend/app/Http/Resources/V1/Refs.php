<?php

namespace App\Http\Resources\V1;

use App\Enums\ProfileSection;
use App\Models\Faculty;
use App\Models\PostCategory;
use App\Models\Rank;
use App\Models\User;
use Illuminate\Support\Collection;

/** Petites fonctions de mise en forme partagées par les resources. */
final class Refs
{
    public static function grade(?Rank $rank): ?array
    {
        return $rank ? ['id' => $rank->id, 'name' => $rank->name, 'slug' => $rank->slug] : null;
    }

    /** École supérieure de la liste gérée par l'administration. */
    public static function school(?Faculty $school): ?array
    {
        return $school ? ['id' => $school->id, 'name' => $school->name, 'slug' => $school->slug] : null;
    }

    public static function category(?PostCategory $category): ?array
    {
        return $category ? ['id' => $category->id, 'name' => $category->name, 'slug' => $category->slug] : null;
    }

    /**
     * Carte d'un enseignant : uniquement les champs de l'en-tête, toujours publics.
     * Le rôle (enseignant / administrateur) n'y figure JAMAIS.
     * `school` et `department` sont les textes saisis par l'enseignant.
     */
    public static function teacherCard(User $user): array
    {
        return [
            'slug' => $user->slug,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'title' => $user->title,
            'expertise' => $user->expertise,
            'avatar_url' => $user->avatarUrl(),
            'grade' => self::grade($user->rank),
            'school' => $user->school,
            'department' => $user->department,
        ];
    }

    /**
     * Éléments de profil regroupés par section. Avec $onlyPublic, les sections
     * masquées par l'enseignant sont exclues (brief §6.6).
     */
    public static function items(User $user, bool $onlyPublic): array
    {
        /** @var Collection $items */
        $items = $user->relationLoaded('profileItems') ? $user->profileItems : $user->profileItems()->get();
        $grouped = array_fill_keys(ProfileSection::itemSections(), []);

        foreach ($items as $item) {
            if (! array_key_exists($item->section, $grouped)) {
                continue;
            }
            if ($onlyPublic && ! $user->sectionIsPublic(ProfileSection::forItemSection($item->section))) {
                continue;
            }
            $grouped[$item->section][] = [
                'id' => $item->id,
                'title' => $item->title,
                'organization' => $item->organization,
                'period' => $item->period,
                'description' => $item->description,
                'url' => $item->url,
                'position' => $item->position,
            ];
        }

        return $grouped;
    }

    public static function links(?array $links): array
    {
        $keys = ['orcid', 'google_scholar', 'researchgate', 'linkedin', 'website'];

        return collect($keys)->mapWithKeys(fn ($k) => [$k => $links[$k] ?? null])->all();
    }
}
