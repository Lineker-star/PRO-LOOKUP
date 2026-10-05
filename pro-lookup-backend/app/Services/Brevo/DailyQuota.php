<?php

namespace App\Services\Brevo;

use Illuminate\Support\Facades\Cache;

/**
 * Compteur d'envois Brevo sur la journée (plan gratuit). Sert à réserver la marge restante
 * aux emails de compte : les emails optionnels s'arrêtent avant la limite quotidienne.
 */
class DailyQuota
{
    private static function key(): string
    {
        return 'brevo:sent:'.now()->toDateString();
    }

    public static function record(): void
    {
        Cache::add(self::key(), 0, now()->endOfDay());
        Cache::increment(self::key());
    }

    public static function sentToday(): int
    {
        return (int) Cache::get(self::key(), 0);
    }

    /** Vrai tant qu'un email optionnel peut encore partir sans entamer la marge réservée. */
    public static function allowsOptional(): bool
    {
        return self::sentToday() < (int) config('services.brevo.optional_limit');
    }
}
