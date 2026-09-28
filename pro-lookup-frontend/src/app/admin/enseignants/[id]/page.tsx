"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { ReasonAction } from "@/components/admin/AdminUi";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { profileUrl } from "@/lib/config";
import { ACCOUNT_STATUS, formatDateTime } from "@/lib/format";
import type { AdminUserDetail } from "@/lib/types";

/**
 * Fiche d'un compte (brief §8) : consultation, suspension, réactivation, suppression, historique,
 * nomination ou retrait du rôle d'administrateur. L'administration ne modifie JAMAIS les
 * informations ni le profil d'un enseignant : seul l'enseignant le fait, depuis son espace.
 */
export default function TeacherAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { me } = useAuth();
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const detail = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => (await api<{ data: AdminUserDetail }>(`/admin/users/${id}`)).data,
    retry: false,
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
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-mist px-3 py-2 text-xs text-navy">
              <Icon name="lock" size={16} className="mt-px shrink-0" />
              Les informations et le profil d’un enseignant ne sont modifiables que par lui-même, depuis son espace.
            </p>
          </Card>

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
    </div>
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
