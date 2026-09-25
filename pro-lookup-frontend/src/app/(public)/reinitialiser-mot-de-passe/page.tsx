import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false, follow: false } };

/** Choix d'un nouveau mot de passe (lien reçu par email, ou compte créé par un administrateur). */
export default async function ResetPasswordPage(props: PageProps<"/reinitialiser-mot-de-passe">) {
  const sp = await props.searchParams;
  const isNew = sp.nouveau === "1";

  return (
    <AuthShell
      eyebrow={isNew ? "Activation du compte" : "Récupération de compte"}
      title={isNew ? "Définissez votre mot de passe" : "Choisissez un nouveau mot de passe"}
      lead={isNew ? "Votre compte a été créé par l’administration de l’Université ZTF. Choisissez votre mot de passe pour y accéder." : undefined}
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
