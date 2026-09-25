"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLang } from "@/components/providers/LangProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

/**
 * En-tête commun des pages publiques et de l'espace enseignant (brief §13) :
 * logo, Enseignants, Publications, recherche, FR/EN, puis « Se connecter » + « Demander un accès »
 * — ou, pour un enseignant connecté, « Publier » et le menu avatar.
 */
export function PublicHeader() {
  const { t, lang, setLang } = useLang();
  const { me, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/enseignants", label: t.nav_teachers, icon: "groups" },
    { href: "/publications", label: t.nav_posts, icon: "feed" },
  ];
  const canPublish = me?.role === "teacher" && me.status === "approved";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Logo className="shrink-0" subtitle={false} />

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-mist text-navy" : "text-muted hover:text-navy",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="relative mx-auto hidden w-full max-w-sm lg:block" />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="hidden h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-muted hover:bg-mist hover:text-navy sm:inline-flex"
            aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
          >
            <Icon name="translate" size={16} />
            {lang === "fr" ? "EN" : "FR"}
          </button>

          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-mist" aria-hidden />
          ) : me ? (
            <>
              {canPublish && (
                <ButtonLink href="/espace/publications/nouvelle" variant="accent" size="sm" icon="edit_square" className="hidden sm:inline-flex">
                  {t.publish}
                </ButtonLink>
              )}
              {me.role === "admin" && (
                <ButtonLink href="/admin" variant="outline" size="sm" icon="admin_panel_settings" className="hidden sm:inline-flex">
                  {t.admin}
                </ButtonLink>
              )}
              <UserMenu />
            </>
          ) : (
            <>
              <ButtonLink href="/connexion" variant="outline" size="sm" icon="login">
                {t.login}
              </ButtonLink>
              <ButtonLink href="/inscription" variant="primary" size="sm" className="hidden sm:inline-flex">
                {t.request_access}
              </ButtonLink>
            </>
          )}

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-navy hover:bg-mist md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={22} />
            <span className="sr-only">{t.menu}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="menu-mobile" className="border-t border-line bg-white px-4 pb-5 pt-3 md:hidden">
          <HeaderSearch className="relative" />
          <nav className="mt-3 grid gap-1" aria-label="Navigation mobile">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name={item.icon} size={20} className="text-muted" />
                {item.label}
              </Link>
            ))}
            {canPublish && (
              <Link href="/espace/publications/nouvelle" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name="edit_square" size={20} className="text-muted" />
                {t.publish}
              </Link>
            )}
            {!me && (
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name="how_to_reg" size={20} className="text-muted" />
                {t.request_access}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-navy hover:bg-mist"
            >
              <Icon name="translate" size={20} className="text-muted" />
              {lang === "fr" ? "English" : "Français"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
