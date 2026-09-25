<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email simple de la plateforme (objet, paragraphes, bouton optionnel).
 * Envoyé via la file d'attente (brief §9.2). Le contenu est rédigé dans App\Support\Emails.
 */
class PlatformNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param  array<int, string>  $lines */
    public function __construct(
        public string $subject,
        public array $lines,
        public ?string $actionText = null,
        public ?string $actionUrl = null,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->subject.' — PRO-LOOKUP')
            ->greeting('Bonjour'.(isset($notifiable->first_name) ? ' '.$notifiable->first_name : '').',');

        foreach ($this->lines as $line) {
            $mail->line($line);
        }

        if ($this->actionText && $this->actionUrl) {
            $mail->action($this->actionText, $this->actionUrl);
        }

        return $mail->salutation('L’équipe PRO-LOOKUP — Université ZTF');
    }
}
