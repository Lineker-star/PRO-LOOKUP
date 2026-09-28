<?php

namespace App\Support;

/**
 * Comparaison de noms saisis librement (écoles, grades, catégories) :
 * casse, accents majuscules, apostrophes typographiques et espaces multiples ignorés.
 * Faite en PHP pour ne pas dépendre du LOWER() du moteur SQL (SQLite ne gère pas les accents).
 */
class Names
{
    public static function normalize(?string $name): string
    {
        $name = str_replace(['’', '‘', '`', '´'], "'", (string) $name);
        $name = preg_replace('/\s+/u', ' ', trim($name)) ?? '';

        return mb_strtolower($name);
    }

    public static function same(?string $a, ?string $b): bool
    {
        return self::normalize($a) !== '' && self::normalize($a) === self::normalize($b);
    }
}
