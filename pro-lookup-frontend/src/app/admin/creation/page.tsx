"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FileDrop } from "@/components/auth/RegisterForm";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, Card } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { SchoolSelect } from "@/components/ui/SchoolSelect";
import { api, ApiError } from "@/lib/api/client";
import { fileSize } from "@/lib/format";
import { profileUrl, PUBLIC_API_URL } from "@/lib/config";
import type { AdminUserDetail, Ref, School, Suggestions } from "@/lib/types";

const empty = {
  first_name: "", last_name: "", email: "",
  password: "", password_confirmation: "",
  grade_id: "", school: "", department: "", title: "", expertise: "", matricule: "", reason: "",
};

type Publication = { title: string; author: string; year: string; resume: string; link: string };
const emptyPublication: Publication = { title: "", author: "", year: "", resume: "", link: "" };

/**
 * Création directe d'un compte enseignant, pleine page (brief §5.2, §8) :
 * compte approuvé d'office. L'admin peut fixer un mot de passe, déposer une photo et un CV,
 * et ajouter d'emblée des publications scientifiques (DECISIONS.md, point 11 ter révisé).
 * Sans mot de passe saisi, l'enseignant reçoit un email pour en définir un lui-même.
 */
export default function DirectCreationPage() {
  const queryClient = useQueryClient();
  const [v, setV] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [created, setCreated] = useState<{ message: string; user: AdminUserDetail } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const refs = useQuery({
    queryKey: ["creation-refs"],
    queryFn: async () => {
      const [g, s, sc] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()),
        fetch(`${PUBLIC_API_URL}/public/suggestions`).then((r) => r.json()),
        fetch(`${PUBLIC_API_URL}/public/schools`).then((r) => r.json()),
      ]);
      return { grades: g.data as Ref[], suggestions: s.data as Suggestions, schools: sc.data as School[] };
    },
    staleTime: 600_000,
  });
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [key]: e.target.value });

  const reset = () => {
    setCreated(null);
    setV(empty);
    setPhoto(null);
    setCv(null);
    setPublications([]);
    setConfirm(false);
  };

  const updatePublication = (i: number, patch: Partial<Publication>) =>
    setPublications((list) => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

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
            <Button variant="outline" icon="person_add" onClick={reset}>Créer un autre compte</Button>
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
        lead="Le compte est approuvé d’office, sans passer par la file d’attente."
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
            const body = new FormData();
            for (const [key, val] of Object.entries(v)) {
              if (val === "") continue;
              body.append(key, key === "school" || key === "department" ? val.trim() : val);
            }
            if (photo) body.append("photo", photo);
            if (cv) body.append("cv", cv);
            publications.forEach((p, i) => {
              if (!p.title.trim()) return;
              body.append(`publications[${i}][title]`, p.title.trim());
              if (p.author.trim()) body.append(`publications[${i}][author]`, p.author.trim());
              if (p.year.trim()) body.append(`publications[${i}][year]`, p.year.trim());
              if (p.resume.trim()) body.append(`publications[${i}][resume]`, p.resume.trim());
              if (p.link.trim()) body.append(`publications[${i}][link]`, p.link.trim());
            });

            const res = await api<{ message: string; data: AdminUserDetail }>("/admin/users", { method: "POST", body });
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
              <Field label="Email" htmlFor="d-email" required error={error?.field("email")} className="sm:col-span-2" hint="Sert à se connecter, et à recevoir le mot de passe si vous n’en fixez pas un ci-dessous.">
                <Input id="d-email" type="email" icon="mail" value={v.email} onChange={set("email")} required />
              </Field>
              <Field label="Titre professionnel" htmlFor="d-title"><Input id="d-title" value={v.title} onChange={set("title")} /></Field>
              <Field label="Domaine d’expertise" htmlFor="d-exp"><Input id="d-exp" value={v.expertise} onChange={set("expertise")} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">2</span> Mot de passe (facultatif)</h2>
            <p className="mt-1 text-sm text-muted">Laissez vide pour que l’enseignant définisse lui-même son mot de passe via un lien reçu par email.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Mot de passe" htmlFor="d-pass" error={error?.field("password")} hint="8 caractères minimum, avec lettres et chiffres.">
                <Input id="d-pass" type="password" icon="key" value={v.password} onChange={set("password")} minLength={8} />
              </Field>
              <Field label="Confirmer le mot de passe" htmlFor="d-pass2" error={error?.field("password_confirmation")}>
                <Input id="d-pass2" type="password" icon="key" value={v.password_confirmation} onChange={set("password_confirmation")} />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">3</span> École supérieure, département / filière et grade</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="École supérieure" htmlFor="d-school" required error={error?.field("school")} hint="Choisissez dans la liste, ou « Autre » si l’école n’y figure pas.">
                <SchoolSelect id="d-school" schools={refs.data?.schools ?? []} value={v.school} onChange={(val) => setV({ ...v, school: val })} invalid={!!error?.field("school")} />
              </Field>
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
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">4</span> Photo et CV (facultatif)</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Photo de profil" htmlFor="d-photo">
                <FileDrop id="d-photo" accept="image/jpeg,image/png,image/webp" file={photo} icon="photo_camera" label="Déposer la photo" onChange={setPhoto} />
              </Field>
              <Field label="CV (PDF)" htmlFor="d-cv">
                <FileDrop id="d-cv" accept=".pdf" file={cv} icon="picture_as_pdf" label="Déposer le CV" onChange={setCv} />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">5</span> Publications scientifiques (facultatif)</h2>
              <Button type="button" variant="outline" size="sm" icon="add" onClick={() => setPublications((l) => [...l, { ...emptyPublication }])}>
                Ajouter une publication
              </Button>
            </div>
            {publications.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Elles apparaîtront sur le profil public comme n’importe quelle autre publication de l’enseignant.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {publications.map((p, i) => (
                  <li key={i} className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-navy">Publication {i + 1}</p>
                      <Button type="button" variant="ghost" size="sm" icon="delete" className="text-danger" onClick={() => setPublications((l) => l.filter((_, idx) => idx !== i))}>
                        Retirer
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Nom de la publication" htmlFor={`d-pub-title-${i}`} required className="sm:col-span-2" error={error?.field(`publications.${i}.title`)}>
                        <Input id={`d-pub-title-${i}`} value={p.title} onChange={(e) => updatePublication(i, { title: e.target.value })} maxLength={255} />
                      </Field>
                      <Field label="Auteur(s)" htmlFor={`d-pub-author-${i}`}>
                        <Input id={`d-pub-author-${i}`} value={p.author} onChange={(e) => updatePublication(i, { author: e.target.value })} maxLength={255} />
                      </Field>
                      <Field label="Année" htmlFor={`d-pub-year-${i}`}>
                        <Input id={`d-pub-year-${i}`} value={p.year} onChange={(e) => updatePublication(i, { year: e.target.value })} maxLength={60} />
                      </Field>
                      <Field label="Résumé" htmlFor={`d-pub-resume-${i}`} className="sm:col-span-2">
                        <Textarea id={`d-pub-resume-${i}`} rows={2} value={p.resume} onChange={(e) => updatePublication(i, { resume: e.target.value })} maxLength={2000} />
                      </Field>
                      <Field label="Source ou lien" htmlFor={`d-pub-link-${i}`} className="sm:col-span-2">
                        <Input id={`d-pub-link-${i}`} icon="link" value={p.link} onChange={(e) => updatePublication(i, { link: e.target.value })} maxLength={500} />
                      </Field>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-lg bg-navy text-xs text-white">6</span> Motif (journal d’audit)</h2>
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
                ["key", v.password ? "Connexion avec le mot de passe fourni" : "Email pour définir le mot de passe"],
                ...(photo ? [["photo_camera", `Photo : ${photo.name}`]] : []),
                ...(cv ? [["picture_as_pdf", `CV : ${cv.name} (${fileSize(cv.size)})`]] : []),
                ...(publications.length ? [["menu_book", `${publications.length} publication(s) ajoutée(s)`]] : []),
                ["history", "Action inscrite au journal d’audit"],
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
