"use client";

import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api/client";

/**
 * Action d'administration confirmée DANS la page (jamais de modale, brief §8) :
 * le bouton déplie un encart avec le motif (obligatoire si `requireReason`) et la confirmation.
 */
export function ReasonAction({
  label,
  icon,
  tone = "danger",
  confirmLabel,
  description,
  requireReason = true,
  reasonLabel = "Motif (communiqué à l’enseignant)",
  extra,
  onConfirm,
  size = "md",
  disabled,
}: {
  label: string;
  icon: string;
  tone?: "danger" | "primary" | "accent";
  confirmLabel: string;
  description?: ReactNode;
  requireReason?: boolean;
  reasonLabel?: string;
  extra?: (valid: (ok: boolean) => void) => ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un champ de confirmation supplémentaire (ex. retaper l'email) doit être rempli avant de valider.
  const [extraValid, setExtraValid] = useState(!extra);

  if (!open) {
    return (
      <Button variant={tone === "danger" ? "outline" : tone} size={size} icon={icon} className={tone === "danger" ? "text-danger hover:border-danger" : undefined} onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </Button>
    );
  }

  const valid = (!requireReason || reason.trim().length >= 5) && extraValid;

  return (
    <div className={clsx("w-full space-y-3 rounded-xl border p-4", tone === "danger" ? "border-danger/40 bg-danger-soft" : "border-teal/40 bg-teal-soft")}>
      <p className="flex items-center gap-2 text-sm font-bold text-navy">
        <Icon name={icon} size={18} /> {label}
      </p>
      {description && <div className="text-sm text-ink/80">{description}</div>}
      {error && <Alert tone="danger">{error}</Alert>}
      {extra?.(setExtraValid)}
      {(requireReason || reasonLabel) && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink" htmlFor={`reason-${label}`}>
            {reasonLabel}
            {requireReason && <span className="text-danger"> *</span>}
          </label>
          <Textarea id={`reason-${label}`} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} className="bg-white" />
          {requireReason && <p className="mt-1 text-xs text-muted">5 caractères minimum.</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setReason(""); setError(null); }}>Annuler</Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          size="sm"
          icon="check"
          loading={busy}
          disabled={!valid}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onConfirm(reason.trim());
              setOpen(false);
              setReason("");
            } catch (e) {
              setError(e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Action impossible.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/** Onglets de filtre par statut, avec compteurs. */
export function StatusTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; count?: number; tone?: "danger" | "warning" }[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
            value === tab.id ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                "tnum rounded-full px-1.5 text-xs",
                value === tab.id ? "bg-white/20" : tab.tone === "danger" ? "bg-danger-soft text-danger" : tab.tone === "warning" ? "bg-gold-soft" : "bg-mist",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Indicateur chiffré du tableau de bord. */
export function Kpi({ label, value, icon, hint, tone = "navy" }: { label: string; value: number | string | undefined; icon: string; hint?: ReactNode; tone?: "navy" | "gold" | "danger" | "teal" }) {
  const tones = { navy: "bg-mist text-navy", gold: "bg-gold-soft text-navy", danger: "bg-danger-soft text-danger", teal: "bg-teal-soft text-teal-text" };
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <span className={clsx("flex size-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon name={icon} size={22} />
        </span>
      </div>
      <p className="tnum mt-3 text-3xl font-extrabold text-navy">{value ?? "—"}</p>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** Barre de recherche simple des listes d'administration. */
export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
      />
    </div>
  );
}

/** Pagination simple (boutons) pour les listes chargées côté client. */
export function Pager({ page, lastPage, total, onChange, label }: { page: number; lastPage: number; total: number; onChange: (p: number) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
      <span className="text-muted"><span className="tnum font-semibold text-navy">{total}</span> {label}</span>
      {lastPage > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon="chevron_left" disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</Button>
          <span className="tnum text-muted">{page} / {lastPage}</span>
          <Button variant="outline" size="sm" iconRight="chevron_right" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  );
}

/** Valeur « stabilisée » après une courte pause de saisie (anti-rebond des recherches). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}