<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Post;
use App\Models\RegistrationRequest;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/** Indicateurs du tableau de bord d'administration (brief §8). */
class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $pending = RegistrationRequest::where('status', 'pending')
            ->with(['user.rank', 'user.faculty', 'user.departmentRef'])
            ->latest()->limit(5)->get();

        return response()->json(['data' => [
            'stats' => [
                'active_teachers' => User::teachers()->where('status', 'approved')->count(),
                'pending_requests' => RegistrationRequest::where('status', 'pending')->count(),
                'suspended_teachers' => User::teachers()->where('status', 'suspended')->count(),
                'posts_last_30_days' => Post::where('status', 'published')->where('published_at', '>=', now()->subDays(30))->count(),
                'published_posts' => Post::where('status', 'published')->count(),
                'hidden_posts' => Post::where('status', 'hidden')->count(),
                'open_reports' => Report::where('status', 'open')->count(),
            ],
            'latest_requests' => $pending->map(fn (RegistrationRequest $r) => RegistrationController::summary($r)),
            'latest_reports' => Report::where('status', 'open')->latest()->limit(5)->get()
                ->map(fn (Report $r) => ReportController::summary($r)),
            'latest_audit' => AdminAuditLog::with('admin')->latest('created_at')->limit(8)->get()
                ->map(fn (AdminAuditLog $l) => AuditController::present($l)),
        ]]);
    }
}
