"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AvatarUploader } from "@/components/space/AvatarUploader";
import { NotificationsBell } from "@/components/space/NotificationsBell";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { ACCOUNT_STATUS } from "@/lib/format";
import { hasTeacherProfile } from "@/lib/roles";

/** Navigation latérale de l'espace enseignant, adaptée au statut du compte. */
export function SpaceShell({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !me) {
    return <main className="flex-1"><Spinner label="Chargement de votre espace…" /></main>;
  }

  const approved = me.status === "approved";
  const teaching = hasTeacherProfile(me);
  const nav = approved
    ? [
        { href: "/espace", label: "Tableau de bord", icon: "space_dashboard", exact: true },
        { href: "/espace/profil", label: "Modifier mon profil", icon: "edit_square" },
        ...(teaching ? [{ href: "/espace/publications", label: "Mes publications", icon: "article" }] : []),
        { href: "/espace/profil-public", label: "Mon profil public et mon URL", icon: "public" },
        { href: "/espace/parametres", label: "Paramètres du compte", icon: "settings" },
      ]
    : [
        { href: "/espace/en-attente", label: "État de mon inscription", icon: "hourglass_top" },
        ...(me.status === "pending" || me.status === "rejected" ? [{ href: "/espace/profil", label: "Mon profil (brouillon)", icon: "edit_square" }] : []),
      ];

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-8">
      <aside className="lg:col-span-3">
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="flex justify-end">
            <NotificationsBell />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="hero-mesh h-16" aria-hidden />
            <div className="-mt-8 px-5 pb-5 text-center">
              {/* Photo modifiable d'un clic, depuis n'importe quelle page de l'espace. */}
              <div className="flex justify-center">
                <div className="rounded-full bg-white p-1">
                  <AvatarUploader me={me} size="lg" />
                </div>
              </div>
              <p className="mt-3 font-bold text-navy">{me.full_name}</p>
              {me.title && <p className="text-xs text-muted">{me.title}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {me.grade && <GradeBadge name={me.grade.name} size="sm" />}
                {!approved && <StatusBadge tone={ACCOUNT_STATUS[me.status].tone}>{ACCOUNT_STATUS[me.status].label}</StatusBadge>}
              </div>
            </div>
          </div>

          <nav className="rounded-2xl border border-line bg-white p-2 shadow-card" aria-label="Espace enseignant">
            {me.role === "admin" && (
              <Link
                href="/admin"
                className="mb-1 flex items-center gap-3 rounded-xl border-b border-line px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist"
              >
                <Icon name="admin_panel_settings" size={20} className="text-teal-text" />
                Retour à l’administration
              </Link>
            )}
            {nav.map((item) => {
              // « /espace/profil » ne doit pas s'allumer sur « /espace/profil-public ».
              const active = "exact" in item && item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active ? "bg-navy text-white" : "text-ink hover:bg-mist",
                  )}
                >
                  <Icon name={item.icon} size={20} className={active ? "text-teal" : "text-muted"} />
                  {item.label}
                </Link>
              );
            })}
            {approved && teaching && me.slug && (
              <Link
                href={`/in/${me.slug}`}
                className="mt-1 flex items-center gap-3 rounded-xl border-t border-line px-3 py-2.5 text-sm font-semibold text-teal-text hover:bg-mist"
              >
                <Icon name="visibility" size={20} />
                Voir mon profil public
              </Link>
            )}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 lg:col-span-9">{children}</main>
    </div>
  );
}

/** En-tête de page de l'espace enseignant. */
export function SpaceHeading({ eyebrow, title, lead, actions }: { eyebrow?: string; title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-text">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
        {lead && <p className="mt-1 max-w-2xl text-sm text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
