"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Tiroir d'édition latéral (brief §7.7), zones A et B uniquement. */
export function Drawer({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
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

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-navy/40 backdrop-blur-[3px]" onMouseDown={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-modal outline-none"
      >
        <div className="flex items-start gap-3 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="text-lg font-bold text-navy">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-navy" aria-label="Fermer">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
