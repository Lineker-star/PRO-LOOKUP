<?php

namespace App\Support;

use App\Models\Post;
use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Support\Facades\Password;

/** Rédaction de tous les emails envoyés par la plateforme (brief §5.2). */
class Emails
{
    private static function front(string $path = ''): string
    {
        return rtrim((string) config('app.frontend_url'), '/').$path;
    }

    public static function registrationReceived(User $user): void
    {
        $user->notify(new PlatformNotification(
            'Inscription reçue',
            [
                'Votre inscription à PRO-LOOKUP a bien été enregistrée.',
                'Elle est en attente de validation par l’administration de l’Université ZTF. Vous recevrez un email dès qu’elle aura été traitée.',
                'En attendant, vous pouvez vous connecter pour compléter votre profil en brouillon.',
            ],
            'Suivre ma demande',
            self::front('/espace/en-attente'),
        ));
    }

    public static function newRegistrationForAdmins(User $teacher): void
    {
        User::where('role', User::ROLE_ADMIN)->each(fn (User $admin) => $admin->notify(new PlatformNotification(
            'Nouvelle demande d’inscription',
            ["{$teacher->full_name} ({$teacher->email}) s’est inscrit(e) comme enseignant(e) : sa demande attend votre validation."],
            'Examiner la demande',
            self::front('/admin/demandes'),
        )));
    }

    public static function approved(User $user): void
    {
        $user->notify(new PlatformNotification(
            'Votre compte est activé',
            [
                'Bonne nouvelle : votre compte enseignant a été approuvé.',
                'Votre profil est désormais visible publiquement à l’adresse : '.self::front('/in/'.$user->slug),
                'Vous pouvez maintenant publier des contenus depuis votre espace.',
            ],
            'Accéder à mon espace',
            self::front('/espace'),
        ));
    }

    public static function rejected(User $user, string $reason): void
    {
        $user->notify(new PlatformNotification(
            'Votre inscription n’a pas été acceptée',
            [
                'Après examen, votre inscription à PRO-LOOKUP n’a pas été acceptée.',
                'Motif : '.$reason,
                'Vous pouvez déposer une nouvelle demande en corrigeant les éléments indiqués.',
            ],
            'Voir ma demande',
            self::front('/espace/en-attente'),
        ));
    }

    public static function suspended(User $user, string $reason): void
    {
        $user->notify(new PlatformNotification(
            'Votre compte a été suspendu',
            [
                'Votre compte PRO-LOOKUP a été suspendu par l’administration. Votre profil et vos publications ne sont plus visibles publiquement.',
                'Motif : '.$reason,
                'Pour toute question, contactez l’administration de l’Université ZTF.',
            ],
        ));
    }

    public static function reactivated(User $user): void
    {
        $user->notify(new PlatformNotification(
            'Votre compte est de nouveau actif',
            ['Votre compte a été réactivé : votre profil et vos publications sont à nouveau visibles.'],
            'Accéder à mon espace',
            self::front('/espace'),
        ));
    }

    /** Compte créé directement par un administrateur : lien pour définir le mot de passe. */
    public static function accountCreated(User $user): void
    {
        $token = Password::broker()->createToken($user);
        $url = self::front('/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->email).'&nouveau=1');

        $user->notify(new PlatformNotification(
            'Votre compte PRO-LOOKUP a été créé',
            [
                'L’administration de l’Université ZTF vous a créé un compte enseignant sur PRO-LOOKUP.',
                'Votre profil public est accessible à l’adresse : '.self::front('/in/'.$user->slug),
                'Définissez votre mot de passe pour accéder à votre espace (lien valable 60 minutes, renouvelable via « Mot de passe oublié »).',
            ],
            'Définir mon mot de passe',
            $url,
        ));
    }

    public static function promoted(User $user): void
    {
        $user->notify(new PlatformNotification(
            'Vous êtes administrateur de PRO-LOOKUP',
            [
                'Vous avez été nommé(e) administrateur de PRO-LOOKUP : vous pouvez désormais valider les inscriptions, gérer les comptes et modérer les contenus.',
                'Votre profil public d’enseignant reste inchangé : votre rôle d’administrateur n’y apparaît pas.',
            ],
            'Ouvrir l’administration',
            self::front('/admin'),
        ));
    }

    public static function demoted(User $user): void
    {
        $user->notify(new PlatformNotification(
            'Vos droits d’administrateur ont été retirés',
            [
                'Vous n’êtes plus administrateur de PRO-LOOKUP. Votre compte enseignant et votre profil public restent actifs.',
                'Reconnectez-vous pour accéder à votre espace.',
            ],
            'Se connecter',
            self::front('/connexion'),
        ));
    }

    public static function postHidden(Post $post, string $reason): void
    {
        $post->user?->notify(new PlatformNotification(
            'Une de vos publications a été masquée',
            [
                'L’administration a masqué votre publication « '.($post->title ?: 'sans titre').' ». Elle n’est plus visible publiquement.',
                'Motif : '.$reason,
            ],
            'Voir mes publications',
            self::front('/espace/publications'),
        ));
    }
}
