import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/lib/i18n";

/** Pied de page public (bleu nuit, 4 colonnes comme les maquettes). */
export function PublicFooter({ t }: { t: Dict }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{t.footer_tagline}</p>
          <p className="flex items-center gap-2 text-xs text-white/60">
            <Icon name="location_on" size={16} />
            {t.footer_location}
          </p>
        </div>

        <FooterColumn title={t.footer_explore}>
          <FooterLink href="/">{t.nav_home}</FooterLink>
          <FooterLink href="/enseignants">{t.directory_title}</FooterLink>
          <FooterLink href="/publications">{t.posts_title}</FooterLink>
          <FooterLink href="/recherche">{t.search_title}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer_teachers}>
          <FooterLink href="/connexion">{t.login}</FooterLink>
          <FooterLink href="/inscription">{t.register}</FooterLink>
          <FooterLink href="/mot-de-passe-oublie">{t.forgot_password}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer_legal}>
          <FooterLink href="/confidentialite">{t.privacy}</FooterLink>
          <FooterLink href="/conditions">{t.terms}</FooterLink>
        </FooterColumn>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:px-6 lg:px-8">
          <p>
            © {year} {t.university} — Bertoua. {t.rights}
          </p>
          <p>PRO-LOOKUP</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-white/70 transition-colors hover:text-teal">
        {children}
      </Link>
    </li>
  );
}
