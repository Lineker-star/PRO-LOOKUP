"use client";

import { useState } from "react";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { ShareMenu } from "@/components/public/ShareMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLang } from "@/components/providers/LangProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { cvDownloadUrl } from "@/lib/config";
import { fmt } from "@/lib/i18n";
import type { PublicTeacher } from "@/lib/types";

/**
 * Actions de l'en-tête du profil : Copier le lien, Coordonnées, Plus… (partage, QR, PDF, signaler).
 * Aucun bouton de mise en relation ni de message (brief §6.5).
 * Le propriétaire connecté voit en plus « Modifier » — l'administration, jamais.
 */
export function ProfileActions({ teacher, url }: { teacher: PublicTeacher; url: string }) {
  const { me } = useAuth();
  const { t } = useLang();
  const [contactOpen, setContactOpen] = useState(false);
  const isOwner = me?.slug === teacher.slug;
  const { email, phone, office } = teacher.contacts;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner && (
        <ButtonLink href="/espace/profil" variant="accent" icon="edit">
          {t.edit}
        </ButtonLink>
      )}
      {isOwner && !teacher.avatar_url && (
        // Visible seulement par l'enseignant lui-même, sur son propre profil.
        <ButtonLink href="/espace/profil" variant="light" icon="add_a_photo">
          Ajouter ma photo
        </ButtonLink>
      )}
      {teacher.cv && (
        <a
          href={cvDownloadUrl(teacher.slug)}
          download
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-navy transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/60"
        >
          <Icon name="download" size={20} />
          {t.download_cv}
        </a>
      )}
      <CopyLinkButton url={url} label={t.copy_profile_link} copiedLabel={t.link_copied} variant="light" />
      <Button variant="light" icon="contact_mail" onClick={() => setContactOpen(true)}>
        {t.contacts}
      </Button>
      <ShareMenu
        url={url}
        title={`${teacher.full_name} — PRO-LOOKUP`}
        report={{ type: "profile", slug: teacher.slug }}
        qrFileName={`qr-${teacher.slug}`}
        pdfHref={`/in/${teacher.slug}/pdf`}
      />

      {contactOpen && (
        <Modal title={fmt(t.contacts_of, { name: teacher.full_name })} icon="contact_mail" onClose={() => setContactOpen(false)} size="sm">
          <ul className="space-y-3 text-sm">
            <ContactRow icon="link" label={t.contact_profile} value={url} href={url} />
            {email && <ContactRow icon="mail" label={t.contact_email} value={email} />}
            {phone && <ContactRow icon="call" label={t.contact_phone} value={phone} />}
            {office && <ContactRow icon="meeting_room" label={t.contact_office} value={office} />}
          </ul>
          {!email && !phone && !office && <p className="mt-4 rounded-lg bg-canvas p-3 text-xs text-muted">{t.contact_none}</p>}
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
