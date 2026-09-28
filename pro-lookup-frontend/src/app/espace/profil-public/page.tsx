"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CopyLinkButton, copyText } from "@/components/public/CopyLinkButton";
import { QrCodePanel } from "@/components/public/QrCodePanel";
import { useAuth } from "@/components/providers/AuthProvider";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { profileUrl, SITE_URL } from "@/lib/config";
import { formatDate, VISIBILITY_SECTIONS } from "@/lib/format";
import type { PublicProfileSettings, VisibilitySection } from "@/lib/types";

type Availability = { slug: string; available: boolean; current: boolean; message: string };

/** « Mon profil public » : URL, QR code, badge, sections et coordonnées visibles, référencement (brief §6.6). */
export default function PublicProfileSettingsPage() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["public-profile"], queryFn: async () => (await api<{ data: PublicProfileSettings }>("/me/public-profile")).data });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (settings.isPending || !settings.data) return <Spinner />;
  const s = settings.data;
  const url = s.slug && s.teaches ? profileUrl(s.slug) : "";
  const hiddenAdminProfile = s.can_toggle_teaches && !s.teaches;

  const update = async (key: string, body: Record<string, unknown>) => {
    setSaving(key);
    setError(null);
    try {
      const res = await api<{ data: PublicProfileSettings }>("/me/public-profile", { method: "PUT", body });
      queryClient.setQueryData(["public-profile"], res.data);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <SpaceHeading
        eyebrow="Visibilité"
        title="Mon profil public et mon URL"
        lead="Choisissez ce que le public voit. Une section masquée n’apparaît nulle part : ni sur la page, ni dans le PDF, ni dans l’aperçu de lien."
        actions={url ? <ButtonLink href={`/in/${s.slug}`} variant="accent" icon="visibility">Voir mon profil tel que le public le voit</ButtonLink> : undefined}
      />
      {error && <Alert tone="danger">{error}</Alert>}

      {s.can_toggle_teaches && (
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="school" size={20} className="text-teal-text" /> Profil d’enseignant</h2>
          <p className="mt-1 text-sm text-muted">
            Vous êtes administrateur. Si vous enseignez aussi, publiez votre profil : il apparaîtra dans l’annuaire comme celui de tout enseignant,
            sans aucune mention de votre rôle d’administrateur.
          </p>
          <div className="mt-3">
            <Toggle
              id="teaches"
              label="J’enseigne : publier mon profil dans l’annuaire"
              description={s.teaches ? "Votre profil et vos publications sont visibles publiquement." : "Votre profil n’est pas public ; vous n’apparaissez pas dans l’annuaire."}
              checked={s.teaches}
              disabled={saving !== null}
              onChange={(v) => update("teaches", { teaches: v })}
            />
          </div>
        </Card>
      )}

      {!hiddenAdminProfile && (
      <>
      <SlugCard key={s.slug ?? ""} settings={s} onChanged={async (next) => { queryClient.setQueryData(["public-profile"], next); await refresh(); }} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="qr_code_2" size={20} className="text-teal-text" /> QR code du profil</h2>
          <p className="mt-1 text-sm text-muted">Pour vos cartes de visite, affiches et diapositives de conférence.</p>
          <div className="mt-5">{url && <QrCodePanel url={url} fileName={`qr-${s.slug}`} />}</div>
        </Card>
        {url && <BadgeCard url={url} />}
      </div>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="visibility" size={20} className="text-teal-text" /> Sections visibles</h2>
        <p className="mt-1 text-sm text-muted">L’en-tête (photo, nom, grade, titre, école supérieure, département / filière) reste toujours public : c’est la base de l’annuaire.</p>
        <div className="mt-3 divide-y divide-line">
          {(Object.keys(VISIBILITY_SECTIONS) as VisibilitySection[]).map((key) => (
            <Toggle
              key={key}
              id={`sec-${key}`}
              label={VISIBILITY_SECTIONS[key]}
              checked={s.sections[key]}
              disabled={saving !== null}
              onChange={(value) => update(`sec-${key}`, { sections: { [key]: value } })}
            />
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="contact_mail" size={20} className="text-teal-text" /> Coordonnées publiques</h2>
          <p className="mt-1 text-sm text-muted">Désactivées par défaut. Renseignez-les dans « Modifier mon profil ».</p>
          <div className="mt-3 divide-y divide-line">
            <Toggle id="c-email" label="Email professionnel" checked={s.show_email} disabled={saving !== null} onChange={(v) => update("email", { show_email: v })} />
            <Toggle id="c-phone" label="Téléphone" checked={s.show_phone} disabled={saving !== null} onChange={(v) => update("phone", { show_phone: v })} />
            <Toggle id="c-office" label="Bureau" checked={s.show_office} disabled={saving !== null} onChange={(v) => update("office", { show_office: v })} />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="travel_explore" size={20} className="text-teal-text" /> Référencement</h2>
          <div className="mt-3">
            <Toggle
              id="seo"
              label="Autoriser les moteurs de recherche"
              description="Désactivé : votre profil et vos publications restent accessibles par leur lien, mais Google & co. ne les indexent pas (balise noindex)."
              checked={s.search_indexable}
              disabled={saving !== null}
              onChange={(v) => update("seo", { search_indexable: v })}
            />
          </div>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}

/** Modification de l'identifiant d'URL avec vérification de disponibilité en direct (brief §6.4). */
function SlugCard({ settings, onChanged }: { settings: PublicProfileSettings; onChanged: (s: PublicProfileSettings) => void }) {
  const [value, setValue] = useState(settings.slug ?? "");
  const [check, setCheck] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const limitReached = settings.slug_changes_remaining === 0;

  const normalized = value.trim().toLowerCase();
  const needsCheck = Boolean(normalized) && normalized !== settings.slug;

  // Vérification en direct, après une courte pause de saisie ; l'état n'est modifié que dans le rappel.
  useEffect(() => {
    if (!needsCheck) return;
    const timer = setTimeout(async () => {
      try {
        setCheck(await api<Availability>("/me/slug/availability", { query: { slug: normalized } }));
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [normalized, needsCheck]);

  // Résultat affiché seulement s'il correspond à la saisie actuelle.
  const currentCheck = needsCheck && check?.slug === normalized ? check : null;

  const url = settings.slug ? profileUrl(settings.slug) : "";
  const domain = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="link" size={20} className="text-teal-text" /> Mon URL</h2>
          <p className="mt-1 text-sm text-muted">Une adresse courte à mettre sur votre CV, votre signature d’email ou votre carte de visite.</p>
        </div>
        {url && <CopyLinkButton url={url} size="sm" />}
      </div>

      <p className="mt-4 break-all rounded-xl bg-canvas px-4 py-3 font-mono text-sm font-semibold text-navy">{url.replace(/^https?:\/\//, "")}</p>

      <form
        className="mt-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setSaved(false);
          try {
            const res = await api<{ data: PublicProfileSettings }>("/me/slug", { method: "PUT", body: { slug: value.trim().toLowerCase() } });
            onChanged(res.data);
            setSaved(true);
            setCheck(null);
          } catch (err) {
            setError(err instanceof ApiError ? (err.field("slug") ?? err.message) : "Modification impossible.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <label htmlFor="slug" className="text-sm font-semibold text-ink">Personnaliser l’identifiant</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-line bg-white focus-within:border-teal focus-within:ring-3 focus-within:ring-teal/20">
            <span className="whitespace-nowrap border-r border-line bg-canvas px-3 py-2.5 text-sm text-muted">{domain}/in/</span>
            <input
              id="slug"
              value={value}
              onChange={(e) => {
                const next = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                setValue(next);
                setChecking(Boolean(next) && next !== settings.slug);
                setSaved(false);
              }}
              maxLength={settings.slug_rules.max}
              disabled={limitReached}
              className="h-11 min-w-0 flex-1 px-3 font-mono text-sm focus:outline-none"
              aria-describedby="slug-help"
            />
          </div>
          <Button type="submit" variant="primary" loading={saving} disabled={limitReached || !currentCheck?.available || checking}>Enregistrer</Button>
        </div>
        <p id="slug-help" className="text-xs text-muted">
          {settings.slug_rules.min} à {settings.slug_rules.max} caractères : lettres minuscules, chiffres et tirets. Les anciens liens redirigent vers la nouvelle adresse.
        </p>
        {checking && <p className="text-xs text-muted">Vérification…</p>}
        {!checking && currentCheck && (
          <p className={`flex items-center gap-1 text-sm font-semibold ${currentCheck.available ? "text-success" : "text-danger"}`}>
            <Icon name={currentCheck.available ? "check_circle" : "cancel"} size={18} /> {currentCheck.message}
          </p>
        )}
        {error && <p className="text-sm font-semibold text-danger">{error}</p>}
        {saved && <Alert tone="success">Nouvelle adresse enregistrée. L’ancienne redirige désormais vers celle-ci.</Alert>}
        <p className="text-xs text-muted">
          {limitReached
            ? `Limite atteinte (${settings.slug_rules.max_changes} changements sur ${settings.slug_rules.window_days} jours). Prochain changement possible le ${formatDate(settings.slug_next_change_at)}.`
            : `Changements restants : ${settings.slug_changes_remaining} sur ${settings.slug_rules.max_changes} par période de ${settings.slug_rules.window_days} jours.`}
        </p>
      </form>
    </Card>
  );
}

/** Badge HTML à coller dans une signature d'email ou un site web (brief §6.5). */
function BadgeCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:#0A2540;color:#ffffff;font:600 14px Arial,sans-serif;text-decoration:none;">Voir mon profil PRO-LOOKUP <span style="color:#00A9A5;">&rarr;</span></a>`;

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-bold text-navy"><Icon name="code" size={20} className="text-teal-text" /> Badge de profil</h2>
      <p className="mt-1 text-sm text-muted">À coller dans votre signature d’email, votre site personnel ou la page de votre laboratoire.</p>
      <div className="mt-5 rounded-xl border border-line bg-canvas p-5 text-center" dangerouslySetInnerHTML={{ __html: code }} />
      <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-navy p-3 text-xs leading-relaxed text-white/80">{code}</pre>
      <Button
        variant="outline"
        size="sm"
        icon={copied ? "check" : "content_copy"}
        className="mt-3"
        onClick={async () => {
          if (await copyText(code)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
      >
        {copied ? "Code copié" : "Copier le code HTML"}
      </Button>
    </Card>
  );
}
