import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Profil inexistant, en attente, refusé, suspendu ou supprimé : même page dans tous les cas,
 * sans révéler la raison (brief §6.4).
 */
export default function ProfileNotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-mist text-navy">
        <Icon name="person_off" size={32} />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Ce profil n’est pas disponible</h1>
      <p className="mt-3 text-muted">L’adresse est peut-être erronée, ou ce profil n’est plus publié sur PRO-LOOKUP.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/enseignants" icon="groups">Parcourir l’annuaire</ButtonLink>
        <ButtonLink href="/" variant="outline" icon="home">Accueil</ButtonLink>
      </div>
    </section>
  );
}
