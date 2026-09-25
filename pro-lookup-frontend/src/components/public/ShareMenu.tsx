"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/components/public/CopyLinkButton";
import { QrCodePanel } from "@/components/public/QrCodePanel";
import { ReportForm, type ReportTarget } from "@/components/public/ReportForm";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

/**
 * Menu « Plus… » (brief §6.5, §7.7) : copier le lien, partager (partage natif mobile),
 * QR code, enregistrer en PDF, signaler.
 */
export function ShareMenu({
  url,
  title,
  report,
  qrFileName,
  pdfHref,
  compact = false,
  label = "Plus…",
}: {
  url: string;
  title: string;
  report?: ReportTarget;
  qrFileName?: string;
  pdfHref?: string;
  compact?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<"qr" | "report" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const share = async () => {
    setOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // partage annulé par l'utilisateur
      }
    }
    await copyText(url);
  };

  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-mist";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold text-navy transition",
          compact ? "size-9 hover:bg-mist" : "h-10 border border-line bg-white px-4 text-sm hover:border-navy",
        )}
      >
        <Icon name="more_horiz" size={20} />
        {!compact && label}
        {compact && <span className="sr-only">Plus d’options</span>}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-float">
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={async () => {
              if (await copyText(url)) {
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  setOpen(false);
                }, 1200);
              }
            }}
          >
            <Icon name={copied ? "check" : "link"} size={18} className={copied ? "text-success" : "text-muted"} />
            {copied ? "Lien copié" : "Copier le lien"}
          </button>
          <button type="button" role="menuitem" className={item} onClick={share}>
            <Icon name="share" size={18} className="text-muted" />
            Partager
          </button>
          {qrFileName && (
            <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); setDialog("qr"); }}>
              <Icon name="qr_code_2" size={18} className="text-muted" />
              QR code
            </button>
          )}
          {pdfHref && (
            <a href={pdfHref} role="menuitem" className={item} target="_blank" rel="noopener">
              <Icon name="picture_as_pdf" size={18} className="text-muted" />
              Enregistrer en PDF
            </a>
          )}
          {report && (
            <>
              <div className="my-1 border-t border-line" />
              <button type="button" role="menuitem" className={clsx(item, "text-danger hover:bg-danger-soft")} onClick={() => { setOpen(false); setDialog("report"); }}>
                <Icon name="flag" size={18} />
                Signaler
              </button>
            </>
          )}
        </div>
      )}

      {dialog === "qr" && qrFileName && (
        <Modal title="QR code du profil" subtitle="Scannez-le pour ouvrir le profil public." icon="qr_code_2" onClose={() => setDialog(null)} size="sm">
          <QrCodePanel url={url} fileName={qrFileName} />
        </Modal>
      )}
      {dialog === "report" && report && (
        <Modal
          title={report.type === "post" ? "Signaler cette publication" : "Signaler ce profil"}
          subtitle="Votre signalement sera examiné par l’administration de l’université."
          icon="flag"
          onClose={() => setDialog(null)}
        >
          <ReportForm target={report} onDone={() => setDialog(null)} />
        </Modal>
      )}
    </div>
  );
}
