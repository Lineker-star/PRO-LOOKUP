"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { api, ApiError } from "@/lib/api/client";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <Alert tone="danger" title="Lien incomplet">
        Ce lien de réinitialisation est invalide. <Link href="/mot-de-passe-oublie" className="font-semibold underline">Demandez-en un nouveau</Link>.
      </Alert>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          await api("/auth/reset-password", { method: "POST", body: { token, email, password, password_confirmation: confirmation } });
          router.replace("/connexion?reinitialise=1");
        } catch (err) {
          setError(err instanceof ApiError ? err : new ApiError(0, "Modification impossible."));
        } finally {
          setLoading(false);
        }
      }}
    >
      {error && (
        <Alert tone="danger">
          {error.field("email") ?? error.message}{" "}
          {error.field("email") && <Link href="/mot-de-passe-oublie" className="font-semibold underline">Demander un nouveau lien</Link>}
        </Alert>
      )}
      <Field label="Compte" htmlFor="reset-email">
        <Input id="reset-email" value={email} disabled icon="mail" />
      </Field>
      <Field label="Nouveau mot de passe" htmlFor="reset-pass" required hint="8 caractères minimum, avec lettres et chiffres." error={error?.field("password")}>
        <Input id="reset-pass" type="password" autoComplete="new-password" icon="key" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="reset-pass2" required error={confirmation && confirmation !== password ? "Les deux mots de passe ne correspondent pas." : undefined}>
        <Input id="reset-pass2" type="password" autoComplete="new-password" icon="key" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
      </Field>
      <Button type="submit" variant="accent" size="lg" full loading={loading} disabled={!password || password !== confirmation}>
        Enregistrer le mot de passe
      </Button>
    </form>
  );
}
