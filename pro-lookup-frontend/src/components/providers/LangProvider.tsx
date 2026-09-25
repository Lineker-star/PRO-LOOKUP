"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, type Dict, type Lang } from "@/lib/i18n";
import { setLangCookie } from "@/lib/session";

type LangContextValue = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue | null>(null);

/** La langue initiale vient du serveur (cookie) pour éviter tout décalage d'affichage. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const router = useRouter();

  const setLang = (next: Lang) => {
    setLangCookie(next);
    router.refresh();
  };

  return <LangContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang doit être utilisé dans <LangProvider>.");
  return context;
}
