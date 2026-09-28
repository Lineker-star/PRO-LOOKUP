"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/providers/LangProvider";
import { Icon } from "@/components/ui/Icon";
import { LANG_CODES, LANGS } from "@/lib/i18n";

/**
 * Choix de la langue de l'interface publique (11 langues).
 *  - `menu` : bouton compact de l'en-tête ouvrant une liste ;
 *  - `grid` : liste dépliée (menu mobile, paramètres du compte).
 */
export function LanguageSwitcher({ variant = "menu", className }: { variant?: "menu" | "grid"; className?: string }) {
  const { lang, t, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "menu") return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [variant]);

  if (variant === "grid") {
    return (
      <div className={clsx("grid grid-cols-2 gap-1.5 sm:grid-cols-3", className)} role="group" aria-label={t.choose_language}>
        {LANG_CODES.map((code) => (
          <button
            key={code}
            type="button"
            lang={LANGS[code].html}
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            className={clsx(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition",
              lang === code ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-navy",
            )}
          >
            <span className="truncate">{LANGS[code].name}</span>
            <span className={clsx("text-[11px] font-bold uppercase", lang === code ? "text-teal" : "text-muted")}>{code}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.choose_language} — ${LANGS[lang].name}`}
        className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold uppercase text-muted hover:bg-mist hover:text-navy"
      >
        <Icon name="translate" size={16} />
        {lang}
        <Icon name="expand_more" size={16} />
      </button>

      {open && (
        <div role="menu" aria-label={t.language} className="absolute right-0 z-50 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-float">
          {LANG_CODES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === code}
              lang={LANGS[code].html}
              onClick={() => {
                setOpen(false);
                if (code !== lang) setLang(code);
              }}
              className={clsx(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-mist",
                lang === code ? "font-bold text-navy" : "font-medium text-ink",
              )}
            >
              <span>{LANGS[code].name}</span>
              {lang === code ? <Icon name="check" size={18} className="text-teal-text" /> : <span className="text-[11px] font-bold uppercase text-muted">{code}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
