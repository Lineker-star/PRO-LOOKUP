"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { ReasonAction } from "@/components/admin/AdminUi";
import { FileDrop } from "@/components/auth/RegisterForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { SchoolSelect } from "@/components/ui/SchoolSelect";
import { api, ApiError } from "@/lib/api/client";
import { profileUrl, PUBLIC_API_URL } from "@/lib/config";
import { ACCOUNT_STATUS, formatDateTime } from "@/lib/format";
import type { AdminUserDetail, ProfileItem, Ref, School } from "@/lib/types";

/**
 * Fiche d'un compte (brief §8) : consultation, suspension, réactivation, suppression, historique,
 * nomination ou retrait du rôle d'administrateur. L'administration peut aussi modifier le profil
 * d'un enseignant, sa photo, son CV et ses publications scientifiques (DECISIONS.md, point 11 ter révisé).
 */
export default function TeacherAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { me } = useAuth();
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const detail = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => (await api<{ data: AdminUserDetail }>(`/admin/users/${id}`)).data,
    retry: false,
  });

  const refs = useQuery({
    queryKey: ["creation-refs"],
    queryFn: async () => {
      const [g, sc] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()),
        fetch(`${PUBLIC_API_URL}/public/schools`).then((r) => r.json()),
      ]);
      return { grades: g.data as Ref[], schools: sc.data as School[] };
    },
    staleTime: 600_000,
  });

  if (detail.isPending) return <Spinner />;
  if (!detail.data) return <EmptyState icon="person_off" title="Compte introuvable" action={<ButtonLink href="/admin/enseignants">Retour à la liste</ButtonLink>} />;

  const u = detail.data;
  const isAdmin = u.role === "admin";
  const isSelf = me?.id === u.id;
  const publicProfile = u.status === "approved" && u.slug && (!isAdmin || u.teaches);

  // Une erreur est affichée par ReasonAction, dans l'encart de confirmation.
  const act = async (path: string, body?: Record<string, unknown>) => {
    const res = await api<{ message: string; data?: AdminUserDetail }>(path, { method: "POST", body });
    if (res.data) queryClient.setQueryData(["admin", "user", id], res.data);
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    setMessage({ tone: "success", text: res.message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <AdminHeading
        crumbs={[{ href: "/admin/enseignants", label: "Comptes" }, { label: u.full_name }]}
        title={u.full_name}
        lead={u.email}
        actions={publicProfile ? <ButtonLink href={profileUrl(u.slug!)} variant="outline" icon="visibility" external>Voir le profil public</ButtonLink> : undefined}
      />

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {u.status === "suspended" && (
        <Alert tone="danger" title={`Compte suspendu le ${formatDateTime(u.suspended_at)}`}>Motif : « {u.suspension_reason} ». Le profil et les publications ne sont plus publics.</Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={u.avatar_url} name={u.full_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-navy">{u.full_name}</h2>
                    <StatusBadge tone={ACCOUNT_STATUS[u.status].tone}>{ACCOUNT_STATUS[u.status].label}</StatusBadge>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-white">
                        <Icon name="admin_panel_settings" size={14} /> Administrateur{isSelf ? " (vous)" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{u.title ?? "—"}</p>
                  {u.grade && <GradeBadge name={u.grade.name} size="sm" className="mt-2" />}
                </div>
              </div>
              <Button variant="outline" size="sm" icon="edit" onClick={() => setEditingProfile(true)}>Modifier le profil</Button>
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["École supérieure", u.school ?? "—"],
                ["Département / Filière", u.department ?? "—"],
                ["Matricule", u.matricule ?? "—"],
                ["URL du profil", publicProfile ? `/in/${u.slug}` : isAdmin ? "— (profil enseignant non publié)" : "— (attribuée à l’approbation)"],
                ["Publications", `${u.published_posts_count} publiée(s) / ${u.posts_count}`],
                ["Inscrit le", formatDateTime(u.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-canvas p-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="break-words font-semibold text-navy">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <TeacherPhotoAndCv user={u} onUpdated={(data) => queryClient.setQueryData(["admin", "user", id], data)} />
          <TeacherPublications user={u} onUpdated={(data) => queryClient.setQueryData(["admin", "user", id], data)} />

          <Card>
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 font-bold text-navy"><Icon name="history" size={20} className="text-teal-text" /> Historique</h2>
            {u.history.length > 0 ? (
              <ol className="divide-y divide-line">
                {u.history.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-navy">{log.label}</p>
                      <p className="text-xs text-muted">par {log.admin ?? "—"}{log.reason ? ` · « ${log.reason} »` : ""}</p>
                    </div>
                    <span className="tnum text-xs text-muted">{formatDateTime(log.created_at)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">Aucune action d’administration sur ce compte.</p>
            )}
            {u.slug_history.length > 0 && (
              <div className="border-t border-line px-5 py-4 text-xs text-muted">
                Anciennes adresses (redirigées) : {u.slug_history.map((h) => `/in/${h.slug}`).join(", ")}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="admin_panel_settings" size={20} className="text-teal-text" /> Actions</h2>

            {u.status === "pending" && u.registration && (
              <ButtonLink href={`/admin/demandes/${u.registration.id}`} variant="accent" icon="folder_open" full>Examiner l’inscription</ButtonLink>
            )}

            {/* Rôle d'administrateur */}
            {!isAdmin && u.status === "approved" && (
              <ReasonAction
                label="Nommer administrateur"
                icon="shield_person"
                tone="primary"
                requireReason={false}
                reasonLabel="Note (facultative, journalisée)"
                confirmLabel="Confirmer la nomination"
                description="Ce compte pourra valider les inscriptions, gérer les comptes, les référentiels et la modération. Son profil public d’enseignant reste inchangé et ne mentionnera jamais ce rôle."
                onConfirm={(reason) => act(`/admin/users/${u.id}/promote`, { reason: reason || null })}
              />
            )}
            {isAdmin && !isSelf && (
              u.admins_count > 1 ? (
                <ReasonAction
                  label="Retirer le rôle d’administrateur"
                  icon="remove_moderator"
                  tone="primary"
                  requireReason={false}
                  reasonLabel="Note (facultative, journalisée)"
                  confirmLabel="Retirer le rôle"
                  description="Le compte redevient un compte enseignant, avec un profil public. Ses sessions ouvertes sont fermées."
                  onConfirm={(reason) => act(`/admin/users/${u.id}/demote`, { reason: reason || null })}
                />
              ) : (
                <p className="rounded-lg bg-canvas p-3 text-xs text-muted">C’est le dernier administrateur : son rôle ne peut pas être retiré.</p>
              )
            )}
            {isAdmin && isSelf && (
              <p className="rounded-lg bg-canvas p-3 text-xs text-muted">
                Vous ne pouvez pas retirer vos propres droits. Pour gérer votre profil d’enseignant, rendez-vous dans{" "}
                <a href="/espace/profil" className="font-semibold text-teal-text underline">votre espace</a>.
              </p>
            )}

            {!isAdmin && u.status === "approved" && (
              <ReasonAction
                label="Suspendre le compte"
                icon="block"
                confirmLabel="Confirmer la suspension"
                description="Le profil et toutes les publications sont retirés immédiatement des pages publiques ; l’accès à l’espace enseignant est bloqué."
                onConfirm={(reason) => act(`/admin/users/${u.id}/suspend`, { reason })}
              />
            )}

            {u.status === "suspended" && (
              <ReasonAction
                label="Réactiver le compte"
                icon="lock_open"
                tone="primary"
                requireReason={false}
                reasonLabel=""
                confirmLabel="Confirmer la réactivation"
                description="Le profil et les publications redeviennent visibles."
                onConfirm={() => act(`/admin/users/${u.id}/reactivate`)}
              />
            )}

            {isAdmin ? (
              <p className="rounded-lg bg-canvas p-3 text-xs text-muted">Un administrateur ne peut être ni suspendu ni supprimé : retirez-lui d’abord ce rôle.</p>
            ) : (
              <DeleteAction
                email={u.email}
                onConfirm={async (reason, confirm_email) => {
                  await api(`/admin/users/${u.id}`, { method: "DELETE", body: { reason, confirm_email } });
                  await queryClient.invalidateQueries({ queryKey: ["admin"] });
                  router.push("/admin/enseignants");
                }}
              />
            )}
          </Card>
        </div>
      </div>

      {editingProfile && (
        <EditProfileDrawer
          user={u}
          grades={refs.data?.grades ?? []}
          schools={refs.data?.schools ?? []}
          onClose={() => setEditingProfile(false)}
          onSaved={(data) => {
            queryClient.setQueryData(["admin", "user", id], data);
            setEditingProfile(false);
          }}
        />
      )}
    </div>
  );
}

/** Modification du profil d'un enseignant par l'administration (DECISIONS.md, point 11 ter révisé). */
function EditProfileDrawer({
  user,
  grades,
  schools,
  onClose,
  onSaved,
}: {
  user: AdminUserDetail;
  grades: Ref[];
  schools: School[];
  onClose: () => void;
  onSaved: (data: AdminUserDetail) => void;
}) {
  const [v, setV] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    title: user.title ?? "",
    expertise: user.expertise ?? "",
    grade_id: user.grade ? String(user.grade.id) : "",
    school: user.school ?? "",
    department: user.department ?? "",
    phone: user.phone ?? "",
    office: user.office ?? "",
    bio: user.bio ?? "",
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [key]: e.target.value });

  return (
    <Drawer
      title="Modifier le profil"
      subtitle={user.full_name}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="f-edit-profile" variant="primary" icon="save" loading={saving}>Enregistrer</Button>
        </div>
      }
    >
      <form
        id="f-edit-profile"
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          try {
            const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/profile`, {
              method: "PUT",
              body: { ...v, school: v.school.trim(), department: v.department.trim(), grade_id: Number(v.grade_id) },
            });
            onSaved(res.data);
          } catch (err) {
            setError(err instanceof ApiError ? err : new ApiError(0, "Enregistrement impossible."));
          } finally {
            setSaving(false);
          }
        }}
      >
        {error && <Alert tone="danger">{error.message}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="e-first" required error={error?.field("first_name")}><Input id="e-first" value={v.first_name} onChange={set("first_name")} required /></Field>
          <Field label="Nom" htmlFor="e-last" required error={error?.field("last_name")}><Input id="e-last" value={v.last_name} onChange={set("last_name")} required /></Field>
        </div>
        <Field label="Titre professionnel" htmlFor="e-title"><Input id="e-title" value={v.title} onChange={set("title")} /></Field>
        <Field label="Domaine d’expertise" htmlFor="e-exp"><Input id="e-exp" value={v.expertise} onChange={set("expertise")} /></Field>
        <Field label="École supérieure" htmlFor="e-school" required error={error?.field("school")}>
          <SchoolSelect id="e-school" schools={schools} value={v.school} onChange={(val) => setV({ ...v, school: val })} invalid={!!error?.field("school")} />
        </Field>
        <Field label="Département / Filière" htmlFor="e-dept" required error={error?.field("department")}>
          <Input id="e-dept" value={v.department} onChange={set("department")} required maxLength={150} />
        </Field>
        <Field label="Grade" htmlFor="e-grade" required error={error?.field("grade_id")}>
          <Select id="e-grade" value={v.grade_id} onChange={(e) => setV({ ...v, grade_id: e.target.value })} required>
            <option value="">Choisir…</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="e-phone"><Input id="e-phone" value={v.phone} onChange={set("phone")} /></Field>
          <Field label="Bureau" htmlFor="e-office"><Input id="e-office" value={v.office} onChange={set("office")} /></Field>
        </div>
        <Field label="À propos" htmlFor="e-bio"><Textarea id="e-bio" rows={5} value={v.bio} onChange={set("bio")} maxLength={2000} /></Field>
      </form>
    </Drawer>
  );
}

/** Photo de profil et CV de l'enseignant, déposés par l'administration (DECISIONS.md, point 11 ter révisé). */
function TeacherPhotoAndCv({ user, onUpdated }: { user: AdminUserDetail; onUpdated: (data: AdminUserDetail) => void }) {
  const [busy, setBusy] = useState<"photo" | "cv" | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const uploadPhoto = async (file: File | null) => {
    if (!file) return;
    setBusy("photo");
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/images/avatar`, { method: "POST", body });
      onUpdated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Envoi impossible."));
    } finally {
      setBusy(null);
    }
  };

  const uploadCv = async (file: File | null) => {
    if (!file) return;
    setBusy("cv");
    setError(null);
    try {
      const body = new FormData();
      body.append("cv", file);
      const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/cv`, { method: "POST", body });
      onUpdated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Envoi impossible."));
    } finally {
      setBusy(null);
    }
  };

  const removeCv = async () => {
    setBusy("cv");
    try {
      const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/cv`, { method: "DELETE" });
      onUpdated(res.data);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="photo_camera" size={20} className="text-teal-text" /> Photo et CV</h2>
      {error && <Alert tone="danger" className="mt-3">{error.message}</Alert>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Photo de profil" htmlFor="tp-photo">
          <FileDrop id="tp-photo" accept="image/jpeg,image/png,image/webp" file={null} icon="photo_camera" label={busy === "photo" ? "Envoi…" : "Déposer une photo"} onChange={uploadPhoto} />
        </Field>
        <Field label="CV (PDF)" htmlFor="tp-cv">
          <FileDrop id="tp-cv" accept=".pdf" file={null} icon="picture_as_pdf" label={busy === "cv" ? "Envoi…" : "Déposer le CV"} onChange={uploadCv} />
          {user.cv && (
            <p className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
              <span>Actuel : {user.cv.name}</span>
              <button type="button" onClick={removeCv} className="font-semibold text-danger hover:underline">Retirer</button>
            </p>
          )}
        </Field>
      </div>
    </Card>
  );
}

/** Publications scientifiques ajoutées par l'administration pour le compte de l'enseignant : elles
 * apparaissent sur le profil public comme n'importe quelle autre publication (DECISIONS.md, 11 ter révisé). */
function TeacherPublications({ user, onUpdated }: { user: AdminUserDetail; onUpdated: (data: AdminUserDetail) => void }) {
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState({ title: "", author: "", year: "", resume: "", link: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const items = user.items.scientific_publication;

  const remove = async (item: ProfileItem) => {
    const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/profile-items/${item.id}`, { method: "DELETE" });
    onUpdated(res.data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="menu_book" size={20} className="text-teal-text" /> Publications scientifiques</h2>
        {!adding && <Button variant="outline" size="sm" icon="add" onClick={() => setAdding(true)}>Ajouter</Button>}
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-muted">{[item.author, item.organization, item.period].filter(Boolean).join(" · ")}</p>
                {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink/80">{item.description}</p>}
              </div>
              <button type="button" onClick={() => remove(item)} className="shrink-0 text-xs font-semibold text-danger hover:underline">Retirer</button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className="mt-3 text-sm text-muted">Aucune publication scientifique pour ce compte.</p>
      )}

      {adding && (
        <form
          className="mt-4 space-y-3 rounded-xl border border-line p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            try {
              const res = await api<{ data: AdminUserDetail }>(`/admin/users/${user.id}/profile-items`, {
                method: "POST",
                body: {
                  section: "scientific_publication",
                  title: v.title,
                  author: v.author || null,
                  period: v.year || null,
                  description: v.resume || null,
                  url: v.link || null,
                },
              });
              onUpdated(res.data);
              setV({ title: "", author: "", year: "", resume: "", link: "" });
              setAdding(false);
            } catch (err) {
              setError(err instanceof ApiError ? err : new ApiError(0, "Enregistrement impossible."));
            } finally {
              setSaving(false);
            }
          }}
        >
          {error && <Alert tone="danger">{error.message}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom de la publication" htmlFor="np-title" required className="sm:col-span-2" error={error?.field("title")}>
              <Input id="np-title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} maxLength={255} required />
            </Field>
            <Field label="Auteur(s)" htmlFor="np-author">
              <Input id="np-author" value={v.author} onChange={(e) => setV({ ...v, author: e.target.value })} maxLength={255} />
            </Field>
            <Field label="Année" htmlFor="np-year">
              <Input id="np-year" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Résumé" htmlFor="np-resume" className="sm:col-span-2">
              <Textarea id="np-resume" rows={2} value={v.resume} onChange={(e) => setV({ ...v, resume: e.target.value })} maxLength={2000} />
            </Field>
            <Field label="Source ou lien" htmlFor="np-link" className="sm:col-span-2">
              <Input id="np-link" icon="link" value={v.link} onChange={(e) => setV({ ...v, link: e.target.value })} maxLength={500} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Annuler</Button>
            <Button type="submit" variant="primary" size="sm" icon="save" loading={saving}>Ajouter la publication</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

/** Suppression définitive : l'administrateur doit retaper l'email du compte (confirmation dans la page). */
function DeleteAction({ email, onConfirm }: { email: string; onConfirm: (reason: string, email: string) => Promise<void> }) {
  const [typed, setTyped] = useState("");
  return (
    <ReasonAction
      label="Supprimer définitivement"
      icon="delete_forever"
      confirmLabel="Supprimer le compte"
      reasonLabel="Motif (journalisé)"
      description="Action irréversible : le compte, le profil et les publications sont supprimés."
      extra={(setValid) => (
        <div>
          <label htmlFor="confirm-email" className="mb-1 block text-xs font-semibold text-ink">Pour confirmer, saisissez l’email du compte : <span className="font-mono">{email}</span></label>
          <Input
            id="confirm-email"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setValid(e.target.value.trim().toLowerCase() === email.toLowerCase());
            }}
            className="bg-white"
          />
        </div>
      )}
      onConfirm={(reason) => onConfirm(reason, typed)}
    />
  );
}
