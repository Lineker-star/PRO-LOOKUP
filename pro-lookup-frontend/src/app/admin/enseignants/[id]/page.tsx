"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { ReasonAction } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { profileUrl, PUBLIC_API_URL } from "@/lib/config";
import { ACCOUNT_STATUS, formatDateTime } from "@/lib/format";
import type { AdminUserDetail, FacultyWithDepartments, Ref } from "@/lib/types";

/**
 * Fiche enseignant (brief §8) : modifier le grade et le rattachement, réinitialiser l'URL,
 * suspendre, réactiver, supprimer, historique. Toutes les confirmations sont dans la page.
 */
export default function TeacherAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const detail = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => (await api<{ data: AdminUserDetail }>(`/admin/users/${id}`)).data,
    retry: false,
  });
  const refs = useQuery({
    queryKey: ["public-refs"],
    queryFn: async () => {
      const [g, f] = await Promise.all([fetch(`${PUBLIC_API_URL}/public/grades`).then((r) => r.json()), fetch(`${PUBLIC_API_URL}/public/faculties`).then((r) => r.json())]);
      return { grades: g.data as Ref[], faculties: f.data as FacultyWithDepartments[] };
    },
    staleTime: 600_000,
  });

  if (detail.isPending) return <Spinner />;
  if (!detail.data) return <EmptyState icon="person_off" title="Enseignant introuvable" action={<ButtonLink href="/admin/enseignants">Retour à la liste</ButtonLink>} />;

  const u = detail.data;
  const act = async (path: string, body?: Record<string, unknown>, method: "POST" | "PUT" | "DELETE" = "POST") => {
    const res = await api<{ message: string; data?: AdminUserDetail }>(path, { method, body });
    if (res.data) queryClient.setQueryData(["admin", "user", id], res.data);
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    setMessage({ tone: "success", text: res.message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <AdminHeading
        crumbs={[{ href: "/admin/enseignants", label: "Enseignants" }, { label: u.full_name }]}
        title={u.full_name}
        lead={u.email}
        actions={
          u.status === "approved" && u.slug ? (
            <ButtonLink href={profileUrl(u.slug)} variant="outline" icon="visibility" external>Voir le profil public</ButtonLink>
          ) : undefined
        }
      />

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {u.status === "suspended" && (
        <Alert tone="danger" title={`Compte suspendu le ${formatDateTime(u.suspended_at)}`}>Motif : « {u.suspension_reason} ». Le profil et les publications ne sont plus publics.</Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar src={u.avatar_url} name={u.full_name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-navy">{u.full_name}</h2>
                  <StatusBadge tone={ACCOUNT_STATUS[u.status].tone}>{ACCOUNT_STATUS[u.status].label}</StatusBadge>
                </div>
                <p className="text-sm text-muted">{u.title ?? "—"}</p>
                {u.grade && <GradeBadge name={u.grade.name} size="sm" className="mt-2" />}
              </div>
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["URL du profil", u.slug ? `/in/${u.slug}` : "— (attribuée à l’approbation)"],
                ["Matricule", u.matricule ?? "—"],
                ["Publications", `${u.published_posts_count} publiée(s) / ${u.posts_count}`],
                ["Faculté", u.faculty?.name ?? "—"],
                ["Département", u.department?.name ?? "—"],
                ["Inscrit le", formatDateTime(u.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-canvas p-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="break-words font-semibold text-navy">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <EditCard user={u} refs={refs.data} onSave={(body) => act(`/admin/users/${u.id}`, body, "PUT")} />

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
              <ButtonLink href={`/admin/demandes/${u.registration.id}`} variant="accent" icon="folder_open" full>Examiner la demande</ButtonLink>
            )}

            {u.status === "approved" && (
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

            {u.slug && (
              <ReasonAction
                label="Réinitialiser l’URL du profil"
                icon="link_off"
                tone="primary"
                confirmLabel="Réinitialiser"
                reasonLabel="Motif (journalisé)"
                description={<>L’adresse revient à « prénom-nom ». L’ancienne <span className="font-mono">/in/{u.slug}</span> redirigera vers la nouvelle.</>}
                onConfirm={(reason) => act(`/admin/users/${u.id}/reset-slug`, { reason })}
              />
            )}

            <DeleteAction
              email={u.email}
              onConfirm={async (reason, confirm_email) => {
                await api(`/admin/users/${u.id}`, { method: "DELETE", body: { reason, confirm_email } });
                await queryClient.invalidateQueries({ queryKey: ["admin"] });
                router.push("/admin/enseignants");
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function EditCard({ user, refs, onSave }: { user: AdminUserDetail; refs?: { grades: Ref[]; faculties: FacultyWithDepartments[] }; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const [v, setV] = useState({
    grade_id: String(user.grade?.id ?? ""),
    faculty_id: String(user.faculty?.id ?? ""),
    department_id: String(user.department?.id ?? ""),
    title: user.title ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const departments = refs?.faculties.find((f) => String(f.id) === v.faculty_id)?.departments ?? [];

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="edit" size={20} className="text-teal-text" /> Grade et rattachement</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          try {
            await onSave({ grade_id: Number(v.grade_id), faculty_id: Number(v.faculty_id), department_id: Number(v.department_id), title: v.title || null });
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
          } finally {
            setSaving(false);
          }
        }}
      >
        {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
        <Field label="Grade" htmlFor="a-grade">
          <Select id="a-grade" value={v.grade_id} onChange={(e) => setV({ ...v, grade_id: e.target.value })}>
            {refs?.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
        <Field label="Titre professionnel" htmlFor="a-title">
          <Input id="a-title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        </Field>
        <Field label="Faculté" htmlFor="a-faculty">
          <Select id="a-faculty" value={v.faculty_id} onChange={(e) => setV({ ...v, faculty_id: e.target.value, department_id: "" })}>
            <option value="">Choisir…</option>
            {refs?.faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="Département" htmlFor="a-dept">
          <Select id="a-dept" value={v.department_id} onChange={(e) => setV({ ...v, department_id: e.target.value })}>
            <option value="">Choisir…</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" icon="save" loading={saving} disabled={!v.grade_id || !v.department_id}>Enregistrer</Button>
        </div>
      </form>
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
