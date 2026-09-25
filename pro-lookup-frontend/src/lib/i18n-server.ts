import "server-only";

import { cookies } from "next/headers";
import { dictionaries, normalizeLang, type Lang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/session";

/** Langue de l'interface lue dans le cookie, côté serveur. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return normalizeLang(store.get(LANG_COOKIE)?.value);
}

export async function getDict() {
  return dictionaries[await getLang()];
}
