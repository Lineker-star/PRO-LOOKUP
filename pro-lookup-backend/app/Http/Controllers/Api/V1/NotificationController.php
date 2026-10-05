<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\NotificationCategory;
use App\Http\Controllers\Controller;
use App\Models\InAppNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Centre de notifications (cloche) et préférences d'email de l'enseignant connecté. */
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = $user->inAppNotifications()->latest()->paginate(20);

        return response()->json([
            'data' => $items->getCollection()->map(fn (InAppNotification $n) => [
                'id' => $n->id,
                'category' => $n->category,
                'title' => $n->title,
                'body' => $n->body,
                'action_url' => $n->action_url,
                'read' => $n->isRead(),
                'created_at' => $n->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $items->currentPage(), 'last_page' => $items->lastPage(), 'total' => $items->total()],
            'unread_count' => $user->inAppNotifications()->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = $request->user()->inAppNotifications()->findOrFail($id);
        $notification->forceFill(['read_at' => $notification->read_at ?? now()])->save();

        return response()->json(['unread_count' => $request->user()->inAppNotifications()->whereNull('read_at')->count()]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->inAppNotifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['unread_count' => 0]);
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->preferencesFor($request->user())]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $categories = array_map(fn (NotificationCategory $c) => $c->value, NotificationCategory::optional());

        $data = $request->validate(array_fill_keys($categories, ['sometimes', 'boolean']));
        $user->forceFill(['email_preferences' => array_merge($user->email_preferences ?? [], $data)])->save();

        return response()->json(['data' => $this->preferencesFor($user->fresh())]);
    }

    /** Lien de désabonnement présent dans chaque email optionnel (signé, sans connexion). */
    public function unsubscribe(User $user, string $category): Response
    {
        $cat = NotificationCategory::tryFrom($category);
        abort_if(! $cat || $cat->isTransactional(), 404);

        $user->forceFill(['email_preferences' => array_merge($user->email_preferences ?? [], [$cat->value => false])])->save();

        return response(
            '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Désabonnement</title>'
            .'<body style="font-family:sans-serif;max-width:560px;margin:4rem auto;padding:0 1rem;color:#0A2540">'
            .'<h1>Désabonnement enregistré</h1>'
            .'<p>Vous ne recevrez plus ce type d’email. Vous pouvez changer ce réglage à tout moment dans votre espace PRO-LOOKUP.</p>'
            .'</body></html>',
            200,
            ['Content-Type' => 'text/html; charset=utf-8'],
        );
    }

    /** @return array<string, bool> */
    private function preferencesFor(User $user): array
    {
        return collect(NotificationCategory::optional())
            ->mapWithKeys(fn (NotificationCategory $c) => [$c->value => $user->emailEnabled($c)])
            ->all();
    }
}
