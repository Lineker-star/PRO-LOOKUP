import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getDict } from "@/lib/i18n-server";

/** Page 404 générale. */
export default async function NotFound() {
  const t = await getDict();

  return (
    <>
      <PublicHeader />
      <main className="flex flex-1 items-center">
        <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
          <span className="tnum text-7xl font-extrabold text-line">404</span>
          <span className="mt-2 flex size-14 items-center justify-center rounded-2xl bg-mist text-navy">
            <Icon name="explore_off" size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">Page introuvable</h1>
          <p className="mt-3 text-muted">Cette page n’existe pas ou n’est plus disponible.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" icon="home">Retour à l’accueil</ButtonLink>
            <ButtonLink href="/enseignants" variant="outline" icon="groups">Annuaire des enseignants</ButtonLink>
          </div>
        </section>
      </main>
      <PublicFooter t={t} />
    </>
  );
}
