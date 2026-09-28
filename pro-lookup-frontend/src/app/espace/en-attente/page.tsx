"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { FileDrop } from "@/components/auth/RegisterForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { Me } from "@/lib/types";

/**
 * Écran du compte en attente / refusé / suspendu (brief §3, §5.2) — maquette « espace personnel profil en attente ».
 * Rien de ce compte n'est public ; il ne peut pas publier.
 */
export default function PendingPage() {
  const { me } = useAuth();
  if (!me) return <Spinner />;

  if (me.status === "approved") {
    return (
      <Alert tone="success" title="Votre compte est approuvé" action={<ButtonLink href="/espace" size="sm">Mon espace</ButtonLink>}>
        Votre profil est public.
      </Alert>
    );
  }

  if (me.status === "suspended") return <Suspended me={me} />;
  if (me.status === "rejected") return <Rejected me={me} />;
  return <Pending me={me} />;
}

function Pending({ me }: { me: Me }) {
  const steps = [
    { title: "Inscription envoyée", text: `Reçue le ${formatDateTime(me.registration?.submitted_at)}`, state: "done" as const },
    { title: "Vérification par l’administration", text: "Contrôle du rattachement, du matricule et du justificatif.", state: "current" as const },
    { title: "Publication du profil", text: "Adresse /in/… attribuée, profil visible dans l’annuaire, publications autorisées.", state: "todo" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-warning/30 bg-white shadow-card">
        <div className="flex gap-4 border-l-4 border-warning p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <Icon name="hourglass_top" size={26} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-warning">En attente de validation</p>
            <h1 className="mt-1 text-xl font-extrabold text-navy sm:text-2xl">Votre inscription est en cours de vérification</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Votre profil n’est pas encore visible publiquement : il n’apparaît ni dans l’annuaire ni dans la recherche. Vous recevrez un email dès
              que l’administration aura traité votre inscription.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">Progression de votre inscription</h2>
          <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-navy">Étape 2 sur 3</span>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={clsx(
                "rounded-xl border p-4",
                step.state === "done" && "border-success/30 bg-success-soft",
                step.state === "current" && "border-warning/40 bg-warning-soft shadow-card",
                step.state === "todo" && "border-line bg-canvas opacity-70",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "flex size-8 items-center justify-center rounded-lg text-white",
                    step.state === "done" ? "bg-success" : step.state === "current" ? "bg-warning" : "bg-muted",
                  )}
                >
                  <Icon name={step.state === "done" ? "check" : step.state === "current" ? "autorenew" : "lock"} size={18} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {step.state === "done" ? "Terminé" : step.state === "current" ? "En cours" : "À venir"}
                </span>
              </div>
              <p className="mt-3 font-semibold text-navy">{i + 1}. {step.title}</p>
              <p className="mt-1 text-xs text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-bold text-navy">Votre inscription</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Nom", me.full_name],
              ["Email", me.email],
              ["École supérieure", me.school],
              ["Département / Filière", me.department],
              ["Grade", me.grade?.name],
              ["Matricule", me.registration?.matricule],
              ["Justificatif", me.registration?.document_name],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold text-navy">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-bold text-navy">En attendant</h2>
            <p className="mt-2 text-sm text-muted">Préparez votre profil : il restera en brouillon, invisible, jusqu’à l’approbation.</p>
            <ButtonLink href="/espace/profil" variant="primary" icon="edit" className="mt-4">Compléter mon profil (brouillon)</ButtonLink>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <Icon name="lock" size={18} className="text-muted" /> Disponible après approbation
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><Icon name="edit_square" size={18} /> Publier des contenus publics</li>
              <li className="flex items-center gap-2"><Icon name="link" size={18} /> Adresse de profil personnalisable, QR code, PDF</li>
              <li className="flex items-center gap-2"><Icon name="groups" size={18} /> Apparition dans l’annuaire et la recherche</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Rejected({ me }: { me: Me }) {
  const { setMe } = useAuth();
  const [matricule, setMatricule] = useState(me.registration?.matricule ?? "");
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  return (
    <div className="space-y-6">
      <SpaceHeading eyebrow="Inscription" title="Votre inscription n’a pas été acceptée" />
      <Alert tone="danger" title="Motif indiqué par l’administration">
        {me.registration?.reason ?? "Aucun motif précisé."}
      </Alert>
      <Card className="p-6">
        <h2 className="font-bold text-navy">Renouveler mon inscription</h2>
        <p className="mt-1 text-sm text-muted">Corrigez les éléments signalés (au besoin votre école supérieure, votre département / filière ou votre grade depuis{" "}
          <Link href="/espace/profil" className="font-semibold text-teal-text underline">Mon profil</Link>), puis envoyez à nouveau votre matricule et un justificatif.</p>
        <form
          className="mt-5 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!document) return setError("Le justificatif est obligatoire.");
            setError(null);
            setSending(true);
            const body = new FormData();
            body.append("matricule", matricule);
            body.append("document", document);
            try {
              const res = await api<{ data: Me }>("/me/registration", { method: "POST", body });
              setMe(res.data);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Envoi impossible.");
            } finally {
              setSending(false);
            }
          }}
        >
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Matricule enseignant" htmlFor="re-matricule" required>
            <Input id="re-matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} icon="pin" required />
          </Field>
          <Field label="Nouveau justificatif" htmlFor="re-document" required hint="PDF ou image, 5 Mo maximum.">
            <FileDrop id="re-document" accept=".pdf,.jpg,.jpeg,.png" file={document} onChange={setDocument} icon="upload_file" label="Déposer le justificatif" />
          </Field>
          <Button type="submit" variant="accent" icon="send" loading={sending}>Renouveler mon inscription</Button>
        </form>
      </Card>
    </div>
  );
}

function Suspended({ me }: { me: Me }) {
  return (
    <div className="space-y-6">
      <SpaceHeading eyebrow="Compte" title="Votre compte est suspendu" />
      <Alert tone="danger" title="Motif indiqué par l’administration">
        {me.suspension_reason ?? "Aucun motif précisé."}
      </Alert>
      <Card className="p-6 text-sm leading-relaxed text-muted">
        Votre profil et vos publications ne sont plus visibles publiquement, et l’accès à votre espace est bloqué. Pour contester cette décision ou
        obtenir des précisions, contactez l’administration de l’Université ZTF.
      </Card>
    </div>
  );
}
