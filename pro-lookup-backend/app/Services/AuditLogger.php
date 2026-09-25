<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/** Journalise les actions d'administration (brief §5.2 et §8). */
class AuditLogger
{
    public function log(User $admin, string $action, ?Model $target = null, ?string $reason = null, array $meta = []): AdminAuditLog
    {
        return AdminAuditLog::create([
            'admin_id' => $admin->id,
            'action' => $action,
            'target_type' => $target ? $this->typeOf($target) : null,
            'target_id' => $target?->getKey(),
            'target_label' => $target ? $this->labelOf($target) : null,
            'reason' => $reason,
            'meta' => $meta ?: null,
        ]);
    }

    private function typeOf(Model $model): string
    {
        return match (true) {
            $model instanceof User => 'user',
            $model instanceof Post => 'post',
            default => strtolower(class_basename($model)),
        };
    }

    private function labelOf(Model $model): string
    {
        return match (true) {
            $model instanceof User => $model->full_name,
            $model instanceof Post => $model->title ?: \Illuminate\Support\Str::limit(strip_tags((string) $model->content), 60),
            default => (string) ($model->name ?? $model->getKey()),
        };
    }
}
