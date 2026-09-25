"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copie le lien ; la confirmation « Lien copié » s'affiche DANS le bouton pendant 2 s (brief §6.5). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Repli pour les navigateurs sans API presse-papiers (http, anciens mobiles).
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyLinkButton({
  url,
  label = "Copier le lien",
  variant = "outline",
  size = "md",
  className,
}: {
  url: string;
  label?: string;
  variant?: "outline" | "light" | "primary" | "accent";
  size?: "sm" | "md";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant={variant}
      size={size}
      icon={copied ? "check" : "link"}
      className={className}
      onClick={async () => {
        if (await copyText(url)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
      aria-live="polite"
    >
      {copied ? "Lien copié" : label}
    </Button>
  );
}
