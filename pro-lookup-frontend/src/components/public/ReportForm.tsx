"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/LangProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { PUBLIC_API_URL } from "@/lib/config";
import { REPORT_REASONS } from "@/lib/format";
import type { Dict } from "@/lib/i18n";

/**
 * Signalement d'une publication ou d'un profil par un visiteur (brief §7.6) :
 * motif + commentaire optionnel + email optionnel. Anti-abus : limite de fréquence
 * côté serveur et champ piège invisible pour les robots.
 */
export type ReportTarget = { type: "post"; id: number } | { type: "profile"; slug: string };

export function ReportForm({ target, onDone }: { target: ReportTarget; onDone: () => void }) {
  const { t } = useLang();
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // champ piège
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (state === "sent") {
    return (
      <div className="space-y-4">
        <Alert tone="success" title={t.report_sent}>
          {t.report_thanks}
        </Alert>
        <div className="flex justify-end">
          <Button onClick={onDone}>{t.close}</Button>
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
          if (!res.ok) {
            setState("error");
            setMessage(res.status === 429 ? t.report_too_many : t.report_failed);
            return;
          }
          setState("sent");
        } catch {
          setState("error");
          setMessage(t.server_unreachable);
        }
      }}
    >
      {state === "error" && <Alert tone="danger">{message}</Alert>}

      <Field label={t.report_reason} htmlFor="report-reason" required>
        <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
          <option value="">{t.choose_reason}</option>
          {Object.keys(REPORT_REASONS).map((value) => (
            <option key={value} value={value}>
              {t[`reason_${value}` as keyof Dict] as string}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t.comment} htmlFor="report-comment" hint={t.comment_hint}>
        <Textarea id="report-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} />
      </Field>

      <Field label={t.your_email} htmlFor="report-email" hint={t.email_hint}>
        <Input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" />
      </Field>

      {/* Champ piège : invisible pour les humains, rempli par les robots. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="report-website">Site web</label>
        <input id="report-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          {t.cancel}
        </Button>
        <Button type="submit" variant="primary" icon="flag" loading={state === "sending"} disabled={!reason}>
          {t.send_report}
        </Button>
      </div>
    </form>
  );
}
