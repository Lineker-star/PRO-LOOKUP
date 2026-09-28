"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { ReasonAction } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError, openProtectedFile } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { RegistrationDetail } from "@/lib/types";

/**
 * Fiche d'une demande d'inscription : informations soumises, justificatif (disque privé),
 * décision intégrée à la page — Approuver ou Refuser avec motif obligatoire (brief §5.2, §8).
 */
export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const detail = useQuery({
    queryKey: ["admin", "request", id],
    queryFn: async () => (await api<{ data: RegistrationDetail }>(`/admin/registration-requests/${id}`)).data,
    retry: false,
  });

  if (detail.isPending) return <Spinner />;
  if (!detail.data) return <EmptyState icon="search_off" title="Demande introuvable" action={<ButtonLink href="/admin/demandes">Retour aux demandes</ButtonLink>} />;

  const r = detail.data;
  const p = r.profile;

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div className="space-y-6">
      <AdminHeading
        crumbs={[{ href: "/admin/demandes", label: "Demandes d’inscription" }, { label: p.full_name }]}
        title={`Demande de ${p.full_name}`}
        lead={`Déposée le ${formatDateTime(r.submitted_at)}`}
        actions={<ButtonLink href="/admin/demandes" variant="outline" icon="arrow_back">Toutes les demandes</ButtonLink>}
      />

      {result && <Alert tone={result.tone}>{result.text}</Alert>}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Identité */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar src={p.avatar_url} name={p.full_name} size="lg" />
                <div>
                  <h2 className="text-xl font-extrabold text-navy">{p.full_name}</h2>
                  <p className="text-sm text-muted">{p.title ?? "Titre non renseigné"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {p.grade && <GradeBadge name={p.grade.name} size="sm" />}
                    <StatusBadge tone={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "danger"}>
                      {r.status === "pending" ? "En attente" : r.status === "approved" ? "Approuvée" : "Refusée"}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Email", p.email, "mail"],
                ["Matricule enseignant", r.matricule, "pin"],
                ["École supérieure", p.school, "account_balance"],
                ["Département / Filière", p.department, "apartment"],
                ["Domaine d’expertise", p.expertise, "psychology"],
                ["Téléphone", p.phone, "call"],
              ].map(([label, value, icon]) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-canvas p-3">
                  <Icon name={icon!} size={18} className="mt-0.5 text-muted" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="break-words font-semibold text-navy">{value || "—"}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>

          {/* Justificatif */}
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="folder_special" size={20} className="text-teal-text" /> Justificatif</h2>
            <p className="mt-1 text-sm text-muted">Stocké de façon privée : accessible uniquement aux administrateurs.</p>
            {docError && <Alert tone="danger" className="mt-4">{docError}</Alert>}
            {r.has_document ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-danger-soft text-danger">
                    <Icon name={r.document_mime?.includes("pdf") ? "picture_as_pdf" : "image"} size={24} />
                  </span>
                  <div>
                    <p className="font-semibold text-navy">{r.document_name}</p>
                    <p className="text-xs text-muted">{r.document_mime}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  icon="visibility"
                  onClick={async () => {
                    setDocError(null);
                    try {
                      await openProtectedFile(`/admin/registration-requests/${r.id}/document`);
                    } catch (e) {
                      setDocError(e instanceof ApiError ? e.message : "Ouverture impossible.");
                    }
                  }}
                >
                  Ouvrir le justificatif
                </Button>
              </div>
            ) : (
              <Alert tone="warning" className="mt-4">Aucun justificatif disponible pour cette demande.</Alert>
            )}
          </Card>

          {p.bio && (
            <Card className="p-6">
              <h2 className="font-bold text-navy">Biographie (brouillon)</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/85">{p.bio}</p>
            </Card>
          )}
        </div>

        {/* Décision */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="gavel" size={20} className="text-teal-text" /> Décision</h2>
            {r.status !== "pending" ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  Demande <strong>{r.status === "approved" ? "approuvée" : "refusée"}</strong> le {formatDateTime(r.processed_at)}
                  {r.processed_by ? ` par ${r.processed_by}` : ""}.
                </p>
                {r.reason && <p className="rounded-lg bg-danger-soft p-3">Motif : « {r.reason} »</p>}
                {r.status === "approved" && p.slug && (
                  <ButtonLink href={`/in/${p.slug}`} variant="outline" size="sm" icon="visibility" external>Voir le profil public</ButtonLink>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted">
                  L’approbation publie le profil dans l’annuaire, crée son adresse <span className="font-mono">/in/…</span> et prévient l’enseignant par email.
                </p>
                {confirmApprove ? (
                  <div className="space-y-3 rounded-xl border border-success/40 bg-success-soft p-4">
                    <p className="text-sm font-semibold text-navy">Confirmer l’approbation de {p.full_name} ?</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setConfirmApprove(false)}>Annuler</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon="verified"
                        loading={approving}
                        onClick={async () => {
                          setApproving(true);
                          try {
                            const res = await api<{ message: string }>(`/admin/registration-requests/${r.id}/approve`, { method: "POST" });
                            setResult({ tone: "success", text: res.message });
                            await refreshAll();
                          } catch (e) {
                            setResult({ tone: "danger", text: e instanceof ApiError ? e.message : "Approbation impossible." });
                          } finally {
                            setApproving(false);
                            setConfirmApprove(false);
                          }
                        }}
                      >
                        Oui, approuver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="accent" icon="verified" full onClick={() => setConfirmApprove(true)}>Approuver la demande</Button>
                )}
                <ReasonAction
                  label="Refuser la demande"
                  icon="block"
                  confirmLabel="Confirmer le refus"
                  description="L’enseignant recevra le motif par email et pourra déposer une nouvelle demande."
                  onConfirm={async (reason) => {
                    const res = await api<{ message: string }>(`/admin/registration-requests/${r.id}/reject`, { method: "POST", body: { reason } });
                    setResult({ tone: "success", text: res.message });
                    await refreshAll();
                  }}
                />
              </div>
            )}
          </Card>

          <Card className="p-6 text-sm">
            <h2 className="font-bold text-navy">Points à vérifier</h2>
            <ul className="mt-3 space-y-2 text-muted">
              {["Le matricule correspond à un enseignant de l’université", "Le justificatif est lisible et au nom du demandeur", "L’école supérieure, le département / la filière et le grade sont cohérents", "L’email appartient bien au demandeur"].map((item) => (
                <li key={item} className="flex items-start gap-2"><Icon name="check_small" size={18} className="text-teal-text" /> {item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
