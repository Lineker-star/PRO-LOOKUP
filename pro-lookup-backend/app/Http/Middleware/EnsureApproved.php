<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Réserve une route aux enseignants approuvés (ou aux administrateurs).
 * Un compte en attente, refusé ou suspendu reçoit une 403 (brief §4, zone B).
 */
class EnsureApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || (! $user->isApproved() && ! $user->isAdmin())) {
            return response()->json([
                'message' => 'Votre compte doit être approuvé pour accéder à cette fonctionnalité.',
                'status' => $user?->status,
            ], 403);
        }

        return $next($request);
    }
}
