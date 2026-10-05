<?php

namespace App\Services\Brevo;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Transport Symfony/Laravel qui envoie chaque email via l'API transactionnelle Brevo.
 * Tous les emails de la plateforme passent ainsi par Brevo sans modifier leur rédaction.
 */
class BrevoTransport extends AbstractTransport
{
    private const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

    public function __construct(private string $apiKey, private string $senderEmail, private string $senderName)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = $message->getOriginalMessage();
        if (! $email instanceof Email) {
            throw new \RuntimeException('Brevo : seuls les emails au format Symfony Email sont pris en charge.');
        }

        $payload = [
            'sender' => ['email' => $this->senderEmail, 'name' => $this->senderName],
            'to' => array_map(fn (Address $a) => $this->recipient($a), $email->getTo()),
            'subject' => $email->getSubject(),
            'htmlContent' => $email->getHtmlBody() ?: null,
            'textContent' => $email->getTextBody() ?: null,
            'tags' => ['pro-lookup'],
        ];

        if ($reply = $email->getReplyTo()[0] ?? null) {
            $payload['replyTo'] = $this->recipient($reply);
        }

        Http::withHeaders(['api-key' => $this->apiKey, 'accept' => 'application/json'])
            ->timeout(10)
            ->post(self::ENDPOINT, array_filter($payload, fn ($v) => $v !== null))
            ->throw();

        DailyQuota::record();
    }

    private function recipient(Address $address): array
    {
        return array_filter(['email' => $address->getAddress(), 'name' => $address->getName() ?: null]);
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}
