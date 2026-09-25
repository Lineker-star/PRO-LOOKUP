"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Pager, ReasonAction, StatusTabs } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui/Badge";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { ReportSummary } from "@/lib/types";

type Status = "open" | "dismissed" | "actioned";
type Response = { data: ReportSummary[]; meta: { current_page: number; last_page: number; total: number }; counts: Record<Status, number> };

/** Signalements : classer sans suite, masquer la publication, suspendre l'auteur (brief §8). */
export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("open");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "reports", status, page],
    queryFn: () => api<Response>("/admin/reports", { query: { status, page } }),
    placeholderData: (prev) => prev,
  });

  const resolve = async (id: number, action: "dismiss" | "hide_post" | "suspend_author", reason: string) => {
    const res = await api<{ message: string }>(`/admin/reports/${id}/resolve`, { method: "POST", body: { action, reason: reason || null } });
    setMessage(res.message);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div className="space-y-5">
      <AdminHeading crumbs={[{ label: "Signalements" }]} title="Signalements" lead="Contenus signalés par les visiteurs. Chaque décision est inscrite au journal d’audit." />
      {message && <Alert tone="success">{message}</Alert>}

      <StatusTabs
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        tabs={[
          { id: "open", label: "À traiter", count: list.data?.counts.open, tone: "danger" },
          { id: "actioned", label: "Suivis d’une action", count: list.data?.counts.actioned },
          { id: "dismissed", label: "Classés sans suite", count: list.data?.counts.dismissed },
        ]}
      />

      {list.isPending ? (
        <Spinner />
      ) : !list.data || list.data.data.length === 0 ? (
        <EmptyState icon="flag" title={status === "open" ? "Aucun signalement à traiter" : "Aucun signalement"}>Les signalements des visiteurs apparaîtront ici.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {list.data.data.map((r) => (
              <li key={r.id} className="space-y-3 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                        <Icon name="flag" size={14} /> {r.reason_label}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{r.target_type === "post" ? "Publication" : "Profil"}</span>
                      <span className="text-xs text-muted">· {formatDateTime(r.created_at)}</span>
                    </p>
                    {r.target.exists ? (
                      <p className="mt-2 font-semibold text-navy">
                        {r.target.post_id ? (
                          <a href={`/publications/${r.target.post_id}`} target="_blank" rel="noopener" className="hover:underline">{r.target.label}</a>
                        ) : r.target.author_slug ? (
                          <a href={`/in/${r.target.author_slug}`} target="_blank" rel="noopener" className="hover:underline">{r.target.label}</a>
                        ) : (
                          r.target.label
                        )}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted">Le contenu signalé n’existe plus.</p>
                    )}
                    {r.target.exists && r.target.author_name && (
                      <p className="text-xs text-muted">
                        Auteur :{" "}
                        {r.target.author_id ? <Link href={`/admin/enseignants/${r.target.author_id}`} className="font-semibold text-navy hover:underline">{r.target.author_name}</Link> : r.target.author_name}
                        {r.target.author_status && r.target.author_status !== "approved" ? ` (${r.target.author_status})` : ""}
                      </p>
                    )}
                    {r.comment && <p className="mt-2 rounded-lg bg-canvas p-3 text-sm text-ink/85">« {r.comment} »</p>}
                    {r.email && <p className="mt-1 text-xs text-muted">Contact du signaleur : {r.email}</p>}
                  </div>
                  {r.status !== "open" && (
                    <div className="text-right">
                      <StatusBadge tone={r.status === "actioned" ? "success" : "neutral"}>{r.status === "actioned" ? "Action prise" : "Classé sans suite"}</StatusBadge>
                      <p className="mt-1 text-xs text-muted">{r.handled_by} · {formatDateTime(r.handled_at)}</p>
                    </div>
                  )}
                </div>

                {r.status === "open" && (
                  <div className="flex flex-wrap items-start gap-3">
                    <ReasonAction label="Classer sans suite" icon="done" tone="primary" requireReason={false} reasonLabel="Note (facultative)" confirmLabel="Classer" onConfirm={(reason) => resolve(r.id, "dismiss", reason)} size="sm" />
                    {r.target_type === "post" && r.target.exists && r.target.status === "published" && (
                      <ReasonAction label="Masquer la publication" icon="visibility_off" confirmLabel="Masquer" onConfirm={(reason) => resolve(r.id, "hide_post", reason)} size="sm" />
                    )}
                    {r.target.exists && r.target.author_status === "approved" && (
                      <ReasonAction label="Suspendre l’auteur" icon="block" confirmLabel="Suspendre" description="Le profil et toutes ses publications sont retirés immédiatement." onConfirm={(reason) => resolve(r.id, "suspend_author", reason)} size="sm" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Pager page={page} lastPage={list.data.meta.last_page} total={list.data.meta.total} onChange={setPage} label="signalement(s)" />
        </Card>
      )}
    </div>
  );
}
