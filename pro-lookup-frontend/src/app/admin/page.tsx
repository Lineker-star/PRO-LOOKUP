"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Kpi } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

/** Tableau de bord d'administration (brief §8) — maquette « vue d'ensemble zone C ». */
export default function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: async () => (await api<{ data: Dashboard }>("/admin/dashboard")).data });

  if (dashboard.isPending) return <Spinner />;
  const d = dashboard.data;

  return (
    <div className="space-y-6">
      <AdminHeading
        title="Tableau de bord"
        lead="Vue d’ensemble de la plateforme : comptes, demandes d’inscription, publications et signalements."
        actions={<ButtonLink href="/admin/creation" variant="primary" icon="person_add">Créer un compte enseignant</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Enseignants actifs" value={d?.stats.active_teachers} icon="groups" tone="teal" hint={`${d?.stats.suspended_teachers ?? 0} suspendu(s)`} />
        <Kpi
          label="Demandes en attente"
          value={d?.stats.pending_requests}
          icon="pending_actions"
          tone="gold"
          hint={<Link href="/admin/demandes" className="font-semibold text-teal-text hover:underline">Examiner les demandes →</Link>}
        />
        <Kpi label="Publications (30 jours)" value={d?.stats.posts_last_30_days} icon="article" hint={`${d?.stats.published_posts ?? 0} en ligne · ${d?.stats.hidden_posts ?? 0} masquée(s)`} />
        <Kpi
          label="Signalements ouverts"
          value={d?.stats.open_reports}
          icon="flag"
          tone="danger"
          hint={<Link href="/admin/signalements" className="font-semibold text-teal-text hover:underline">Traiter les signalements →</Link>}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Dernières demandes d’inscription</h2>
            <Link href="/admin/demandes" className="text-sm font-semibold text-teal-text hover:underline">Toutes les demandes</Link>
          </div>
          {d && d.latest_requests.length > 0 ? (
            <ul className="divide-y divide-line">
              {d.latest_requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {r.user && <Avatar src={r.user.avatar_url} name={r.user.full_name} size="sm" />}
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                        {r.user?.full_name}
                        {r.user?.grade && <GradeBadge name={r.user.grade.name} size="sm" />}
                      </p>
                      <p className="truncate text-xs text-muted">{[r.user?.department?.name, r.user?.email].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{timeAgo(r.submitted_at)}</span>
                    <ButtonLink href={`/admin/demandes/${r.id}`} variant="outline" size="sm" icon="folder_open">Examiner</ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted">Aucune demande en attente.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Signalements récents</h2>
            <Link href="/admin/signalements" className="text-sm font-semibold text-teal-text hover:underline">Tout voir</Link>
          </div>
          {d && d.latest_reports.length > 0 ? (
            <ul className="divide-y divide-line">
              {d.latest_reports.map((r) => (
                <li key={r.id} className="px-5 py-3.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <Icon name={r.target_type === "post" ? "article" : "person"} size={18} className="text-danger" />
                    {r.reason_label}
                  </p>
                  <p className="truncate text-xs text-muted">{r.target.exists ? r.target.label : "Contenu supprimé"} · {timeAgo(r.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted">Aucun signalement ouvert.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="history" size={20} className="text-teal-text" /> Journal d’audit</h2>
          <Link href="/admin/journal" className="text-sm font-semibold text-teal-text hover:underline">Journal complet</Link>
        </div>
        {d && d.latest_audit.length > 0 ? (
          <ol className="divide-y divide-line">
            {d.latest_audit.map((log) => (
              <li key={log.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{log.label}{log.target_label ? ` — ${log.target_label}` : ""}</p>
                  <p className="text-xs text-muted">par {log.admin ?? "—"}{log.reason ? ` · motif : « ${log.reason} »` : ""}</p>
                </div>
                <span className="tnum text-xs text-muted">{formatDateTime(log.created_at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">Aucune action enregistrée pour l’instant.</p>
        )}
      </Card>
    </div>
  );
}
