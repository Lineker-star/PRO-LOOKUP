import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: `${SITE_URL}/confidentialite` },
};

/** Explique quelles données sont publiques et lesquelles restent privées (brief §12). */
export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Informations" title="Politique de confidentialité" updated="septembre 2026">
      <section>
        <h2>Ce qui est public</h2>
        <p>
          PRO-LOOKUP est la vitrine publique du corps enseignant de l’Université ZTF. Une fois un compte approuvé par l’administration, les
          informations suivantes sont consultables par tout le monde, sans compte :
        </p>
        <ul>
          <li>l’en-tête du profil : photo, bannière, nom, grade, titre professionnel, faculté et département ;</li>
          <li>les sections du profil que l’enseignant a choisi de rendre visibles (biographie, expertise, enseignements, parcours…) ;</li>
          <li>les coordonnées que l’enseignant a explicitement rendues publiques (désactivées par défaut) ;</li>
          <li>les publications publiées par l’enseignant.</li>
        </ul>
      </section>
      <section>
        <h2>Ce qui n’est jamais public</h2>
        <ul>
          <li>l’adresse email de connexion (sauf si l’enseignant l’affiche comme coordonnée), le mot de passe et le matricule ;</li>
          <li>les justificatifs fournis lors de l’inscription, consultables uniquement par les administrateurs puis archivés ;</li>
          <li>les brouillons de publication et les publications masquées par l’administration ;</li>
          <li>les profils en attente de validation, refusés ou suspendus.</li>
        </ul>
      </section>
      <section>
        <h2>Vos choix</h2>
        <p>
          Chaque enseignant contrôle, depuis la page « Mon profil public », les sections et coordonnées visibles, ainsi que l’indexation de son
          profil par les moteurs de recherche. Une section masquée n’apparaît nulle part : ni sur la page, ni dans le PDF, ni dans l’aperçu de lien.
        </p>
      </section>
      <section>
        <h2>Signalements</h2>
        <p>
          Lorsqu’un visiteur signale un contenu, son adresse email (facultative) n’est utilisée que pour le recontacter. Son adresse IP est
          conservée sous une forme chiffrée irréversible, uniquement pour limiter les abus.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Pour toute demande relative à vos données, contactez l’administration de l’Université ZTF à Bertoua.</p>
      </section>
    </LegalPage>
  );
}
