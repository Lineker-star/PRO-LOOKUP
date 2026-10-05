<?php

namespace App\Notifications;

use App\Enums\NotificationCategory;
use App\Models\User;
use App\Notifications\Channels\InAppChannel;
use App\Services\Brevo\DailyQuota;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * Notification de la plateforme : centre de notifications (toujours) et email via Brevo
 * (selon la catégorie, les préférences de l'enseignant et le quota quotidien).
 * Le contenu est rédigé dans App\Support\Emails. Envoyée via la file d'attente.
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
        public string $category = NotificationCategory::Account->value,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        $channels = [InAppChannel::class];

        if ($this->emailAllowed($notifiable)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    private function emailAllowed(object $notifiable): bool
    {
        $category = NotificationCategory::from($this->category);

        if ($category->isTransactional()) {
            return true;
        }

        return $notifiable instanceof User
            && $notifiable->emailEnabled($category)
            && DailyQuota::allowsOptional();
    }

    public function toInApp(object $notifiable): array
    {
        return [
            'category' => $this->category,
            'title' => $this->subject,
            'body' => implode(' ', $this->lines),
            'action_url' => $this->actionUrl,
        ];
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

        if (! NotificationCategory::from($this->category)->isTransactional()) {
            $mail->line('Vous ne souhaitez plus recevoir ce type d’email ? '.$this->unsubscribeUrl($notifiable));
        }

        return $mail->salutation('L’équipe PRO-LOOKUP — Université ZTF');
    }

    private function unsubscribeUrl(object $notifiable): string
    {
        return URL::signedRoute('email.unsubscribe', [
            'user' => $notifiable->getKey(),
            'category' => $this->category,
        ]);
    }
}
