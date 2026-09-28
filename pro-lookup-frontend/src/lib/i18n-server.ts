import "server-only";

import { cookies } from "next/headers";
import { dictionaries, LANGS, normalizeLang, plural, type Lang, type Plural } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/session";

/** Langue de l'interface lue dans le cookie, côté serveur. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return normalizeLang(store.get(LANG_COOKIE)?.value);
}

export async function getDict() {
  return dictionaries[await getLang()];
}

/** Dictionnaire, langue, locale Intl et accord du pluriel, pour les pages serveur. */
export async function getI18n() {
  const lang = await getLang();
  return {
    lang,
    t: dictionaries[lang],
    locale: LANGS[lang].locale,
    p: (forms: Plural, n: number, vars?: Record<string, string | number>) => plural(lang, forms, n, vars),
  };
}
