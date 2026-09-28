<?php

namespace App\Enums;

/**
 * Sections du profil dont l'enseignant choisit la visibilité (brief §6.6).
 * L'en-tête du profil n'en fait pas partie : il est toujours public.
 */
enum ProfileSection: string
{
    case About = 'about';
    case Expertise = 'expertise';
    case Courses = 'courses';
    case Education = 'education';
    case Experience = 'experience';
    case Research = 'research';
    case Awards = 'awards';
    case Languages = 'languages';
    case Links = 'links';
    /** CV en PDF téléchargeable depuis le profil public. */
    case Cv = 'cv';

    /** Sections répétables stockées dans la table profile_items. */
    public static function itemSections(): array
    {
        return ['education', 'experience', 'course', 'research_area', 'scientific_publication', 'award', 'language'];
    }

    /** Section de visibilité qui contrôle chaque type d'élément de profil. */
    public static function forItemSection(string $itemSection): self
    {
        return match ($itemSection) {
            'education' => self::Education,
            'experience' => self::Experience,
            'course' => self::Courses,
            'research_area', 'scientific_publication' => self::Research,
            'award' => self::Awards,
            'language' => self::Languages,
        };
    }

    /** Toutes les sections visibles par défaut. */
    public static function defaults(): array
    {
        return collect(self::cases())->mapWithKeys(fn (self $s) => [$s->value => true])->all();
    }
}
