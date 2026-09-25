<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Le lien « mot de passe oublié » pointe vers la page du frontend Next.js.
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim((string) config('app.frontend_url'), '/')
            .'/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()));

        // Limitation des tentatives (brief §12).
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);
        RateLimiter::for('register', fn (Request $request) => Limit::perHour(10)->by($request->ip()));
        RateLimiter::for('password', fn (Request $request) => Limit::perMinute(3)->by($request->ip()));
        RateLimiter::for('reports', fn (Request $request) => [
            Limit::perMinute(3)->by($request->ip()),
            Limit::perDay(30)->by($request->ip()),
        ]);
    }
}
