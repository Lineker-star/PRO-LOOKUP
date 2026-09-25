import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/public/PostCard";
import { TeacherCard } from "@/components/public/TeacherCard";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { searchAll } from "@/lib/api/server";

export const metadata: Metadata = { title: "Recherche", robots: { index: false, follow: true } };

/** Résultats de recherche sur les enseignants et les publications (zone A). */
export default async function SearchPage(props: PageProps<"/recherche">) {
  const sp = await props.searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const results = q.length >= 2 ? await searchAll(q, 12) : null;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Eyebrow>Recherche publique</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Rechercher sur PRO-LOOKUP</h1>
          <form action="/recherche" role="search" className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <label htmlFor="search-q" className="sr-only">Termes recherchés</label>
              <input
                id="search-q"
                name="q"
                defaultValue={q}
                autoFocus={!q}
                placeholder="Nom d’un enseignant, domaine, mot-clé…"
                className="h-12 w-full rounded-xl border border-line bg-white pl-11 pr-3 text-base focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
              />
            </div>
            <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-soft">
              <Icon name="travel_explore" size={20} /> Rechercher
            </button>
          </form>
          {results && (
            <p className="mt-4 text-sm text-muted">
              <span className="tnum font-semibold text-navy">{results.totals.teachers + results.totals.posts}</span> résultat(s) pour « {q} » —{" "}
              {results.totals.teachers} enseignant(s), {results.totals.posts} publication(s)
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {!results && (
          <EmptyState icon="travel_explore" title="Que recherchez-vous ?">
            Saisissez au moins deux caractères : nom, prénom, domaine d’expertise ou mot-clé d’une publication.
          </EmptyState>
        )}

        {results && results.totals.teachers + results.totals.posts === 0 && (
          <EmptyState icon="search_off" title="Aucun résultat">
            Vérifiez l’orthographe ou essayez des termes plus généraux.
          </EmptyState>
        )}

        {results && results.teachers.length > 0 && (
          <section>
            <div className="flex items-end justify-between border-b border-line pb-3">
              <h2 className="text-lg font-bold text-navy">Enseignants ({results.totals.teachers})</h2>
              {results.totals.teachers > results.teachers.length && (
                <Link href={`/enseignants?q=${encodeURIComponent(q)}`} className="text-sm font-semibold text-teal-text hover:underline">
                  Voir tout dans l’annuaire
                </Link>
              )}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.teachers.map((t) => (
                <TeacherCard key={t.slug} teacher={t} />
              ))}
            </div>
          </section>
        )}

        {results && results.posts.length > 0 && (
          <section>
            <div className="flex items-end justify-between border-b border-line pb-3">
              <h2 className="text-lg font-bold text-navy">Publications ({results.totals.posts})</h2>
              {results.totals.posts > results.posts.length && (
                <Link href={`/publications?q=${encodeURIComponent(q)}`} className="text-sm font-semibold text-teal-text hover:underline">
                  Voir tout dans le fil
                </Link>
              )}
            </div>
            <div className="mt-5 space-y-5">
              {results.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
