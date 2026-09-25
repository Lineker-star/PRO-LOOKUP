"use client";

/* eslint-disable @next/next/no-img-element -- aperçu local de la photo choisie */
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { GradeBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { fileSize, initials } from "@/lib/format";
import type { FacultyWithDepartments, Me, Ref } from "@/lib/types";

const MAX_DOC = 5 * 1024 * 1024;
const MAX_PHOTO = 4 * 1024 * 1024;

/** Mêmes règles que le Form Request Laravel RegisterRequest. */
const schema = z
  .object({
    first_name: z.string().trim().min(1, "Le prénom est obligatoire.").max(100),
    last_name: z.string().trim().min(1, "Le nom est obligatoire.").max(100),
    email: z.string().trim().min(1, "L’email est obligatoire.").email("Adresse email invalide."),
    password: z
      .string()
      .min(8, "8 caractères minimum.")
      .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
      .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre."),
    password_confirmation: z.string(),
    faculty_id: z.string().min(1, "Choisissez votre faculté."),
    department_id: z.string().min(1, "Choisissez votre département."),
    grade_id: z.string().min(1, "Choisissez votre grade."),
    matricule: z.string().trim().min(1, "Le matricule enseignant est obligatoire.").max(50),
    document: z
      .custom<File | null>((v) => v instanceof File, "Le justificatif est obligatoire.")
      .refine((f) => !f || f.size <= MAX_DOC, "Le justificatif ne doit pas dépasser 5 Mo.")
      .refine((f) => !f || /\.(pdf|jpe?g|png)$/i.test(f.name), "Format accepté : PDF, JPG ou PNG."),
    photo: z
      .custom<File | null>((v) => v === null || v instanceof File)
      .refine((f) => !f || f.size <= MAX_PHOTO, "La photo ne doit pas dépasser 4 Mo."),
    title: z.string().max(150).optional(),
    expertise: z.string().max(150).optional(),
    accept_terms: z.boolean().refine((v) => v, "Vous devez accepter les conditions pour envoyer votre demande."),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Les deux mots de passe ne correspondent pas." });

type Values = z.infer<typeof schema>;

const STEPS: { title: string; icon: string; fields: FieldPath<Values>[] }[] = [
  { title: "Compte", icon: "badge", fields: ["first_name", "last_name", "email", "password", "password_confirmation"] },
  { title: "Rattachement", icon: "account_balance", fields: ["faculty_id", "department_id", "grade_id", "matricule", "document"] },
  { title: "Profil de base", icon: "person", fields: ["photo", "title", "expertise"] },
  { title: "Récapitulatif", icon: "fact_check", fields: ["accept_terms"] },
];

export function RegisterForm({ faculties, grades }: { faculties: FacultyWithDepartments[]; grades: Ref[] }) {
  const { startSession } = useAuth();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirmation: "",
      faculty_id: "",
      department_id: "",
      grade_id: "",
      matricule: "",
      document: null,
      photo: null,
      title: "",
      expertise: "",
      accept_terms: false,
    },
  });
  const { register, watch, setValue, trigger, formState, handleSubmit, setError } = form;
  const values = watch();

  const departments = useMemo(() => faculties.find((f) => String(f.id) === values.faculty_id)?.departments ?? [], [faculties, values.faculty_id]);
  const facultyName = faculties.find((f) => String(f.id) === values.faculty_id)?.name;
  const departmentName = departments.find((d) => String(d.id) === values.department_id)?.name;
  const gradeName = grades.find((g) => String(g.id) === values.grade_id)?.name;

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!values.photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(values.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [values.photo]);

  const next = async () => {
    if (await trigger(STEPS[step].fields, { shouldFocus: true })) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: Values) => {
    setServerError(null);
    const body = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined || value === "") continue;
      if (key === "accept_terms") body.append(key, value ? "1" : "0");
      else body.append(key, value as string | Blob);
    }

    try {
      const res = await api<{ token: string; user: Me }>("/auth/register", { method: "POST", body });
      startSession(res.token, res.user);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        // Renvoie l'utilisateur à l'étape du premier champ en erreur.
        const fields = Object.keys(e.errors) as FieldPath<Values>[];
        fields.forEach((f) => setError(f, { message: e.errors[f]?.[0] }));
        const stepWithError = STEPS.findIndex((s) => s.fields.some((f) => fields.includes(f)));
        if (stepWithError >= 0) setStep(stepWithError);
      } else {
        setServerError("Envoi impossible. Réessayez.");
      }
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-line bg-white text-center shadow-raised">
          <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" aria-hidden />
          <div className="p-8 sm:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
              <Icon name="task_alt" size={36} />
            </span>
            <h1 className="mt-6 text-2xl font-extrabold text-navy">Demande envoyée</h1>
            <p className="mt-2 text-base font-semibold text-warning">En attente de validation par l’administration</p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
              Un email de confirmation vient de vous être envoyé à <strong className="text-ink">{values.email}</strong>. Votre profil ne sera visible
              publiquement qu’après son approbation. En attendant, vous pouvez compléter votre profil en brouillon.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/espace/en-attente" icon="hourglass_top">Suivre ma demande</ButtonLink>
              <ButtonLink href="/espace/profil" variant="outline" icon="edit">Compléter mon profil</ButtonLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const err = (name: FieldPath<Values>) => (formState.errors[name]?.message as string | undefined) ?? undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gold-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-navy">
            <Icon name="how_to_reg" size={14} /> Réservé au personnel enseignant
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Demander un accès à PRO-LOOKUP</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Seuls les enseignants de l’Université ZTF peuvent créer un compte. Votre demande sera vérifiée par l’administration avant la publication
            de votre profil.
          </p>
        </div>
        <p className="text-sm text-muted">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-semibold text-teal-text hover:underline">Se connecter</Link>
        </p>
      </div>

      {/* Stepper */}
      <ol className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3 shadow-card sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            aria-current={i === step ? "step" : undefined}
            className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5", i === step ? "bg-navy text-white" : i < step ? "bg-success-soft" : "")}
          >
            <span
              className={clsx(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                i === step ? "bg-teal text-navy" : i < step ? "bg-success text-white" : "bg-mist text-muted",
              )}
            >
              {i < step ? <Icon name="check" size={18} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={clsx("block text-[10px] font-bold uppercase tracking-wider", i === step ? "text-white/70" : "text-muted")}>
                Étape {i + 1}
              </span>
              <span className={clsx("block truncate text-sm font-semibold", i === step ? "text-white" : "text-navy")}>{s.title}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8 lg:col-span-8">
          {serverError && <Alert tone="danger" className="mb-6">{serverError}</Alert>}

          {step === 0 && (
            <fieldset className="space-y-5">
              <legend className="text-lg font-bold text-navy">Votre compte</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prénom" htmlFor="r-first" required error={err("first_name")}>
                  <Input id="r-first" autoComplete="given-name" invalid={!!err("first_name")} {...register("first_name")} />
                </Field>
                <Field label="Nom" htmlFor="r-last" required error={err("last_name")}>
                  <Input id="r-last" autoComplete="family-name" invalid={!!err("last_name")} {...register("last_name")} />
                </Field>
              </div>
              <Field label="Email" htmlFor="r-email" required error={err("email")} hint="Votre adresse professionnelle de préférence : elle sert à vous connecter.">
                <Input id="r-email" type="email" autoComplete="email" icon="mail" invalid={!!err("email")} {...register("email")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Mot de passe" htmlFor="r-pass" required error={err("password")} hint="8 caractères minimum, avec lettres et chiffres.">
                  <Input id="r-pass" type="password" autoComplete="new-password" icon="key" invalid={!!err("password")} {...register("password")} />
                </Field>
                <Field label="Confirmer le mot de passe" htmlFor="r-pass2" required error={err("password_confirmation")}>
                  <Input id="r-pass2" type="password" autoComplete="new-password" icon="key" invalid={!!err("password_confirmation")} {...register("password_confirmation")} />
                </Field>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className="space-y-5">
              <legend className="text-lg font-bold text-navy">Votre rattachement à l’université</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Faculté" htmlFor="r-faculty" required error={err("faculty_id")}>
                  <Select
                    id="r-faculty"
                    invalid={!!err("faculty_id")}
                    {...register("faculty_id", { onChange: () => setValue("department_id", "") })}
                  >
                    <option value="">Choisir…</option>
                    {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Field>
                <Field label="Département" htmlFor="r-department" required error={err("department_id")}>
                  <Select id="r-department" invalid={!!err("department_id")} disabled={!values.faculty_id} {...register("department_id")}>
                    <option value="">{values.faculty_id ? "Choisir…" : "Choisissez d’abord une faculté"}</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                <Field label="Grade" htmlFor="r-grade" required error={err("grade_id")}>
                  <Select id="r-grade" invalid={!!err("grade_id")} {...register("grade_id")}>
                    <option value="">Choisir…</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </Field>
                <Field label="Matricule enseignant" htmlFor="r-matricule" required error={err("matricule")} hint="Il n’apparaîtra jamais publiquement.">
                  <Input id="r-matricule" icon="pin" invalid={!!err("matricule")} {...register("matricule")} />
                </Field>
              </div>
              <Field
                label="Justificatif"
                htmlFor="r-document"
                required
                error={err("document")}
                hint="Attestation de service, arrêté de nomination ou contrat — PDF ou image, 5 Mo maximum. Consulté uniquement par l’administration."
              >
                <FileDrop
                  id="r-document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={values.document}
                  icon="upload_file"
                  label="Déposer le justificatif"
                  onChange={(file) => setValue("document", file, { shouldValidate: true })}
                />
              </Field>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="space-y-5">
              <legend className="text-lg font-bold text-navy">Votre profil de base</legend>
              <div className="flex flex-col gap-5 rounded-xl border border-line bg-canvas p-5 sm:flex-row sm:items-center">
                <div className="relative">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Aperçu de votre photo" className="size-28 rounded-full object-cover ring-4 ring-gold ring-offset-2" />
                  ) : (
                    <span className="flex size-28 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white ring-4 ring-gold ring-offset-2">
                      {initials(`${values.first_name} ${values.last_name}`) || <Icon name="person" size={40} />}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-navy">Photo de profil</p>
                  <p className="text-xs text-muted">JPG ou PNG, 4 Mo maximum. Visage et épaules bien cadrés, fond neutre.</p>
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:border-navy">
                    <Icon name="photo_camera" size={18} />
                    {values.photo ? "Changer la photo" : "Choisir une photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => setValue("photo", e.target.files?.[0] ?? null, { shouldValidate: true })}
                    />
                  </label>
                  {err("photo") && <p className="text-xs font-medium text-danger">{err("photo")}</p>}
                </div>
              </div>
              <Field label="Titre professionnel" htmlFor="r-title" hint="Ex. « Maître de conférences en génie civil ».">
                <Input id="r-title" {...register("title")} />
              </Field>
              <Field label="Domaine d’expertise principal" htmlFor="r-expertise" hint="Ex. « Intelligence artificielle », « Biotechnologies végétales ».">
                <Input id="r-expertise" icon="psychology" {...register("expertise")} />
              </Field>
            </fieldset>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-navy">Vérifiez votre demande</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Summary label="Nom" value={`${values.first_name} ${values.last_name}`} onEdit={() => setStep(0)} />
                <Summary label="Email" value={values.email} onEdit={() => setStep(0)} />
                <Summary label="Faculté" value={facultyName} onEdit={() => setStep(1)} />
                <Summary label="Département" value={departmentName} onEdit={() => setStep(1)} />
                <Summary label="Grade" value={gradeName} onEdit={() => setStep(1)} />
                <Summary label="Matricule" value={values.matricule} onEdit={() => setStep(1)} />
                <Summary label="Justificatif" value={values.document ? `${values.document.name} (${fileSize(values.document.size)})` : undefined} onEdit={() => setStep(1)} />
                <Summary label="Titre professionnel" value={values.title || "—"} onEdit={() => setStep(2)} />
              </dl>
              <Alert tone="info" title="Ce qui se passe ensuite">
                Votre compte est créé « en attente ». L’administration vérifie votre demande ; vous recevez un email dès qu’elle est traitée. Rien de
                votre profil n’est public avant l’approbation.
              </Alert>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 text-sm">
                <input type="checkbox" className="mt-0.5 size-4 accent-navy" {...register("accept_terms")} />
                <span>
                  J’accepte les{" "}
                  <Link href="/conditions" target="_blank" className="font-semibold text-teal-text underline">conditions d’utilisation</Link> et la{" "}
                  <Link href="/confidentialite" target="_blank" className="font-semibold text-teal-text underline">politique de confidentialité</Link>, et
                  je certifie être enseignant à l’Université ZTF.
                </span>
              </label>
              {err("accept_terms") && <p className="text-xs font-medium text-danger">{err("accept_terms")}</p>}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <Button variant="outline" icon="arrow_back" onClick={() => setStep((s) => s - 1)}>Étape précédente</Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" iconRight="arrow_forward" onClick={next}>Continuer</Button>
            ) : (
              <Button type="submit" variant="accent" icon="send" loading={formState.isSubmitting}>Envoyer ma demande</Button>
            )}
          </div>
        </form>

        {/* Aperçu en direct */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
            <div className="hero-mesh px-5 pb-5 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">Aperçu de votre profil</p>
              <div className="mt-4 flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="size-14 rounded-full object-cover ring-2 ring-gold" />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/10 text-lg font-bold ring-2 ring-gold">
                    {initials(`${values.first_name} ${values.last_name}`) || "?"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold">{`${values.first_name} ${values.last_name}`.trim() || "Votre nom"}</p>
                  <p className="truncate text-xs text-white/70">{values.title || "Titre professionnel"}</p>
                </div>
              </div>
              <div className="mt-4">{gradeName ? <GradeBadge name={gradeName} size="sm" /> : <span className="text-xs text-white/50">Grade</span>}</div>
              <p className="mt-3 text-xs text-white/70">{departmentName ? `Département ${departmentName}` : "Département"} · Université ZTF</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs">
              <span className="text-white/60">Statut</span>
              <span className="inline-flex items-center gap-1 font-semibold text-gold">
                <Icon name="hourglass_top" size={14} /> En attente après envoi
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 text-sm shadow-card">
            <p className="flex items-center gap-2 font-semibold text-navy">
              <Icon name="lock" size={18} className="text-teal-text" /> Vos données
            </p>
            <p className="mt-2 leading-relaxed text-muted">
              Le matricule et le justificatif ne sont jamais publiés. Après approbation, vous choisirez vous-même les sections et coordonnées visibles.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Summary({ label, value, onEdit }: { label: string; value?: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas p-3">
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-semibold text-navy">{value || <span className="text-danger">À compléter</span>}</dd>
      </div>
      <button type="button" onClick={onEdit} className="text-xs font-semibold text-teal-text hover:underline">Modifier</button>
    </div>
  );
}

/** Zone de dépôt de fichier (glisser-déposer ou clic). */
export function FileDrop({
  id,
  accept,
  file,
  onChange,
  icon,
  label,
}: {
  id: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  icon: string;
  label: string;
}) {
  const [over, setOver] = useState(false);

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onChange(e.dataTransfer.files?.[0] ?? null);
      }}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
        over ? "border-teal bg-teal-soft" : "border-line bg-canvas hover:border-teal",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-white text-teal-text shadow-card">
        <Icon name={icon} size={26} />
      </span>
      <span className="mt-3 text-sm font-semibold text-navy">
        {label} <span className="font-normal text-muted">— glissez-le ici ou</span> <span className="text-teal-text underline">parcourez vos fichiers</span>
      </span>
      {file && (
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy ring-1 ring-line">
          <Icon name="description" size={16} /> {file.name} ({fileSize(file.size)})
        </span>
      )}
      <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}
