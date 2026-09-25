"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

/** Barre d'outils de la version PDF (masquée à l'impression) ; ouvre l'impression automatiquement. */
export function PrintToolbar({ backHref }: { backHref: string }) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-muted">
          Choisissez <strong className="text-navy">« Enregistrer au format PDF »</strong> comme imprimante.
        </p>
        <div className="flex gap-2">
          <ButtonLink href={backHref} variant="outline" size="sm" icon="arrow_back">
            Retour au profil
          </ButtonLink>
          <Button size="sm" icon="picture_as_pdf" onClick={() => window.print()}>
            Enregistrer en PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
