"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { Session } from "@/lib/types";

/** Paramètres du compte : sécurité (mot de passe, sessions) et langue (brief §10). */
export default function SettingsPage() {
  const { me, logout } = useAuth();
  const router = useRouter();
  if (!me) return <Spinner />;

  return (
    <div className="space-y-6">
      <SpaceHeading eyebrow="Compte" title="Paramètres du compte" lead="Sécurité de votre compte et préférences d’affichage." />

      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="badge" size={20} className="text-teal-text" /> Compte</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-muted">Email de connexion</dt><dd className="font-semibold text-navy">{me.email}</dd></div>
          <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-muted">Matricule (privé)</dt><dd className="font-semibold text-navy">{me.matricule ?? "—"}</dd></div>
          <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-muted">Membre depuis</dt><dd className="font-semibold text-navy">{formatDateTime(me.created_at)}</dd></div>
          <div className="rounded-lg bg-canvas p-3"><dt className="text-xs text-muted">Compte approuvé le</dt><dd className="font-semibold text-navy">{formatDateTime(me.approved_at) || "—"}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted">L’email de connexion et le matricule ne sont pas modifiables. Pour supprimer votre compte, adressez-vous à l’administration.</p>
      </Card>

      <PasswordCard />
      <SessionsCard />

      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="translate" size={20} className="text-teal-text" /> Langue des pages publiques</h2>
        <p className="mt-1 text-sm text-muted">
          Accueil, annuaire, publications, recherche et profils publics sont disponibles en 11 langues. Votre espace reste en français.
        </p>
        <LanguageSwitcher variant="grid" className="mt-4" />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="font-bold text-navy">Se déconnecter</h2>
          <p className="text-sm text-muted">Ferme la session sur cet appareil.</p>
        </div>
        <Button variant="outline" icon="logout" onClick={async () => { await logout(); router.push("/"); }}>Se déconnecter</Button>
      </Card>
    </div>
  );
}

function PasswordCard() {
  const [v, setV] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="password" size={20} className="text-teal-text" /> Mot de passe</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setDone(null);
          try {
            const res = await api<{ message: string }>("/me/password", { method: "PUT", body: v });
            setDone(res.message);
            setV({ current_password: "", password: "", password_confirmation: "" });
          } catch (err) {
            setError(err instanceof ApiError ? err : new ApiError(0, "Modification impossible."));
          } finally {
            setSaving(false);
          }
        }}
      >
        {done && <Alert tone="success" className="sm:col-span-3">{done}</Alert>}
        {error && !error.field("current_password") && !error.field("password") && <Alert tone="danger" className="sm:col-span-3">{error.message}</Alert>}
        <Field label="Mot de passe actuel" htmlFor="pw-current" error={error?.field("current_password")}>
          <Input id="pw-current" type="password" autoComplete="current-password" value={v.current_password} onChange={(e) => setV({ ...v, current_password: e.target.value })} required />
        </Field>
        <Field label="Nouveau mot de passe" htmlFor="pw-new" error={error?.field("password")} hint="8 caractères, lettres et chiffres.">
          <Input id="pw-new" type="password" autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required />
        </Field>
        <Field label="Confirmation" htmlFor="pw-confirm">
          <Input id="pw-confirm" type="password" autoComplete="new-password" value={v.password_confirmation} onChange={(e) => setV({ ...v, password_confirmation: e.target.value })} required />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" icon="key" loading={saving}>Mettre à jour le mot de passe</Button>
        </div>
      </form>
    </Card>
  );
}

function SessionsCard() {
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: async () => (await api<{ data: Session[] }>("/me/sessions")).data });
  const [busy, setBusy] = useState(false);

  const run = async (path: string) => {
    setBusy(true);
    try {
      const res = await api<{ data: Session[] }>(path, { method: "DELETE" });
      queryClient.setQueryData(["sessions"], res.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="devices" size={20} className="text-teal-text" /> Sessions actives</h2>
        <Button variant="outline" size="sm" icon="logout" loading={busy} onClick={() => run("/me/sessions")}>Déconnecter les autres appareils</Button>
      </div>
      {sessions.isPending ? (
        <Spinner />
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {sessions.data?.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mist text-navy"><Icon name="computer" size={20} /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{s.name}</p>
                  <p className="text-xs text-muted">
                    {s.current ? "Cet appareil · " : ""}Dernière activité : {formatDateTime(s.last_used_at ?? s.created_at)}
                  </p>
                </div>
              </div>
              {s.current ? (
                <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Session actuelle</span>
              ) : (
                <Button variant="ghost" size="sm" className="text-danger" disabled={busy} onClick={() => run(`/me/sessions/${s.id}`)}>Déconnecter</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
