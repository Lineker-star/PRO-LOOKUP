import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Badge de grade : même traitement visuel pour tous les grades (brief §6.3),
 * or doux avec texte bleu nuit.
 */
export function GradeBadge({ name, size = "md", className }: { name: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-gold font-bold uppercase tracking-[0.05em] text-navy",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className,
      )}
    >
      <Icon name="workspace_premium" size={size === "sm" ? 12 : 14} />
      {name}
    </span>
  );
}

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-mist text-muted",
  info: "bg-teal-soft text-teal-text",
};

const toneIcons: Record<Tone, string> = {
  success: "check_circle",
  warning: "hourglass_top",
  danger: "block",
  neutral: "edit_note",
  info: "info",
};

/** Pastille d'état : toujours une icône + un texte (l'état n'est jamais indiqué par la seule couleur). */
export function StatusBadge({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      <Icon name={icon ?? toneIcons[tone]} size={14} />
      {children}
    </span>
  );
}

/** Petite étiquette neutre (catégorie, domaine…). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md bg-mist px-2 py-0.5 text-xs font-medium text-navy", className)}>
      {children}
    </span>
  );
}
