"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api/client";
import type { Dashboard } from "@/lib/types";

/**
 * Coque de l'administration (zone C, brief §8) : barre latérale défilante,
 * menu burger sur mobile, aucune modale ni notification flottante, pas de pied de page.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { me, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Le menu mobile est ouvert « pour » une page donnée : il se referme de lui-même après une navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => (await api<{ data: Dashboard }>("/admin/dashboard")).data,
    enabled: me?.role === "admin",
    refetchInterval: 60_000,
  });

  if (loading || !me) return <div className="flex flex-1 items-center justify-center"><Spinner label="Chargement de l’administration…" /></div>;

  const stats = dashboard.data?.stats;
  const groups = [
    {
      title: "Pilotage",
      items: [{ href: "/admin", label: "Tableau de bord", icon: "space_dashboard", exact: true }],
    },
    {
      title: "Enseignants",
      items: [
        { href: "/admin/demandes", label: "Demandes en attente", icon: "pending_actions", count: stats?.pending_requests },
        { href: "/admin/enseignants", label: "Enseignants et administrateurs", icon: "groups" },
        { href: "/admin/creation", label: "Création directe", icon: "person_add" },
      ],
    },
    {
      title: "Contenus",
      items: [
        { href: "/admin/publications", label: "Publications", icon: "article" },
        { href: "/admin/signalements", label: "Signalements", icon: "flag", count: stats?.open_reports },
      ],
    },
    {
      title: "Paramétrage",
      items: [
        { href: "/admin/referentiels", label: "Grades, catégories, écoles", icon: "tune" },
        { href: "/admin/journal", label: "Journal d’audit", icon: "history" },
      ],
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-5">
        <Logo subtitle={false} href="/admin" />
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gold-soft px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-navy">
          <Icon name="shield_person" size={14} /> Administration
        </p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Administration">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{group.title}</p>
            {group.items.map((item) => {
              const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active ? "bg-navy text-white" : "text-ink hover:bg-mist",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon name={item.icon} size={20} className={active ? "text-teal" : "text-muted"} />
                    {item.label}
                  </span>
                  {"count" in item && item.count ? (
                    <span className={clsx("tnum rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-gold text-navy" : "bg-gold-soft text-navy")}>{item.count}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link href="/espace" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-navy hover:bg-mist">
          <Icon name="school" size={18} /> Mon espace enseignant
        </Link>
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-teal-text hover:bg-mist">
          <Icon name="open_in_new" size={18} /> Voir le site public
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-canvas p-3">
          <Avatar src={me.avatar_url} name={me.full_name} size="xs" ring={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{me.full_name}</p>
            <p className="truncate text-xs text-muted">Administrateur</p>
          </div>
          <button
            type="button"
            onClick={async () => { await logout(); router.push("/"); }}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-danger"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line bg-white lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full w-72 max-w-[85vw] bg-white shadow-modal">{sidebar}</div>
          <button type="button" className="flex-1 bg-navy/40" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-lg text-navy hover:bg-mist" aria-label="Ouvrir le menu">
            <Icon name="menu" size={24} />
          </button>
          <Logo subtitle={false} href="/admin" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

/** En-tête de page d'administration (fil d'Ariane + titre + actions). */
export function AdminHeading({ crumbs, title, lead, actions }: { crumbs?: { href?: string; label: string }[]; title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      {crumbs && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted" aria-label="Fil d’Ariane">
          <Link href="/admin" className="hover:text-navy">Administration</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <Icon name="chevron_right" size={16} />
              {c.href ? <Link href={c.href} className="hover:text-navy">{c.label}</Link> : <span className="text-teal-text">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>
          {lead && <p className="mt-1 max-w-3xl text-sm text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
