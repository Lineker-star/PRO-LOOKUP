"use client";

import { useState } from "react";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { ShareMenu } from "@/components/public/ShareMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import type { PublicTeacher } from "@/lib/types";

/**
 * Actions de l'en-tête du profil : Copier le lien, Coordonnées, Plus… (partage, QR, PDF, signaler).
 * Aucun bouton de mise en relation ni de message (brief §6.5).
 * Le propriétaire connecté voit en plus « Modifier ».
 */
export function ProfileActions({ teacher, url }: { teacher: PublicTeacher; url: string }) {
  const { me } = useAuth();
  const [contactOpen, setContactOpen] = useState(false);
  const isOwner = me?.slug === teacher.slug;
  const { email, phone, office } = teacher.contacts;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && (
        <ButtonLink href="/espace/profil" variant="accent" icon="edit">
          Modifier
        </ButtonLink>
      )}
      <CopyLinkButton url={url} label="Copier le lien du profil" variant="light" />
      <Button variant="light" icon="contact_mail" onClick={() => setContactOpen(true)}>
        Coordonnées
      </Button>
      <ShareMenu
        url={url}
        title={`${teacher.full_name} — PRO-LOOKUP`}
        report={{ type: "profile", slug: teacher.slug }}
        qrFileName={`qr-${teacher.slug}`}
        pdfHref={`/in/${teacher.slug}/pdf`}
      />

      {contactOpen && (
        <Modal title={`Coordonnées de ${teacher.full_name}`} icon="contact_mail" onClose={() => setContactOpen(false)} size="sm">
          <ul className="space-y-3 text-sm">
            <ContactRow icon="link" label="Profil PRO-LOOKUP" value={url} href={url} />
            {email && <ContactRow icon="mail" label="Email professionnel" value={email} />}
            {phone && <ContactRow icon="call" label="Téléphone" value={phone} />}
            {office && <ContactRow icon="meeting_room" label="Bureau" value={office} />}
          </ul>
          {!email && !phone && !office && (
            <p className="mt-4 rounded-lg bg-canvas p-3 text-xs text-muted">L’enseignant n’a pas rendu d’autres coordonnées publiques.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-line p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mist text-navy">
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        {href ? (
          <a href={href} className="block break-all font-medium text-teal-text hover:underline">{value}</a>
        ) : (
          <span className="block break-all font-medium text-ink">{value}</span>
        )}
      </span>
    </li>
  );
}
