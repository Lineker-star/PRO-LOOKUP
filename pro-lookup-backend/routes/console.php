<?php

use App\Services\FrontendRevalidator;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Vide tout le cache des pages publiques Next.js (profils, annuaire, publications, chiffres, listes).
 * À lancer après un déploiement ou une migration qui change la forme des données publiques.
 */
Artisan::command('frontend:revalidate', function (FrontendRevalidator $revalidator) {
    $revalidator->tags(['teachers', 'posts', 'stats', 'references']);
    $this->info('Cache des pages publiques vidé (teachers, posts, stats, references).');
})->purpose('Vider le cache des pages publiques du frontend Next.js');
