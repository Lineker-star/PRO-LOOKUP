<?php

namespace App\Notifications\Channels;

use App\Models\InAppNotification;
use Illuminate\Notifications\Notification;

/** Enregistre la notification dans le centre de notifications, indépendamment des préférences email. */
class InAppChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toInApp')) {
            return;
        }

        InAppNotification::create(['user_id' => $notifiable->getKey()] + $notification->toInApp($notifiable));
    }
}
