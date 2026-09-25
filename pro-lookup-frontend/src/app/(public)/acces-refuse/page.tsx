import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Accès refusé", robots: { index: false, follow: false } };

/** Page 403 : un compte non administrateur a tenté d'ouvrir l'administration. */
export default function ForbiddenPage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="tnum text-7xl font-extrabold text-line">403</span>
      <span className="mt-2 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <Icon name="block" size={28} />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">Accès refusé</h1>
      <p className="mt-3 text-muted">Cette partie de PRO-LOOKUP est réservée aux administrateurs de l’Université ZTF.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/espace" icon="space_dashboard">Mon espace</ButtonLink>
        <ButtonLink href="/" variant="outline" icon="home">Accueil</ButtonLink>
      </div>
    </section>
  );
}
