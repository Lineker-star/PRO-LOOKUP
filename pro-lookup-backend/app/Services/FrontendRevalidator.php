<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Prévient le frontend Next.js qu'un contenu public a changé (brief §9.2),
 * pour qu'il vide immédiatement le cache des pages concernées.
 * Un échec n'empêche jamais l'action d'aboutir : le cache expire de toute façon après 5 minutes.
 */
class FrontendRevalidator
{
    /** @param  array<int, string>  $tags */
    public function tags(array $tags): void
    {
        $url = config('services.frontend.revalidate_url');
        $secret = config('services.frontend.revalidate_secret');

        if (! $url || ! $secret || app()->runningUnitTests()) {
            return;
        }

        try {
            Http::timeout(2)
                ->withHeaders(['x-revalidate-secret' => $secret])
                ->post($url, ['tags' => array_values(array_unique($tags))]);
        } catch (Throwable $e) {
            Log::warning('Revalidation du frontend impossible : '.$e->getMessage());
        }
    }

    public function teacher(?string $slug, array $extra = []): void
    {
        $this->tags(array_filter(['teachers', 'stats', 'posts', $slug ? "teacher:{$slug}" : null, ...$extra]));
    }

    public function post(int $postId, ?string $authorSlug = null): void
    {
        $this->tags(array_filter(['posts', 'stats', "post:{$postId}", $authorSlug ? "teacher:{$authorSlug}" : null]));
    }
}
