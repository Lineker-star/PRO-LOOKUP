import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { box: string; icon: string }> = {
  info: { box: "border-teal/30 bg-teal-soft text-navy", icon: "info" },
  success: { box: "border-success/30 bg-success-soft text-ink", icon: "check_circle" },
  warning: { box: "border-warning/30 bg-warning-soft text-ink", icon: "hourglass_top" },
  danger: { box: "border-danger/30 bg-danger-soft text-ink", icon: "error" },
};

const iconColors: Record<Tone, string> = { info: "text-teal-text", success: "text-success", warning: "text-warning", danger: "text-danger" };

/** Message intégré dans la page (jamais de popup ni de toast flottant). */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  className,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  icon?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={clsx("flex gap-3 rounded-xl border p-4 text-sm", tones[tone].box, className)} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={icon ?? tones[tone].icon} size={20} className={clsx("mt-0.5 shrink-0", iconColors[tone])} />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="leading-relaxed text-ink/80">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-mist text-navy">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-navy">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-teal border-t-transparent" aria-hidden />
      {label}
    </div>
  );
}

/** Petit titre de section en majuscules sarcelle (« eyebrow » des maquettes). */
export function Eyebrow({ children, className, light }: { children: ReactNode; className?: string; light?: boolean }) {
  return (
    <p className={clsx("text-xs font-bold uppercase tracking-[0.14em]", light ? "text-teal" : "text-teal-text", className)}>{children}</p>
  );
}

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "aside" }) {
  return <Tag className={clsx("rounded-2xl border border-line bg-white shadow-card", className)}>{children}</Tag>;
}
