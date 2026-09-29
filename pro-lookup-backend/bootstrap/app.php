<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureApproved;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'approved' => EnsureApproved::class,
            'admin' => EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toutes les erreurs de l'API sont renvoyées en JSON (message + errors), jamais en HTML.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // Message générique en français au lieu du message technique par défaut de Laravel
        // (« No query results for model [App\Models\User] 4 »), par exemple quand on agit sur
        // un compte déjà supprimé. Laravel convertit ModelNotFoundException en NotFoundHttpException
        // avant d'appeler les callbacks « render » : on doit donc intercepter cette dernière et
        // regarder l'exception d'origine via getPrevious().
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            $previous = $e->getPrevious();
            if (($request->is('api/*') || $request->expectsJson()) && $previous instanceof ModelNotFoundException) {
                $message = str_contains($previous->getModel(), 'User')
                    ? 'Ce compte n’existe plus : il a peut-être déjà été supprimé.'
                    : 'Cet élément n’existe plus : il a peut-être déjà été supprimé.';

                return response()->json(['message' => $message], 404);
            }
        });
    })->create();
