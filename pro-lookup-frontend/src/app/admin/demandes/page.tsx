"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Pager, SearchBar, StatusTabs, useDebounced } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { RegistrationSummary } from "@/lib/types";

type Status = "pending" | "approved" | "rejected";
type Response = { data: RegistrationSummary[]; meta: { current_page: number; last_page: number; total: number }; counts: Record<Status, number> };

const STATUS: Record<Status, { label: string; tone: "warning" | "success" | "danger" }> = {
  pending: { label: "En attente", tone: "warning" },
  approved: { label: "Approuvée", tone: "success" },
  rejected: { label: "Refusée", tone: "danger" },
};

/** Demandes d'inscription : liste filtrable → fiche détaillée (brief §8). */
export default function RequestsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const list = useQuery({
    queryKey: ["admin", "requests", status, q, page],
    queryFn: () => api<Response>("/admin/registration-requests", { query: { status, q, page } }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      <AdminHeading
        crumbs={[{ label: "Demandes d’inscription" }]}
        title="Demandes d’inscription"
        lead="Vérifiez le rattachement, le matricule et le justificatif de chaque enseignant avant d’approuver ou de refuser sa demande."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusTabs
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          tabs={[
            { id: "pending", label: "En attente", count: list.data?.counts.pending, tone: "warning" },
            { id: "approved", label: "Approuvées", count: list.data?.counts.approved },
            { id: "rejected", label: "Refusées", count: list.data?.counts.rejected },
          ]}
        />
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom, email ou matricule…" />
      </div>

      {list.isPending ? (
        <Spinner />
      ) : !list.data || list.data.data.length === 0 ? (
        <EmptyState icon="inbox" title={status === "pending" ? "Aucune demande en attente" : "Aucune demande"}>
          Les nouvelles demandes d’inscription apparaîtront ici.
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Enseignant</th>
                  <th className="px-5 py-3">Grade et rattachement</th>
                  <th className="px-5 py-3">Matricule / justificatif</th>
                  <th className="px-5 py-3">Déposée le</th>
                  <th className="px-5 py-3 text-right">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data.data.map((r) => (
                  <tr key={r.id} className="hover:bg-canvas">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {r.user && <Avatar src={r.user.avatar_url} name={r.user.full_name} size="sm" ring={false} />}
                        <div className="min-w-0">
                          <p className="font-semibold text-navy">{r.user?.full_name}</p>
                          <p className="truncate text-xs text-muted">{r.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {r.user?.grade && <GradeBadge name={r.user.grade.name} size="sm" />}
                      <p className="mt-1 text-xs text-muted">{[r.user?.school, r.user?.department].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-navy">{r.matricule}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <Icon name={r.has_document ? "description" : "error"} size={14} className={r.has_document ? "" : "text-danger"} />
                        {r.document_name ?? "Aucun justificatif"}
                      </p>
                    </td>
                    <td className="tnum px-5 py-4 text-xs text-muted">{formatDateTime(r.submitted_at)}</td>
                    <td className="px-5 py-4 text-right">
                      {r.status === "pending" ? (
                        <ButtonLink href={`/admin/demandes/${r.id}`} variant="primary" size="sm" icon="folder_open">Examiner</ButtonLink>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <StatusBadge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusBadge>
                          <ButtonLink href={`/admin/demandes/${r.id}`} variant="ghost" size="sm">Détail</ButtonLink>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} lastPage={list.data.meta.last_page} total={list.data.meta.total} onChange={setPage} label="demande(s)" />
        </Card>
      )}
    </div>
  );
}
