import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Récupération de compte"
      title="Mot de passe oublié"
      lead="Indiquez l’adresse email de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
