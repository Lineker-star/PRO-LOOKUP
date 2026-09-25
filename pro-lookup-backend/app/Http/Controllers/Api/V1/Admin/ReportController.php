<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use App\Support\Emails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Traitement des signalements : classer sans suite, masquer la publication, suspendre l'auteur. */
class ReportController extends Controller
{
    public const REASONS = [
        'inappropriate' => 'Contenu inapproprié',
        'false_information' => 'Informations fausses',
        'spam' => 'Spam ou publicité',
        'copyright' => 'Atteinte aux droits d’auteur',
        'harassment' => 'Harcèlement ou propos offensants',
        'other' => 'Autre',
    ];

    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    public static function summary(Report $report): array
    {
        $target = $report->target();
        $author = $target instanceof Post ? $target->user : $target;

        return [
            'id' => $report->id,
            'target_type' => $report->target_type,
            'target_id' => $report->target_id,
            'reason' => $report->reason,
            'reason_label' => self::REASONS[$report->reason] ?? $report->reason,
            'comment' => $report->comment,
            'email' => $report->email,
            'status' => $report->status,
            'resolution' => $report->resolution,
            'created_at' => $report->created_at?->toIso8601String(),
            'handled_at' => $report->handled_at?->toIso8601String(),
            'handled_by' => $report->handler?->full_name,
            'target' => $target ? [
                'exists' => true,
                'label' => $target instanceof Post ? ($target->title ?: \Illuminate\Support\Str::limit(strip_tags($target->content), 80)) : $target->full_name,
                'status' => $target->status,
                'post_id' => $target instanceof Post ? $target->id : null,
                'author_id' => $author?->id,
                'author_name' => $author?->full_name,
                'author_slug' => $author?->slug,
                'author_status' => $author?->status,
            ] : ['exists' => false],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'open');
        $reports = Report::with('handler')
            ->when(in_array($status, ['open', 'dismissed', 'actioned'], true), fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $reports->getCollection()->map(fn ($r) => self::summary($r)),
            'meta' => ['current_page' => $reports->currentPage(), 'last_page' => $reports->lastPage(), 'total' => $reports->total()],
            'counts' => [
                'open' => Report::where('status', 'open')->count(),
                'dismissed' => Report::where('status', 'dismissed')->count(),
                'actioned' => Report::where('status', 'actioned')->count(),
            ],
        ]);
    }

    public function show(Report $report): JsonResponse
    {
        return response()->json(['data' => self::summary($report->load('handler'))]);
    }

    /** Une seule action par signalement : classer, masquer la publication ou suspendre l'auteur. */
    public function resolve(Request $request, Report $report): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:dismiss,hide_post,suspend_author'],
            'reason' => ['required_unless:action,dismiss', 'nullable', 'string', 'min:5', 'max:1000'],
        ], ['reason.required_unless' => 'Le motif est obligatoire pour cette action.']);

        if ($report->status !== 'open') {
            return response()->json(['message' => 'Ce signalement a déjà été traité.'], 422);
        }

        $target = $report->target();
        $admin = $request->user();

        if ($data['action'] === 'hide_post') {
            if (! $target instanceof Post || $target->status !== 'published') {
                return response()->json(['message' => 'La publication n’est plus en ligne.'], 422);
            }
            PostController::applyHide($target, $data['reason']);
            $this->audit->log($admin, 'post.hidden', $target, $data['reason'], ['report_id' => $report->id]);
            Emails::postHidden($target, $data['reason']);
            $this->revalidator->post($target->id, $target->user?->slug);
        }

        if ($data['action'] === 'suspend_author') {
            $author = $target instanceof Post ? $target->user : $target;
            if (! $author instanceof User || $author->status !== UserStatus::Approved->value) {
                return response()->json(['message' => 'L’auteur n’est pas un compte actif.'], 422);
            }
            $author->status = UserStatus::Suspended->value;
            $author->suspension_reason = $data['reason'];
            $author->suspended_at = now();
            $author->save();
            $author->tokens()->delete();
            $this->audit->log($admin, 'user.suspended', $author, $data['reason'], ['report_id' => $report->id]);
            Emails::suspended($author, $data['reason']);
            $this->revalidator->teacher($author->slug);
        }

        if ($data['action'] === 'dismiss') {
            $this->audit->log($admin, 'report.dismissed', null, $data['reason'] ?? null, ['report_id' => $report->id]);
        }

        $report->update([
            'status' => $data['action'] === 'dismiss' ? 'dismissed' : 'actioned',
            'resolution' => $data['action'],
            'handled_by' => $admin->id,
            'handled_at' => now(),
        ]);

        return response()->json(['message' => 'Signalement traité.', 'data' => self::summary($report->fresh('handler'))]);
    }
}
