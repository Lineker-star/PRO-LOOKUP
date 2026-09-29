"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/components/public/CopyLinkButton";
import { QrCodePanel } from "@/components/public/QrCodePanel";
import { ReportForm, type ReportTarget } from "@/components/public/ReportForm";
import { useLang } from "@/components/providers/LangProvider";
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
  label,
}: {
  url: string;
  title: string;
  report?: ReportTarget;
  qrFileName?: string;
  pdfHref?: string;
  compact?: boolean;
  label?: string;
}) {
  const { t } = useLang();
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
        {!compact && (label ?? t.more)}
        {compact && <span className="sr-only">{t.more_options}</span>}
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
            {copied ? t.link_copied : t.copy_link}
          </button>
          <button type="button" role="menuitem" className={item} onClick={share}>
            <Icon name="share" size={18} className="text-muted" />
            {t.share}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
            role="menuitem"
            className={item}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <WhatsAppIcon className="size-[18px] text-muted" />
            {t.share_whatsapp}
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            role="menuitem"
            className={item}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <FacebookIcon className="size-[18px] text-muted" />
            {t.share_facebook}
          </a>
          {qrFileName && (
            <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); setDialog("qr"); }}>
              <Icon name="qr_code_2" size={18} className="text-muted" />
              {t.qr_code}
            </button>
          )}
          {pdfHref && (
            <a href={pdfHref} role="menuitem" className={item} target="_blank" rel="noopener">
              <Icon name="picture_as_pdf" size={18} className="text-muted" />
              {t.save_pdf}
            </a>
          )}
          {report && (
            <>
              <div className="my-1 border-t border-line" />
              <button type="button" role="menuitem" className={clsx(item, "text-danger hover:bg-danger-soft")} onClick={() => { setOpen(false); setDialog("report"); }}>
                <Icon name="flag" size={18} />
                {t.report}
              </button>
            </>
          )}
        </div>
      )}

      {dialog === "qr" && qrFileName && (
        <Modal title={t.qr_title} subtitle={t.qr_subtitle} icon="qr_code_2" onClose={() => setDialog(null)} size="sm">
          <QrCodePanel url={url} fileName={qrFileName} labels={{ alt: t.qr_alt, png: t.qr_png, svg: t.qr_svg, hint: t.qr_hint }} />
        </Modal>
      )}
      {dialog === "report" && report && (
        <Modal
          title={report.type === "post" ? t.report_post_title : t.report_profile_title}
          subtitle={t.report_subtitle}
          icon="flag"
          onClose={() => setDialog(null)}
        >
          <ReportForm target={report} onDone={() => setDialog(null)} />
        </Modal>
      )}
    </div>
  );
}

/* Material Symbols ne fournit pas d'icônes de marque : logos WhatsApp/Facebook en SVG inline. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm5.64 8.17c0 4.42-3.6 8.02-8.02 8.02a8 8 0 0 1-4.09-1.11l-.29-.17-3.02.79.81-2.95-.19-.3a7.93 7.93 0 0 1-1.24-4.28c0-4.42 3.6-8 8.02-8 2.13 0 4.13.83 5.64 2.34a7.9 7.9 0 0 1 2.33 5.65Zm-4.4-4.6c-.15 0-.4.06-.61.31s-.82.8-.82 1.94.84 2.25.96 2.4c.12.16 1.63 2.6 4.05 3.54 2 .78 2.41.63 2.84.59.43-.04 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28s-1.4-.69-1.62-.77c-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.18-1.39-1.32-1.63-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.32-.75-1.8-.2-.47-.4-.4-.54-.41Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}
