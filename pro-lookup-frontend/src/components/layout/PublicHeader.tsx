"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLang } from "@/components/providers/LangProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { canPublish } from "@/lib/roles";

/**
 * En-tête commun des pages publiques et de l'espace enseignant (brief §13) :
 * logo, Accueil, Enseignants, Publications, recherche, langue, puis « Se connecter » + « S’inscrire »
 * — ou, pour un compte connecté, « Publier » et le menu avatar.
 */
export function PublicHeader() {
  const { t } = useLang();
  const { me, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/", label: t.nav_home, icon: "home" },
    { href: "/enseignants", label: t.nav_teachers, icon: "groups" },
    { href: "/publications", label: t.nav_posts, icon: "feed" },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const publisher = canPublish(me);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Logo className="shrink-0" subtitle={false} />

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label={t.main_nav}>
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-mist text-navy" : "text-muted hover:text-navy",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="relative mx-auto hidden w-full max-w-sm xl:block" />

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" />

          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-mist" aria-hidden />
          ) : me ? (
            <>
              {publisher && (
                <ButtonLink href="/espace/publications/nouvelle" variant="accent" size="sm" icon="edit_square" className="hidden sm:inline-flex">
                  {t.publish}
                </ButtonLink>
              )}
              {me.role === "admin" && (
                <ButtonLink href="/admin" variant="outline" size="sm" icon="admin_panel_settings" className="hidden lg:inline-flex">
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
              <ButtonLink href="/inscription" variant="primary" size="sm" icon="how_to_reg" className="hidden sm:inline-flex">
                {t.register}
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
        <div id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-white px-4 pb-5 pt-3 md:hidden">
          <HeaderSearch className="relative" />
          <nav className="mt-3 grid gap-1" aria-label={t.mobile_nav}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist",
                  isActive(item.href) && "bg-mist",
                )}
              >
                <Icon name={item.icon} size={20} className="text-muted" />
                {item.label}
              </Link>
            ))}
            {publisher && (
              <Link href="/espace/publications/nouvelle" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name="edit_square" size={20} className="text-muted" />
                {t.publish}
              </Link>
            )}
            {me?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name="admin_panel_settings" size={20} className="text-muted" />
                {t.admin}
              </Link>
            )}
            {!me && (
              <Link href="/inscription" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-mist">
                <Icon name="how_to_reg" size={20} className="text-muted" />
                {t.register}
              </Link>
            )}
          </nav>
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">
              <Icon name="translate" size={16} /> {t.language}
            </p>
            <LanguageSwitcher variant="grid" />
          </div>
        </div>
      )}
    </header>
  );
}
