"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, LANGS, plural, type Dict, type Lang, type Plural } from "@/lib/i18n";
import { setLangCookie } from "@/lib/session";

type LangContextValue = {
  lang: Lang;
  t: Dict;
  /** Locale Intl de la langue (dates, nombres). */
  locale: string;
  /** Accord du pluriel : p(t.teachers_count, 3) → « 3 enseignants ». */
  p: (forms: Plural, n: number, vars?: Record<string, string | number>) => string;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

/** La langue initiale vient du serveur (cookie) pour éviter tout décalage d'affichage. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const router = useRouter();

  const setLang = (next: Lang) => {
    setLangCookie(next);
    router.refresh();
  };

  const value: LangContextValue = {
    lang,
    t: dictionaries[lang],
    locale: LANGS[lang].locale,
    p: (forms, n, vars) => plural(lang, forms, n, vars),
    setLang,
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang doit être utilisé dans <LangProvider>.");
  return context;
}
