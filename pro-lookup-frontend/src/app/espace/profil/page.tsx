"use client";

/* eslint-disable @next/next/no-img-element -- images servies par l'API Laravel */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AvatarUploader } from "@/components/space/AvatarUploader";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { GradeBadge, Tag } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { PUBLIC_API_URL } from "@/lib/config";
import { fileSize, formatDate, ITEM_SECTIONS, LINK_LABELS } from "@/lib/format";
import { getToken } from "@/lib/session";
import { hasTeacherProfile } from "@/lib/roles";
import type { ItemSection, Links, Me, ProfileItem, Ref, Suggestions } from "@/lib/types";

/** Suggestions du champ « Langue » (section Langues du profil) : les langues les plus parlées. */
const WORLD_LANGUAGES = [
  "Français", "Anglais", "Allemand", "Espagnol", "Portugais", "Italien", "Chinois (mandarin)", "Arabe", "Hindi", "Russe", "Japonais",
  "Coréen", "Turc", "Néerlandais", "Swahili", "Haoussa", "Peul (fulfulde)", "Ewondo", "Duala", "Bassa", "Bamoun", "Lingala", "Latin", "Grec",
];

type Editing =
  | { kind: "identity" }
  | { kind: "bio" }
  | { kind: "tags" }
  | { kind: "links" }
  | { kind: "contacts" }
  | { kind: "item"; section: ItemSection; item?: ProfileItem };

