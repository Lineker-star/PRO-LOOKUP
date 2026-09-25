import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  alternates: { canonical: `${SITE_URL}/conditions` },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Informations" title="Conditions d’utilisation" updated="septembre 2026">
      <section>
        <h2>Objet</h2>
        <p>
          PRO-LOOKUP présente publiquement les enseignants de l’Université ZTF et leurs publications. Ce n’est pas un réseau social : il n’y a ni
          messagerie, ni mise en relation, ni commentaires.
        </p>
      </section>
      <section>
        <h2>Comptes</h2>
        <ul>
          <li>Seul le personnel enseignant de l’Université ZTF peut demander un compte.</li>
          <li>Chaque demande est vérifiée par l’administration, qui peut l’approuver ou la refuser en indiquant un motif.</li>
          <li>L’enseignant est responsable de l’exactitude des informations de son profil.</li>
        </ul>
      </section>
      <section>
        <h2>Publications</h2>
        <ul>
          <li>Toute publication est publique et visible par tous, sans compte.</li>
          <li>Les contenus doivent respecter la loi, les droits d’auteur et la déontologie universitaire.</li>
          <li>L’administration peut masquer une publication ou suspendre un compte, en communiquant le motif à l’enseignant.</li>
        </ul>
      </section>
      <section>
        <h2>Signalement</h2>
        <p>Tout visiteur peut signaler une publication ou un profil depuis le menu « Plus… ». Les signalements sont examinés par l’administration.</p>
      </section>
    </LegalPage>
  );
}
