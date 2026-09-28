"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, Card } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { profileUrl, PUBLIC_API_URL } from "@/lib/config";
import type { AdminUserDetail, Ref, Suggestions } from "@/lib/types";

const empty = { first_name: "", last_name: "", email: "", grade_id: "", school: "", department: "", title: "", expertise: "", matricule: "", reason: "" };

/**
 * Création directe d'un compte enseignant, pleine page (brief §5.2, §8) :
 * compte approuvé d'office, l'enseignant reçoit un email pour définir son mot de passe.
 */
export default function DirectCreationPage() {
  const queryClient = useQueryClient();
  const [v, setV] = useState(empty);
  const [error, setError] = useState<ApiError | null>(null);
  const [created, setCreated] = useState<{ message: string; user: AdminUserDetail } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const refs = useQuery({
    queryKey: ["creation-refs"],
    queryFn: async () => {
      const [g, s] = await Promise.all([fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()), fetch(`${PUBLIC_API_URL}/public/suggestions`).then((r) => r.json())]);
      return { grades: g.data as Ref[], suggestions: s.data as Suggestions };
    },
    staleTime: 600_000,
  });
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [key]: e.target.value });

  if (created) {
    return (
      <div className="space-y-6">
        <AdminHeading crumbs={[{ label: "Création directe" }]} title="Compte créé" />
        <Card className="p-8 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success"><Icon name="task_alt" size={36} /></span>
          <h2 className="mt-5 text-xl font-extrabold text-navy">{created.user.full_name}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{created.message}</p>
          {created.user.slug && <p className="mt-4 font-mono text-sm font-semibold text-teal-text">{profileUrl(created.user.slug).replace(/^https?:\/\//, "")}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/admin/enseignants/${created.user.id}`} icon="manage_accounts">Ouvrir la fiche</ButtonLink>
            <Button variant="outline" icon="person_add" onClick={() => { setCreated(null); setV(empty); setConfirm(false); }}>Créer un autre compte</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeading
        crumbs={[{ label: "Création directe" }]}
        title="Créer un compte enseignant"
        lead="Le compte est approuvé d’office, sans passer par la file d’attente. L’enseignant reçoit un email pour définir son mot de passe."
      />

      <form
        className="grid gap-6 xl:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!confirm) {
            setConfirm(true);
            return;
          }
          setSaving(true);
          setError(null);
          try {
            const res = await api<{ message: string; data: AdminUserDetail }>("/admin/users", {
              method: "POST",
              body: { ...v, school: v.school.trim(), department: v.department.trim(), grade_id: Number(v.grade_id) },
            });
            await queryClient.invalidateQueries({ queryKey: ["admin"] });
            setCreated({ message: res.message, user: res.data });
          } catch (err) {
            setError(err instanceof ApiError ? err : new ApiError(0, "Création impossible."));
            setConfirm(false);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="space-y-6 xl:col-span-2">
          {error && <Alert tone="danger">{error.message}</Alert>}
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">1</span> Identité</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" htmlFor="d-first" required error={error?.field("first_name")}><Input id="d-first" value={v.first_name} onChange={set("first_name")} required /></Field>
              <Field label="Nom" htmlFor="d-last" required error={error?.field("last_name")}><Input id="d-last" value={v.last_name} onChange={set("last_name")} required /></Field>
              <Field label="Email" htmlFor="d-email" required error={error?.field("email")} className="sm:col-span-2" hint="L’enseignant recevra à cette adresse le lien pour définir son mot de passe.">
                <Input id="d-email" type="email" icon="mail" value={v.email} onChange={set("email")} required />
              </Field>
              <Field label="Titre professionnel" htmlFor="d-title"><Input id="d-title" value={v.title} onChange={set("title")} /></Field>
              <Field label="Domaine d’expertise" htmlFor="d-exp"><Input id="d-exp" value={v.expertise} onChange={set("expertise")} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">2</span> École supérieure, département / filière et grade</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="École supérieure" htmlFor="d-school" required error={error?.field("school")} hint="Saisie libre (suggestions pendant la saisie).">
                <Input id="d-school" list="d-school-list" icon="account_balance" value={v.school} onChange={set("school")} required maxLength={150} />
              </Field>
              <datalist id="d-school-list">
                {refs.data?.suggestions.schools.map((s) => <option key={s} value={s} />)}
              </datalist>
              <Field label="Département / Filière" htmlFor="d-dept" required error={error?.field("department")}>
                <Input id="d-dept" list="d-dept-list" icon="apartment" value={v.department} onChange={set("department")} required maxLength={150} />
              </Field>
              <datalist id="d-dept-list">
                {refs.data?.suggestions.departments.map((d) => <option key={d} value={d} />)}
              </datalist>
              <Field label="Grade" htmlFor="d-grade" required>
                <Select id="d-grade" value={v.grade_id} onChange={set("grade_id")} required>
                  <option value="">Choisir…</option>
                  {refs.data?.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </Field>
              <Field label="Matricule enseignant" htmlFor="d-matricule" hint="Facultatif, jamais public."><Input id="d-matricule" icon="pin" value={v.matricule} onChange={set("matricule")} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">3</span> Motif (journal d’audit)</h2>
            <Field label="Pourquoi créer ce compte directement ?" htmlFor="d-reason" className="mt-5" hint="Ex. « Nouvel enseignant recruté, arrêté n° … ». Facultatif.">
              <Textarea id="d-reason" rows={3} value={v.reason} onChange={set("reason")} maxLength={1000} />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 xl:sticky xl:top-8">
            <h2 className="font-bold text-navy">Récapitulatif</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["check_circle", "Compte approuvé d’office"],
                ["link", "Adresse /in/prénom-nom créée"],
                ["mail", "Email pour définir le mot de passe"],
                ["history", "Action inscrite au journal d’audit"],
                ["lock", "Ensuite, seul l’enseignant modifie son profil"],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2 text-ink"><Icon name={icon} size={18} className="text-teal-text" /> {text}</li>
              ))}
            </ul>
            {confirm ? (
              <div className="mt-6 space-y-3 rounded-xl border border-teal/40 bg-teal-soft p-4">
                <p className="text-sm font-semibold text-navy">Créer le compte de {v.first_name} {v.last_name} ({v.email}) ?</p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Modifier</Button>
                  <Button type="submit" variant="primary" size="sm" icon="check" loading={saving}>Confirmer la création</Button>
                </div>
              </div>
            ) : (
              <Button type="submit" variant="accent" icon="how_to_reg" full className="mt-6">Créer et approuver le compte</Button>
            )}
            <p className="mt-4 text-xs text-muted">
              Pour un enseignant qui s’est déjà inscrit, utilisez plutôt les <Link href="/admin/demandes" className="font-semibold text-teal-text underline">inscriptions en attente</Link>.
            </p>
          </Card>
        </div>
      </form>
    </div>
  );
}
