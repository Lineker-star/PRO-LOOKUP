/**
 * Session côté navigateur.
 *
 * Le jeton Sanctum est conservé dans un cookie `pl_token` (lu par le client HTTP),
 * et un cookie `pl_session` = "<rôle>.<statut>" permet au proxy Next.js de rediriger
 * vers le bon espace. Ces cookies servent au CONFORT de navigation : la sécurité
 * reste assurée par l'API Laravel sur chaque requête (brief §9.3).
 */

export const TOKEN_COOKIE = "pl_token";
export const SESSION_COOKIE = "pl_session";
export const LANG_COOKIE = "pl_lang";

/** Événement émis à chaque changement de session, pour que l'interface se mette à jour. */
const SESSION_EVENT = "pl-session-change";

function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  const age = maxAgeSeconds !== undefined ? `; Max-Age=${maxAgeSeconds}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${age}${secure}`;
  if (name === TOKEN_COOKIE) window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Abonnement aux changements de session (utilisé avec useSyncExternalStore). */
export function subscribeSession(callback: () => void): () => void {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getToken(): string | null {
  return readCookie(TOKEN_COOKIE);
}

/** Enregistre la session. `remember` : 30 jours, sinon cookie de session (fermeture du navigateur). */
export function saveSession(token: string, role: string, status: string, remember: boolean) {
  const age = remember ? 60 * 60 * 24 * 30 : undefined;
  setCookie(TOKEN_COOKIE, token, age);
  setCookie(SESSION_COOKIE, `${role}.${status}`, age);
}

export function updateSessionMarker(role: string, status: string) {
  if (getToken()) setCookie(SESSION_COOKIE, `${role}.${status}`);
}

export function clearSession() {
  setCookie(TOKEN_COOKIE, "", 0);
  setCookie(SESSION_COOKIE, "", 0);
}

/** Langue de l'interface publique (code validé côté serveur par normalizeLang). */
export function setLangCookie(lang: string) {
  setCookie(LANG_COOKIE, lang, 60 * 60 * 24 * 365);
}