/** Modification du profil par sections (brief §6.1, tiroirs d'édition §7.7). */
export default function EditProfilePage() {
  const { me } = useAuth();
  const [editing, setEditing] = useState<Editing | null>(null);
  const refs = useQuery({
    queryKey: ["profile-refs"],
    queryFn: async () => {
      const [g, s] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()),
        fetch(`${PUBLIC_API_URL}/public/suggestions`).then((r) => r.json()),
      ]);
      return { grades: g.data as Ref[], suggestions: s.data as Suggestions };
    },
    staleTime: 600_000,
  });

  if (!me) return <Spinner />;
  const close = () => setEditing(null);
  const sections: ItemSection[] = ["course", "education", "experience", "research_area", "scientific_publication", "award", "language"];

  return (
    <div className="space-y-6">
      <SpaceHeading
        eyebrow={me.status === "approved" ? "Profil public" : "Profil en brouillon"}
        title="Modifier mon profil"
        lead={
          me.status === "approved"
            ? "Chaque modification est publiée immédiatement. Choisissez les sections visibles depuis « Mon profil public »."
            : "Votre profil reste invisible tant que votre inscription n’est pas approuvée."
        }
        actions={
          me.status === "approved" && me.slug && hasTeacherProfile(me) ? (
            <>
              <ButtonLink href={`/in/${me.slug}`} variant="outline" icon="visibility">Voir le profil public</ButtonLink>
              <ButtonLink href="/espace/profil-public" variant="ghost" icon="tune">Visibilité</ButtonLink>
            </>
          ) : undefined
        }
      />

      {/* En-tête : bannière, photo, identité */}
      <Card className="overflow-hidden">
        <ImageUploader kind="banner" me={me}>
          <div className="relative h-40 bg-navy">
            {me.banner_url ? <img src={me.banner_url} alt="" className="size-full object-cover" /> : <div className="hero-mesh size-full" />}
          </div>
        </ImageUploader>
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Seul l'avatar chevauche la bannière ; le nom reste sur fond blanc. */}
            <div className="-mt-12 w-fit rounded-full bg-white p-1">
              {/* Cliquer sur l'avatar (ou y déposer une image) pour ajouter ou changer la photo. */}
              <AvatarUploader me={me} size="xl" showActions={false} />
            </div>
            <div className="pb-1 sm:pt-4">
              <h2 className="text-xl font-extrabold text-navy">{me.full_name}</h2>
              <p className="text-sm text-muted">{me.title || "Titre professionnel non renseigné"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                {me.grade && <GradeBadge name={me.grade.name} size="sm" />}
                <span>{[me.department, me.school].filter(Boolean).join(" · ") || "École supérieure et département / filière non renseignés"}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" icon="edit" onClick={() => setEditing({ kind: "identity" })}>Modifier l’en-tête</Button>
        </div>
        <p className="border-t border-line bg-canvas px-6 py-3 text-xs text-muted">
          <Icon name="info" size={14} className="mr-1 align-[-2px]" />
          L’en-tête (photo, nom, grade, titre, école supérieure, département / filière) est public dès que votre profil l’est. Vous seul pouvez
          le modifier.
        </p>
      </Card>

      {/* CV en PDF */}
      <CvBlock me={me} />

      {/* À propos */}
      <SectionBlock title="À propos" icon="description" onEdit={() => setEditing({ kind: "bio" })} editLabel={me.bio ? "Modifier" : "Ajouter"}>
        {me.bio ? <p className="whitespace-pre-line text-sm leading-relaxed text-ink/85">{me.bio}</p> : <Empty>Présentez votre parcours et vos centres d’intérêt.</Empty>}
      </SectionBlock>

      {/* Expertise */}
      <SectionBlock title="Domaines d’expertise et spécialités" icon="psychology" onEdit={() => setEditing({ kind: "tags" })} editLabel="Modifier">
        <p className="text-sm"><span className="text-muted">Domaine principal :</span> <strong className="text-navy">{me.expertise || "—"}</strong></p>
        {me.expertise_tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">{me.expertise_tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        ) : (
          <Empty>Ajoutez vos spécialités (ex. « Énergie solaire », « Statistique »).</Empty>
        )}
      </SectionBlock>

      {/* Sections répétables */}
      {sections.map((section) => (
        <SectionBlock
          key={section}
          title={ITEM_SECTIONS[section].label}
          icon={ITEM_SECTIONS[section].icon}
          onEdit={() => setEditing({ kind: "item", section })}
          editLabel={ITEM_SECTIONS[section].add}
          editIcon="add"
        >
          {me.items[section].length > 0 ? (
            <ul className="divide-y divide-line">
              {me.items[section].map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{item.title}</p>
                    <p className="text-sm text-muted">{[item.author, item.organization, item.period].filter(Boolean).join(" · ")}</p>
                    {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{item.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing({ kind: "item", section, item })}>Modifier</Button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun élément pour l’instant.</Empty>
          )}
        </SectionBlock>
      ))}

      {/* Liens */}
      <SectionBlock title="Liens" icon="public" onEdit={() => setEditing({ kind: "links" })} editLabel="Modifier">
        {Object.values(me.links).some(Boolean) ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.entries(me.links) as [keyof Links, string | null][]).filter(([, v]) => v).map(([k, v]) => (
              <li key={k} className="truncate rounded-lg bg-canvas px-3 py-2 text-sm"><strong className="text-navy">{LINK_LABELS[k].label} :</strong> {v}</li>
            ))}
          </ul>
        ) : (
          <Empty>ORCID, Google Scholar, ResearchGate, LinkedIn, site personnel.</Empty>
        )}
      </SectionBlock>

      {/* Coordonnées */}
      <SectionBlock title="Coordonnées" icon="contact_mail" onEdit={() => setEditing({ kind: "contacts" })} editLabel="Modifier">
        <ul className="space-y-1.5 text-sm">
          <li><span className="text-muted">Email professionnel :</span> <strong className="text-navy">{me.email}</strong></li>
          <li><span className="text-muted">Téléphone :</span> <strong className="text-navy">{me.phone || "—"}</strong></li>
          <li><span className="text-muted">Bureau :</span> <strong className="text-navy">{me.office || "—"}</strong></li>
        </ul>
        <p className="mt-3 text-xs text-muted">Les coordonnées sont privées par défaut ; rendez-les publiques une par une depuis « Mon profil public ».</p>
      </SectionBlock>

      {editing?.kind === "identity" && (
        <IdentityDrawer me={me} grades={refs.data?.grades ?? []} suggestions={refs.data?.suggestions ?? { schools: [], departments: [] }} onClose={close} />
      )}
      {editing?.kind === "bio" && <BioDrawer me={me} onClose={close} />}
      {editing?.kind === "tags" && <TagsDrawer me={me} onClose={close} />}
      {editing?.kind === "links" && <LinksDrawer me={me} onClose={close} />}
      {editing?.kind === "contacts" && <ContactsDrawer me={me} onClose={close} />}
      {editing?.kind === "item" && <ItemDrawer section={editing.section} item={editing.item} onClose={close} />}
    </div>
  );
}

