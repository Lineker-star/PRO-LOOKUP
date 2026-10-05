"use client";

/* eslint-disable @next/next/no-img-element -- images servies par l'API Laravel (stockage public) */
import clsx from "clsx";
import { useState } from "react";
import { initials } from "@/lib/format";

const sizes = {
  xs: "size-8 text-[11px]",
  sm: "size-10 text-xs",
  md: "size-14 text-base",
  lg: "size-20 text-xl",
  xl: "size-32 text-4xl",
};

/** Photo de profil ronde avec anneau doré, ou initiales sur fond bleu nuit à défaut de photo. */
export function Avatar({
  src,
  name,
  size = "md",
  ring = true,
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  ring?: boolean;
  className?: string;
}) {
  const base = clsx(
    "shrink-0 overflow-hidden rounded-full",
    sizes[size],
    ring && "ring-2 ring-gold ring-offset-2 ring-offset-white",
    className,
  );

  // Fichier introuvable (stockage éphémère après un redéploiement) : on retombe sur les initiales.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={`Photo de ${name}`}
        className={clsx(base, "object-cover bg-mist")}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={clsx(base, "inline-flex items-center justify-center bg-navy font-bold text-white")} aria-label={name} role="img">
      {initials(name)}
    </span>
  );
}
