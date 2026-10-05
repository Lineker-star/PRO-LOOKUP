<?php

namespace App\Enums;

/**
 * Catégories des notifications. « account » (compte et sécurité) est toujours envoyé par email ;
 * les autres sont soumis aux préférences de l'enseignant et à la marge du quota Brevo.
 */
enum NotificationCategory: string
{
    case Account = 'account';
    case Profile = 'profile';
    case Admin = 'admin';
    case Newsletter = 'newsletter';

    public function isTransactional(): bool
    {
        return $this === self::Account;
    }

    /** Valeur par défaut d'une préférence optionnelle. */
    public function defaultEnabled(): bool
    {
        return $this !== self::Newsletter;
    }

    /** Catégories dont l'enseignant peut régler l'envoi par email. */
    public static function optional(): array
    {
        return array_values(array_filter(self::cases(), fn (self $c) => ! $c->isTransactional()));
    }
}
