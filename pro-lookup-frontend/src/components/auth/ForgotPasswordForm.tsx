"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          const res = await api<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
          setSent(res.message);
        } catch (err) {
          setError(err instanceof ApiError ? (err.field("email") ?? err.message) : "Envoi impossible.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {sent ? (
        <Alert tone="success" title="Vérifiez votre boîte de réception" icon="mark_email_read">
          {sent} Le lien est valable 60 minutes.
        </Alert>
      ) : (
        <>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Adresse email du compte" htmlFor="forgot-email" required>
            <Input id="forgot-email" type="email" autoComplete="email" icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" variant="primary" size="lg" full iconRight="arrow_forward" loading={loading} disabled={!email}>
            Recevoir le lien de réinitialisation
          </Button>
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
        <Link href="/connexion" className="inline-flex items-center gap-1 font-semibold text-navy hover:underline">
          <Icon name="arrow_back" size={18} /> Retour à la connexion
        </Link>
        <Link href="/inscription" className="font-semibold text-teal-text hover:underline">
          Demander un accès
        </Link>
      </div>
    </form>
  );
}
