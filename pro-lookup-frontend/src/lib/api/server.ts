import "server-only";

import { PUBLIC_REVALIDATE, SERVER_API_URL } from "@/lib/config";
import type {
  Paginated,
  Post,
  PublicTeacher,
  Ref,
  School,
  SearchResults,
  Stats,
  Suggestions,
  TeacherCard,
} from "@/lib/types";

/**
 * Appels à l'API PUBLIQUE depuis le serveur Next.js (Server Components, zone A).
 * Les réponses sont mises en cache 5 minutes et étiquetées : Laravel déclenche
 * une revalidation immédiate des étiquettes concernées quand un contenu change.
 */
async function getPublic<T>(path: string, tags: string[]): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(`${SERVER_API_URL}/public${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: PUBLIC_REVALIDATE, tags },
      // Empêche un backend injoignable de bloquer indéfiniment le rendu (build statique compris).
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { status: response.status, body: null };
    }
    return { status: response.status, body: (await response.json()) as T };
  } catch {
    // API injoignable : la page affiche un état vide plutôt que de planter.
    return { status: 503, body: null };
  }
}

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type TeacherLookup =
  | { kind: "found"; teacher: PublicTeacher }
  | { kind: "moved"; slug: string }
  | { kind: "missing" };

/** Profil public : trouvé, ancien identifiant (redirection 301) ou introuvable. */
export async function getTeacher(slug: string): Promise<TeacherLookup> {
  const { body } = await getPublic<{ data?: PublicTeacher; moved_to?: string }>(
    `/teachers/${encodeURIComponent(slug)}`,
    ["teachers", `teacher:${slug}`],
  );
  if (body?.moved_to) return { kind: "moved", slug: body.moved_to };
  if (body?.data) return { kind: "found", teacher: body.data };
  return { kind: "missing" };
}

export async function getTeachers(params: Record<string, string | number | undefined>) {
  const { body } = await getPublic<Paginated<TeacherCard>>(`/teachers${query(params)}`, ["teachers"]);
  return body ?? { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
}

export async function getTeacherPosts(slug: string, page = 1) {
  const { body } = await getPublic<Paginated<Post>>(`/teachers/${encodeURIComponent(slug)}/posts${query({ page })}`, [
    "posts",
    `teacher:${slug}`,
  ]);
  return body ?? { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
}

export async function getPosts(params: Record<string, string | number | undefined>) {
  const { body } = await getPublic<Paginated<Post>>(`/posts${query(params)}`, ["posts"]);
  return body ?? { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
}

export async function getPost(id: string) {
  const { body } = await getPublic<{ data: Post; others: Post[]; author_indexable: boolean }>(`/posts/${encodeURIComponent(id)}`, [
    "posts",
    `post:${id}`,
  ]);
  return body;
}

export async function searchAll(q: string, limit = 12) {
  const { body } = await getPublic<SearchResults>(`/search${query({ q, limit })}`, ["teachers", "posts"]);
  return body ?? { query: q, teachers: [], posts: [], totals: { teachers: 0, posts: 0 } };
}

export async function getStats(): Promise<Stats> {
  const { body } = await getPublic<{ data: Stats }>("/stats", ["stats"]);
  return body?.data ?? { teachers: 0, posts: 0, schools: 0, departments: 0 };
}

/** Écoles supérieures de la liste gérée par l'administration (filtres de l'annuaire). */
export async function getSchools(): Promise<School[]> {
  const { body } = await getPublic<{ data: School[] }>("/schools", ["references", "teachers"]);
  return body?.data ?? [];
}

/** Valeurs connues des champs libres « École supérieure » et « Département / Filière ». */
export async function getSuggestions(): Promise<Suggestions> {
  const { body } = await getPublic<{ data: Suggestions }>("/suggestions", ["references", "teachers"]);
  return body?.data ?? { schools: [], departments: [] };
}

export async function getGrades(): Promise<Ref[]> {
  const { body } = await getPublic<{ data: Ref[] }>("/grades", ["references"]);
  return body?.data ?? [];
}

export async function getCategories(): Promise<Ref[]> {
  const { body } = await getPublic<{ data: Ref[] }>("/categories", ["references"]);
  return body?.data ?? [];
}

export async function getSitemapEntries() {
  const { body } = await getPublic<{
    teachers: { slug: string; updated_at: string | null }[];
    posts: { id: number; updated_at: string | null }[];
  }>("/sitemap", ["teachers", "posts"]);
  return body ?? { teachers: [], posts: [] };
}
