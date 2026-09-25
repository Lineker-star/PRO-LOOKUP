import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Se connecter", robots: { index: false, follow: false } };

/** Page « Se connecter » (brief §5.3) : réservée aux enseignants et aux administrateurs. */
export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Espace enseignant"
      title="Se connecter à PRO-LOOKUP"
      lead="Accédez à votre espace pour gérer votre profil et vos publications. Aucun compte n’est nécessaire pour consulter le site."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
