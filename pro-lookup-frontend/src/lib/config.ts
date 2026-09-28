/** Configuration lue dans les variables d'environnement (.env.local). */

/** URL de l'API Laravel vue depuis le navigateur. */
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

/** URL de l'API vue depuis le serveur Next.js (peut être une adresse interne). */
export const SERVER_API_URL = (process.env.API_URL ?? PUBLIC_API_URL).replace(/\/$/, "");

/** Adresse publique du site : URL canoniques, aperçus de lien, QR codes. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "PRO-LOOKUP";
export const UNIVERSITY = "Université ZTF";
export const UNIVERSITY_FULL = "Université ZTF — Bertoua";

/** Durée de cache des pages publiques (secondes), en plus de la revalidation immédiate déclenchée par Laravel. */
export const PUBLIC_REVALIDATE = 300;

/** URL canonique d'un profil : https://<domaine>/in/<identifiant> */
export const profileUrl = (slug: string) => `${SITE_URL}/in/${slug}`;
export const postUrl = (id: number | string) => `${SITE_URL}/publications/${id}`;
/** Téléchargement public du CV (PDF servi par l'API, qui vérifie que le profil et la section sont publics). */
export const cvDownloadUrl = (slug: string) => `${PUBLIC_API_URL}/public/teachers/${encodeURIComponent(slug)}/cv`;
