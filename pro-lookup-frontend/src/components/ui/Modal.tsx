"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Fenêtre modale (zones A et B uniquement — jamais dans l'administration, brief §7.7).
 * Fermeture : bouton, touche Échap ou clic sur le fond. Le focus est placé dans la fenêtre.
 */
export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/40 p-0 backdrop-blur-[4px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-modal outline-none sm:rounded-2xl`}
      >
        <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" aria-hidden />
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          {icon && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal-text">
              <Icon name={icon} size={22} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="modal-title" className="text-lg font-bold text-navy">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-navy" aria-label="Fermer">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
