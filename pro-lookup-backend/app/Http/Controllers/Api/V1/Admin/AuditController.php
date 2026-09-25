<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Journal d'audit : historique de toutes les actions d'administration. */
class AuditController extends Controller
{
    public const LABELS = [
        'registration.approved' => 'Demande approuvée',
        'registration.rejected' => 'Demande refusée',
        'user.created' => 'Compte créé directement',
        'user.updated' => 'Fiche enseignant modifiée',
        'user.suspended' => 'Compte suspendu',
        'user.reactivated' => 'Compte réactivé',
        'user.slug_reset' => 'URL de profil réinitialisée',
        'user.deleted' => 'Compte supprimé',
        'post.hidden' => 'Publication masquée',
        'post.restored' => 'Publication rétablie',
        'post.deleted' => 'Publication supprimée',
        'report.dismissed' => 'Signalement classé sans suite',
    ];

    public static function present(AdminAuditLog $log): array
    {
        [$type, $verb] = array_pad(explode('.', $log->action, 2), 2, '');
        $referenceLabels = ['created' => 'ajouté(e)', 'renamed' => 'renommé(e)', 'activated' => 'activé(e)', 'deactivated' => 'désactivé(e)'];
        $referenceNames = ['grades' => 'Grade', 'categories' => 'Catégorie', 'faculties' => 'Faculté', 'departments' => 'Département'];

        return [
            'id' => $log->id,
            'action' => $log->action,
            'label' => self::LABELS[$log->action]
                ?? (isset($referenceNames[$type]) ? $referenceNames[$type].' '.($referenceLabels[$verb] ?? $verb) : $log->action),
            'admin' => $log->admin?->full_name,
            'target_type' => $log->target_type,
            'target_id' => $log->target_id,
            'target_label' => $log->target_label,
            'reason' => $log->reason,
            'meta' => $log->meta,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $logs = AdminAuditLog::with('admin')
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', $request->query('action').'%'))
            ->when($request->filled('target_type'), fn ($q) => $q->where('target_type', $request->query('target_type')))
            ->latest('created_at')->latest('id')
            ->paginate(30);

        return response()->json([
            'data' => $logs->getCollection()->map(fn ($l) => self::present($l)),
            'meta' => ['current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage(), 'total' => $logs->total()],
        ]);
    }
}
