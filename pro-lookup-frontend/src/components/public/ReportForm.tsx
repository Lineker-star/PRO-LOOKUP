"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { PUBLIC_API_URL } from "@/lib/config";
import { REPORT_REASONS } from "@/lib/format";

/**
 * Signalement d'une publication ou d'un profil par un visiteur (brief §7.6) :
 * motif + commentaire optionnel + email optionnel. Anti-abus : limite de fréquence
 * côté serveur et champ piège invisible pour les robots.
 */
export type ReportTarget = { type: "post"; id: number } | { type: "profile"; slug: string };

export function ReportForm({ target, onDone }: { target: ReportTarget; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // champ piège
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (state === "sent") {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Signalement transmis">
          {message || "Merci. L’administration de l’université va examiner ce contenu."}
        </Alert>
        <div className="flex justify-end">
          <Button onClick={onDone}>Fermer</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        try {
          const res = await fetch(`${PUBLIC_API_URL}/public/reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              target_type: target.type,
              ...(target.type === "post" ? { target_id: target.id } : { target_slug: target.slug }),
              reason,
              comment,
              email: email || null,
              website,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setState("error");
            setMessage(res.status === 429 ? "Trop de signalements envoyés. Réessayez plus tard." : (data.message ?? "Envoi impossible."));
            return;
          }
          setMessage(data.message);
          setState("sent");
        } catch {
          setState("error");
          setMessage("Le serveur est injoignable.");
        }
      }}
    >
      {state === "error" && <Alert tone="danger">{message}</Alert>}

      <Field label="Motif du signalement" htmlFor="report-reason" required>
        <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
          <option value="">Choisir un motif…</option>
          {Object.entries(REPORT_REASONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Commentaire" htmlFor="report-comment" hint="Facultatif — précisez ce qui pose problème.">
        <Textarea id="report-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} />
      </Field>

      <Field label="Votre email" htmlFor="report-email" hint="Facultatif — pour être recontacté si nécessaire.">
        <Input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" />
      </Field>

      {/* Champ piège : invisible pour les humains, rempli par les robots. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="report-website">Site web</label>
        <input id="report-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" icon="flag" loading={state === "sending"} disabled={!reason}>
          Envoyer le signalement
        </Button>
      </div>
    </form>
  );
}
