"use client";

/* eslint-disable @next/next/no-img-element -- médias servis par l'API Laravel */
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { fileSize } from "@/lib/format";
import type { PostMedia } from "@/lib/types";

/**
 * Médias d'une publication : grille d'images (clic → visionneuse plein écran),
 * document PDF ou lien externe.
 */
export function PostMediaView({ media, compact = false }: { media: PostMedia[]; compact?: boolean }) {
  const images = media.filter((m) => m.type === "image" && m.url);
  const pdf = media.find((m) => m.type === "pdf");
  const link = media.find((m) => m.type === "link");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div
          className={clsx(
            "grid gap-1.5 overflow-hidden rounded-xl",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {images.slice(0, compact ? 2 : 4).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className={clsx("relative block overflow-hidden bg-mist", images.length === 3 && index === 0 && "row-span-2")}
              aria-label={`Agrandir l’image ${index + 1}${image.alt ? ` : ${image.alt}` : ""}`}
            >
              <img
                src={image.url!}
                alt={image.alt ?? ""}
                loading="lazy"
                className={clsx("w-full object-cover transition hover:scale-[1.02]", images.length === 1 ? "max-h-[28rem]" : "aspect-[4/3] h-full")}
              />
              {index === (compact ? 1 : 3) && images.length > (compact ? 2 : 4) && (
                <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-2xl font-bold text-white">
                  +{images.length - (compact ? 2 : 4)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {pdf?.url && (
        <a
          href={pdf.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 hover:border-navy"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <Icon name="picture_as_pdf" size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-navy">{pdf.original_name ?? "Document PDF"}</span>
            <span className="block text-xs text-muted">Document PDF {pdf.size ? `· ${fileSize(pdf.size)}` : ""}</span>
          </span>
          <Icon name="download" size={20} className="text-muted" />
        </a>
      )}

      {link?.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 hover:border-navy"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-teal-soft text-teal-text">
            <Icon name="link" size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-navy">{safeHost(link.url)}</span>
            <span className="block truncate text-xs text-muted">{link.url}</span>
          </span>
          <Icon name="open_in_new" size={20} className="text-muted" />
        </a>
      )}

      {openIndex !== null && (
        <Lightbox images={images} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Visionneuse plein écran (maquette « lightbox ») : clavier ← → Échap. */
function Lightbox({
  images,
  index,
  onChange,
  onClose,
}: {
  images: PostMedia[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const go = useCallback((delta: number) => onChange((index + delta + images.length) % images.length), [index, images.length, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const image = images[index];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-navy-deep/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Visionneuse d’images">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="tnum text-sm text-white/70">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <a href={image.url!} download className="inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10" aria-label="Télécharger l’image">
            <Icon name="download" size={22} />
          </a>
          <button type="button" onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10" aria-label="Fermer">
            <Icon name="close" size={24} />
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={onClose}>
        <img src={image.url!} alt={image.alt ?? ""} className="max-h-full max-w-full rounded-lg object-contain shadow-modal" onClick={(e) => e.stopPropagation()} />
        {images.length > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Image précédente">
              <Icon name="chevron_left" size={28} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Image suivante">
              <Icon name="chevron_right" size={28} />
            </button>
          </>
        )}
      </div>
      {image.alt && <p className="px-6 pb-6 text-center text-sm text-white/80">{image.alt}</p>}
    </div>
  );
}
