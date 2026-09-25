import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Feedback";

/** Mise en page des pages légales. */
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">{title}</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updated}</p>
      <div className="prose-post mt-8 space-y-6 rounded-2xl border border-line bg-white p-6 text-[15px] leading-relaxed text-ink/85 shadow-card sm:p-8 [&_h2]:mt-0">
        {children}
      </div>
    </div>
  );
}
