"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cvDownloadUrl, PUBLIC_API_URL } from "@/lib/config";
import { getToken } from "@/lib/session";
import type { PublicTeacher } from "@/lib/types";

/**
 * CV sur le profil public : un visiteur ne peut que le consulter (ouverture dans un nouvel
 * onglet, disposition « inline » côté API) ; le propriétaire, lui, le télécharge réellement
 * depuis son compte (GET /me/cv, disposition « attachment »).
 */
export function CvLink({
  teacher,
  className,
  children,
}: {
  teacher: PublicTeacher;
  className?: string;
  /** Reçoit `isOwner` : chaque appelant choisit son icône et son libellé (« Voir » ou « Télécharger »). */
  children: (isOwner: boolean) => ReactNode;
}) {
  const { me } = useAuth();
  const [busy, setBusy] = useState(false);
  const isOwner = me?.slug === teacher.slug;

  if (!isOwner) {
    return (
      <a href={cvDownloadUrl(teacher.slug)} target="_blank" rel="noopener noreferrer" className={className}>
        {children(false)}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={clsx(className, busy && "pointer-events-none opacity-60")}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`${PUBLIC_API_URL}/me/cv`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
          if (!res.ok) throw new Error();
          const url = URL.createObjectURL(await res.blob());
          const a = document.createElement("a");
          a.href = url;
          a.download = `cv-${teacher.slug}.pdf`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch {
          window.open(cvDownloadUrl(teacher.slug), "_blank", "noopener");
        } finally {
          setBusy(false);
        }
      }}
    >
      {children(true)}
    </button>
  );
}
