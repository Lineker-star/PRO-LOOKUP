"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Pager, SearchBar, StatusTabs, useDebounced } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { api } from "@/lib/api/client";
import { PUBLIC_API_URL } from "@/lib/config";
import { ACCOUNT_STATUS, formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { AccountStatus, AdminUserRow, Ref, School } from "@/lib/types";

type Response = { data: AdminUserRow[]; meta: { current_page: number; last_page: number; total: number }; counts: Record<"all" | "admin" | AccountStatus, number> };

/** Gestion des comptes : recherche, filtres (grade, école supérieure, statut, administrateurs) → fiche (brief §8). */
export default function TeachersAdminPage() {
  const [status, setStatus] = useState<"" | "admin" | AccountStatus>("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const refs = useQuery({
    queryKey: ["admin-list-refs"],
    queryFn: async () => {
      const [g, f] = await Promise.all([fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()), fetch(`${PUBLIC_API_URL}/public/schools`).then((r) => r.json())]);
      return { grades: g.data as Ref[], schools: f.data as School[] };
    },
    staleTime: 600_000,
  });

  const list = useQuery({
    queryKey: ["admin", "users", status, grade, school, q, page],
    queryFn: () => api<Response>("/admin/users", { query: { status, grade, school, q, page } }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      <AdminHeading
        crumbs={[{ label: "Comptes" }]}
        title="Enseignants et administrateurs"
        lead="Tous les comptes, quel que soit leur statut. Ouvrez une fiche pour suspendre, réactiver, supprimer un compte ou nommer un administrateur. Les informations d’un enseignant ne sont modifiables que par lui-même."
        actions={<ButtonLink href="/admin/creation" variant="primary" icon="person_add">Création directe</ButtonLink>}
      />

      <StatusTabs
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        tabs={[
          { id: "", label: "Tous", count: list.data?.counts.all },
          { id: "approved", label: "Approuvés", count: list.data?.counts.approved },
          { id: "pending", label: "En attente", count: list.data?.counts.pending, tone: "warning" },
          { id: "suspended", label: "Suspendus", count: list.data?.counts.suspended, tone: "danger" },
          { id: "rejected", label: "Refusés", count: list.data?.counts.rejected },
          { id: "admin", label: "Administrateurs", count: list.data?.counts.admin },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom, email, matricule, école…" />
        <div className="w-48">
          <Select aria-label="Grade" value={grade} onChange={(e) => { setGrade(e.target.value); setPage(1); }}>
            <option value="">Tous les grades</option>
            {refs.data?.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <div className="w-64">
          <Select aria-label="École supérieure" value={school} onChange={(e) => { setSchool(e.target.value); setPage(1); }}>
            <option value="">Toutes les écoles supérieures</option>
            {refs.data?.schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </div>

      {list.isPending ? (
        <Spinner />
      ) : !list.data || list.data.data.length === 0 ? (
        <EmptyState icon="person_search" title="Aucun compte trouvé">Modifiez la recherche ou les filtres.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3">Enseignant</th>
                  <th className="px-5 py-3">Grade</th>
                  <th className="px-5 py-3">École supérieure · Département / Filière</th>
                  <th className="px-5 py-3 text-center">Publications</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data.data.map((u) => (
                  <tr key={u.id} className={u.status === "suspended" ? "bg-danger-soft/40" : "hover:bg-canvas"}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={u.full_name} size="sm" ring={false} />
                        <div className="min-w-0">
                          <Link href={`/admin/enseignants/${u.id}`} className="font-semibold text-navy hover:underline">{u.full_name}</Link>
                          {u.role === "admin" && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-navy px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-white">
                              <Icon name="admin_panel_settings" size={12} /> Admin
                            </span>
                          )}
                          <p className="truncate text-xs text-muted">{u.email}{u.matricule ? ` · ${u.matricule}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{u.grade ? <GradeBadge name={u.grade.name} size="sm" /> : "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-muted">{[u.school, u.department].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="tnum px-5 py-3.5 text-center font-semibold text-navy">{u.posts_count}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={ACCOUNT_STATUS[u.status].tone}>{ACCOUNT_STATUS[u.status].label}</StatusBadge>
                      {u.approved_at && <p className="mt-1 text-[11px] text-muted">depuis le {formatDate(u.approved_at)}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ButtonLink href={`/admin/enseignants/${u.id}`} variant="outline" size="sm" icon="manage_accounts">Fiche</ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} lastPage={list.data.meta.last_page} total={list.data.meta.total} onChange={setPage} label="compte(s)" />
        </Card>
      )}
    </div>
  );
}