// ------------------------------------------------------------------ Blocs d'affichage

function SectionBlock({ title, icon, onEdit, editLabel, editIcon = "edit", children }: { title: string; icon: string; onEdit: () => void; editLabel: string; editIcon?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <Icon name={icon} size={20} className="text-teal-text" />
          {title}
        </h2>
        <Button variant="subtle" size="sm" icon={editIcon} onClick={onEdit}>{editLabel}</Button>
      </div>
      {children}
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">{children}</p>;
}

// ------------------------------------------------------------------ CV (PDF)

/**
 * Dépôt du CV : PDF, 10 Mo maximum. Une fois le profil public, les visiteurs le téléchargent
 * depuis le bouton « Télécharger le CV » (masquable depuis « Mon profil public »).
 */
function CvBlock({ me }: { me: Me }) {
  const { setMe } = useAuth();
  const [busy, setBusy] = useState<"upload" | "delete" | "open" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cv = me.cv;
  const hidden = me.visibility.sections.cv === false;

  const upload = async (file: File) => {
    setError(null);
    setNotice(null);
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return setError("Le CV doit être un fichier PDF.");
    if (file.size > 10 * 1024 * 1024) return setError("Le CV ne doit pas dépasser 10 Mo.");
    setBusy("upload");
    const body = new FormData();
    body.append("cv", file);
    try {
      const res = await api<{ data: Me; message: string }>("/me/cv", { method: "POST", body });
      setMe(res.data);
      setNotice(res.message);
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("cv") ?? e.message) : "Envoi impossible.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    setError(null);
    try {
      const res = await api<{ data: Me; message: string }>("/me/cv", { method: "DELETE" });
      setMe(res.data);
      setNotice(res.message);
      setConfirmDelete(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };

  // Le fichier est privé tant que le profil ne l'est pas : il est lu avec le jeton de session.
  const open = async () => {
    setBusy("open");
    setError(null);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/me/cv`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Impossible d’ouvrir le CV.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <Icon name="description" size={20} className="text-teal-text" />
          Curriculum vitae (PDF)
        </h2>
        <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-mist px-3 text-sm font-semibold text-navy hover:bg-line ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy === "upload" ? <span className="size-4 animate-spin rounded-full border-2 border-navy border-t-transparent" /> : <Icon name="upload_file" size={18} />}
          {cv ? "Remplacer le CV" : "Déposer mon CV"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
        </label>
      </div>

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {notice && !error && <Alert tone="success" className="mb-4">{notice}</Alert>}

      {cv ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas p-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <Icon name="picture_as_pdf" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{cv.name ?? "CV.pdf"}</p>
            <p className="text-xs text-muted">{[fileSize(cv.size), cv.updated_at ? `déposé le ${formatDate(cv.updated_at)}` : null].filter(Boolean).join(" · ")}</p>
          </div>
          {confirmDelete ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              Retirer le CV ?
              <Button variant="danger" size="sm" loading={busy === "delete"} onClick={remove}>Oui, retirer</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Non</Button>
            </span>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon="visibility" loading={busy === "open"} onClick={open}>Voir</Button>
              <Button variant="ghost" size="sm" icon="delete" className="text-danger" onClick={() => setConfirmDelete(true)}>Retirer</Button>
            </div>
          )}
        </div>
      ) : (
        <Empty>Déposez votre CV au format PDF (10 Mo maximum) : les visiteurs de votre profil pourront le télécharger.</Empty>
      )}

      <p className="mt-3 text-xs text-muted">
        {hidden
          ? "Le téléchargement du CV est actuellement masqué sur votre profil public (réglable dans « Mon profil public »)."
          : me.status === "approved"
            ? "Visible sur votre profil public : bouton « Télécharger le CV ». Vous pouvez le masquer depuis « Mon profil public »."
            : "Il sera téléchargeable sur votre profil dès son approbation."}
      </p>
    </Card>
  );
}

// ------------------------------------------------------------------ Photo et bannière

function ImageUploader({ kind, me, children }: { kind: "avatar" | "banner"; me: Me; children: React.ReactNode }) {
  const { setMe } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const has = kind === "avatar" ? me.avatar_url : me.banner_url;

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("image", file);
    try {
      setMe((await api<{ data: Me }>(`/me/images/${kind}`, { method: "POST", body })).data);
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("image") ?? e.message) : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      setMe((await api<{ data: Me }>(`/me/images/${kind}`, { method: "DELETE" })).data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={kind === "avatar" ? "relative w-fit" : "relative"}>
      {children}
      <div className={kind === "avatar" ? "absolute -bottom-1 -right-1 flex gap-1" : "absolute right-3 top-3 flex gap-2"}>
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-navy shadow-raised hover:bg-mist">
          {busy ? <span className="size-4 animate-spin rounded-full border-2 border-navy border-t-transparent" /> : <Icon name="photo_camera" size={18} />}
          <span className={kind === "avatar" ? "sr-only" : ""}>{kind === "avatar" ? "Changer la photo" : has ? "Changer la bannière" : "Ajouter une bannière"}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {has && kind === "banner" && (
          <button type="button" onClick={remove} className="inline-flex h-9 items-center rounded-lg bg-white px-2.5 text-xs font-semibold text-danger shadow-raised hover:bg-danger-soft">
            Retirer
          </button>
        )}
      </div>
      {error && <p className="absolute left-0 top-full mt-1 rounded bg-danger px-2 py-1 text-xs text-white">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ Tiroirs d'édition

function useSaveProfile(onClose: () => void) {
  const { setMe } = useAuth();
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      setMe((await api<{ data: Me }>("/me/profile", { method: "PUT", body })).data);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  return { save, error, saving };
}

function DrawerFooter({ onClose, saving, form }: { onClose: () => void; saving: boolean; form: string }) {
  return (
    <>
      <Button variant="ghost" onClick={onClose}>Annuler</Button>
      <Button type="submit" form={form} variant="primary" icon="save" loading={saving}>Enregistrer</Button>
    </>
  );
}

function IdentityDrawer({ me, grades, suggestions, onClose }: { me: Me; grades: Ref[]; suggestions: Suggestions; onClose: () => void }) {
  const { save, error, saving } = useSaveProfile(onClose);
  const [v, setV] = useState({
    first_name: me.first_name,
    last_name: me.last_name,
    title: me.title ?? "",
    school: me.school ?? "",
    department: me.department ?? "",
    grade_id: me.grade ? String(me.grade.id) : "",
  });

  return (
    <Drawer title="En-tête du profil" subtitle="Visible publiquement dès que votre profil l’est." onClose={onClose} footer={<DrawerFooter onClose={onClose} saving={saving} form="f-identity" />}>
      <form
        id="f-identity"
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save({
            first_name: v.first_name,
            last_name: v.last_name,
            title: v.title,
            school: v.school.trim(),
            department: v.department.trim(),
            ...(v.grade_id ? { grade_id: Number(v.grade_id) } : {}),
          });
        }}
      >
        {error && <Alert tone="danger">{error.message}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="i-first" required error={error?.field("first_name")}>
            <Input id="i-first" value={v.first_name} onChange={(e) => setV({ ...v, first_name: e.target.value })} required />
          </Field>
          <Field label="Nom" htmlFor="i-last" required error={error?.field("last_name")}>
            <Input id="i-last" value={v.last_name} onChange={(e) => setV({ ...v, last_name: e.target.value })} required />
          </Field>
        </div>
        <Field label="Titre professionnel" htmlFor="i-title" hint="Ex. « Maître de conférences en informatique ».">
          <Input id="i-title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} maxLength={150} />
        </Field>
        <Field label="École supérieure" htmlFor="i-school" required error={error?.field("school")} hint="Le nom de l’école où vous enseignez (suggestions pendant la saisie).">
          <Input id="i-school" list="i-school-list" icon="account_balance" value={v.school} onChange={(e) => setV({ ...v, school: e.target.value })} required maxLength={150} />
        </Field>
        <datalist id="i-school-list">
          {suggestions.schools.map((s) => <option key={s} value={s} />)}
        </datalist>
        <Field label="Département / Filière" htmlFor="i-dept" required error={error?.field("department")}>
          <Input id="i-dept" list="i-dept-list" icon="apartment" value={v.department} onChange={(e) => setV({ ...v, department: e.target.value })} required maxLength={150} />
        </Field>
        <datalist id="i-dept-list">
          {suggestions.departments.map((d) => <option key={d} value={d} />)}
        </datalist>
        <Field label="Grade" htmlFor="i-grade" error={error?.field("grade_id")}>
          <Select id="i-grade" value={v.grade_id} onChange={(e) => setV({ ...v, grade_id: e.target.value })}>
            <option value="">Choisir…</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
      </form>
    </Drawer>
  );
}

function BioDrawer({ me, onClose }: { me: Me; onClose: () => void }) {
  const { save, error, saving } = useSaveProfile(onClose);
  const [bio, setBio] = useState(me.bio ?? "");
  return (
    <Drawer title="À propos" subtitle="Votre biographie, telle qu’elle apparaîtra sur votre profil." onClose={onClose} footer={<DrawerFooter onClose={onClose} saving={saving} form="f-bio" />}>
      <form id="f-bio" onSubmit={(e) => { e.preventDefault(); save({ bio }); }}>
        {error && <Alert tone="danger" className="mb-4">{error.message}</Alert>}
        <Field label="Biographie" htmlFor="b-bio" aside={`${bio.length} / 2000`}>
          <Textarea id="b-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} rows={12} />
        </Field>
      </form>
    </Drawer>
  );
}

function TagsDrawer({ me, onClose }: { me: Me; onClose: () => void }) {
  const { save, error, saving } = useSaveProfile(onClose);
  const [expertise, setExpertise] = useState(me.expertise ?? "");
  const [tags, setTags] = useState<string[]>(me.expertise_tags);
  const [input, setInput] = useState("");
  const add = () => {
    const value = input.trim();
    if (value && !tags.includes(value) && tags.length < 20) setTags([...tags, value]);
    setInput("");
  };

  return (
    <Drawer title="Expertise et spécialités" onClose={onClose} footer={<DrawerFooter onClose={onClose} saving={saving} form="f-tags" />}>
      <form id="f-tags" className="space-y-5" onSubmit={(e) => { e.preventDefault(); save({ expertise, expertise_tags: tags }); }}>
        {error && <Alert tone="danger">{error.message}</Alert>}
        <Field label="Domaine d’expertise principal" htmlFor="t-exp" hint="Affiché sur votre carte dans l’annuaire.">
          <Input id="t-exp" value={expertise} onChange={(e) => setExpertise(e.target.value)} maxLength={150} />
        </Field>
        <Field label="Spécialités" htmlFor="t-tag" hint="Appuyez sur Entrée pour ajouter. 20 maximum.">
          <div className="flex gap-2">
            <Input id="t-tag" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} maxLength={60} />
            <Button variant="outline" icon="add" onClick={add}>Ajouter</Button>
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-mist py-1 pl-3 pr-1 text-sm font-medium text-navy">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-line" aria-label={`Retirer ${tag}`}>
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      </form>
    </Drawer>
  );
}

function LinksDrawer({ me, onClose }: { me: Me; onClose: () => void }) {
  const { save, error, saving } = useSaveProfile(onClose);
  const [links, setLinks] = useState<Links>(me.links);
  return (
    <Drawer title="Liens" subtitle="Adresses complètes (https://…), sauf ORCID : identifiant seul accepté." onClose={onClose} footer={<DrawerFooter onClose={onClose} saving={saving} form="f-links" />}>
      <form
        id="f-links"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save({ links: Object.fromEntries(Object.entries(links).map(([k, v]) => [k, v?.trim() || null])) });
        }}
      >
        {error && <Alert tone="danger">{error.message}</Alert>}
        {(Object.keys(LINK_LABELS) as (keyof Links)[]).map((key) => (
          <Field key={key} label={LINK_LABELS[key].label} htmlFor={`l-${key}`} error={error?.field(`links.${key}`)}>
            <Input
              id={`l-${key}`}
              icon={LINK_LABELS[key].icon}
              value={links[key] ?? ""}
              onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
              placeholder={key === "orcid" ? "0000-0000-0000-0000" : "https://"}
            />
          </Field>
        ))}
      </form>
    </Drawer>
  );
}

function ContactsDrawer({ me, onClose }: { me: Me; onClose: () => void }) {
  const { save, error, saving } = useSaveProfile(onClose);
  const [v, setV] = useState({ phone: me.phone ?? "", office: me.office ?? "" });
  return (
    <Drawer title="Coordonnées" subtitle="Privées par défaut. Rendez-les publiques depuis « Mon profil public »." onClose={onClose} footer={<DrawerFooter onClose={onClose} saving={saving} form="f-contacts" />}>
      <form id="f-contacts" className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(v); }}>
        {error && <Alert tone="danger">{error.message}</Alert>}
        <Field label="Email professionnel" htmlFor="c-email" hint="C’est aussi votre identifiant de connexion.">
          <Input id="c-email" value={me.email} disabled icon="mail" />
        </Field>
        <Field label="Téléphone" htmlFor="c-phone">
          <Input id="c-phone" type="tel" icon="call" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} maxLength={40} />
        </Field>
        <Field label="Bureau" htmlFor="c-office" hint="Ex. « Bâtiment B, bureau 204 ».">
          <Input id="c-office" icon="meeting_room" value={v.office} onChange={(e) => setV({ ...v, office: e.target.value })} maxLength={150} />
        </Field>
      </form>
    </Drawer>
  );
}

function ItemDrawer({ section, item, onClose }: { section: ItemSection; item?: ProfileItem; onClose: () => void }) {
  const { setMe } = useAuth();
  const meta = ITEM_SECTIONS[section];
  const [v, setV] = useState({
    title: item?.title ?? "",
    author: item?.author ?? "",
    organization: item?.organization ?? "",
    period: item?.period ?? "",
    description: item?.description ?? "",
    url: item?.url ?? "",
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (fn: () => Promise<{ data: Me }>) => {
    setSaving(true);
    setError(null);
    try {
      setMe((await fn()).data);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  const withUrl = section === "scientific_publication" || section === "research_area";

  return (
    <Drawer
      title={item ? `Modifier — ${meta.label}` : meta.add}
      onClose={onClose}
      footer={
        <>
          {item ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Supprimer ?
                <Button variant="danger" size="sm" loading={saving} onClick={() => run(() => api(`/me/profile-items/${item.id}`, { method: "DELETE" }))}>Oui, supprimer</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Non</Button>
              </span>
            ) : (
              <Button variant="ghost" icon="delete" className="text-danger" onClick={() => setConfirmDelete(true)}>Supprimer</Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" form="f-item" variant="primary" icon="save" loading={saving}>Enregistrer</Button>
          </div>
        </>
      }
    >
      <form
        id="f-item"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const body = { ...v, section };
          run(() => (item ? api(`/me/profile-items/${item.id}`, { method: "PUT", body }) : api("/me/profile-items", { method: "POST", body })));
        }}
      >
        {error && <Alert tone="danger">{error.message}</Alert>}
        <Field label={section === "language" ? "Langue" : "Intitulé"} htmlFor="it-title" required error={error?.field("title")}>
          <Input
            id="it-title"
            list={section === "language" ? "it-language-list" : undefined}
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
            required
            maxLength={255}
          />
        </Field>
        {section === "language" && (
          <datalist id="it-language-list">
            {WORLD_LANGUAGES.map((l) => <option key={l} value={l} />)}
          </datalist>
        )}
        {section === "scientific_publication" && (
          <Field label="Auteur(s)" htmlFor="it-author" hint="Ex. « Tchoumi A., Ndongo D. » — laissez vide si vous en êtes le seul auteur.">
            <Input id="it-author" value={v.author} onChange={(e) => setV({ ...v, author: e.target.value })} maxLength={255} />
          </Field>
        )}
        <Field label={meta.orgLabel} htmlFor="it-org">
          <Input id="it-org" value={v.organization} onChange={(e) => setV({ ...v, organization: e.target.value })} maxLength={255} />
        </Field>
        {meta.periodLabel && (
          <Field label={meta.periodLabel} htmlFor="it-period" hint="Ex. « 2019 » ou « 2015 — 2021 » ou « 2020 — aujourd’hui ».">
            <Input id="it-period" value={v.period} onChange={(e) => setV({ ...v, period: e.target.value })} maxLength={60} />
          </Field>
        )}
        {section !== "language" && (
          <Field label="Description" htmlFor="it-desc">
            <Textarea id="it-desc" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={2000} rows={4} />
          </Field>
        )}
        {withUrl && (
          <Field label="Lien ou DOI" htmlFor="it-url" hint="Ex. https://doi.org/10.xxxx/… ou 10.xxxx/…">
            <Input id="it-url" icon="link" value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} maxLength={500} />
          </Field>
        )}
      </form>
    </Drawer>
  );
}
