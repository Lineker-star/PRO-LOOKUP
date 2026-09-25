"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Pager, StatusTabs } from "@/components/admin/AdminUi";
import { Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { AuditEntry } from "@/lib/types";

type Response = { data: AuditEntry[]; meta: { current_page: number; last_page: number; total: number } };

const icons: Record<string, string> = { registration: "how_to_reg", user: "person", post: "article", report: "flag" };

/** Journal d'audit : historique de toutes les actions d'administration (brief §5.2, §8). */
export default function AuditPage() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const logs = useQuery({
    queryKey: ["admin", "audit", filter, page],
    queryFn: () => api<Response>("/admin/audit-log", { query: { action: filter, page } }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      <AdminHeading crumbs={[{ label: "Journal d’audit" }]} title="Journal d’audit" lead="Qui a fait quoi, quand, et pour quel motif." />
      <StatusTabs
        value={filter}
        onChange={(v) => { setFilter(v); setPage(1); }}
        tabs={[
          { id: "", label: "Toutes les actions" },
          { id: "registration", label: "Demandes" },
          { id: "user", label: "Comptes" },
          { id: "post", label: "Publications" },
          { id: "report", label: "Signalements" },
        ]}
      />
      {logs.isPending ? (
        <Spinner />
      ) : !logs.data || logs.data.data.length === 0 ? (
        <EmptyState icon="history" title="Aucune action enregistrée" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Cible</th>
                  <th className="px-5 py-3">Administrateur</th>
                  <th className="px-5 py-3">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.data.data.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-canvas">
                    <td className="tnum whitespace-nowrap px-5 py-3 text-xs text-muted">{formatDateTime(log.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-navy">
                        <Icon name={icons[log.action.split(".")[0]] ?? "tune"} size={18} className="text-teal-text" />
                        {log.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {log.target_type === "user" && log.target_id ? (
                        <Link href={`/admin/enseignants/${log.target_id}`} className="font-semibold text-navy hover:underline">{log.target_label}</Link>
                      ) : (
                        <span className="text-ink">{log.target_label ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink">{log.admin ?? "—"}</td>
                    <td className="max-w-xs px-5 py-3 text-xs text-muted">{log.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} lastPage={logs.data.meta.last_page} total={logs.data.meta.total} onChange={setPage} label="action(s)" />
        </Card>
      )}
    </div>
  );
}
