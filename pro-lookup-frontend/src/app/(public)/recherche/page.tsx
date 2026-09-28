import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/public/PostCard";
import { TeacherCard } from "@/components/public/TeacherCard";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { searchAll } from "@/lib/api/server";
import { getDict, getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.search_title, robots: { index: false, follow: true } };
}

/** Résultats de recherche sur les enseignants et les publications (zone A). */
export default async function SearchPage(props: PageProps<"/recherche">) {
  const sp = await props.searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const [{ t, p }, results] = await Promise.all([getI18n(), q.length >= 2 ? searchAll(q, 12) : Promise.resolve(null)]);
  const total = results ? results.totals.teachers + results.totals.posts : 0;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Eyebrow>{t.search_eyebrow}</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">{t.search_page_title}</h1>
          <form action="/recherche" role="search" className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <label htmlFor="search-q" className="sr-only">{t.search_terms}</label>
              <input
                id="search-q"
                name="q"
                defaultValue={q}
                autoFocus={!q}
                placeholder={t.search_page_placeholder}
                className="h-12 w-full rounded-xl border border-line bg-white pl-11 pr-3 text-base focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
              />
            </div>
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-soft">
              <Icon name="travel_explore" size={20} /> {t.search_submit}
            </button>
          </form>
          {results && (
            <p className="mt-4 text-sm text-muted">
              {p(t.results_for, total, { q })} — {p(t.teachers_count, results.totals.teachers)}, {p(t.posts_count, results.totals.posts)}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {!results && (
          <EmptyState icon="travel_explore" title={t.what_search}>
            {t.search_min}
          </EmptyState>
        )}

        {results && total === 0 && (
          <EmptyState icon="search_off" title={t.no_results}>
            {t.no_results_text}
          </EmptyState>
        )}

        {results && results.teachers.length > 0 && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-lg font-bold text-navy">{t.nav_teachers} ({results.totals.teachers})</h2>
              {results.totals.teachers > results.teachers.length && (
                <Link href={`/enseignants?q=${encodeURIComponent(q)}`} className="text-sm font-semibold text-teal-text hover:underline">
                  {t.see_all_directory}
                </Link>
              )}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.teachers.map((teacher) => (
                <TeacherCard key={teacher.slug} teacher={teacher} />
              ))}
            </div>
          </section>
        )}

        {results && results.posts.length > 0 && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-lg font-bold text-navy">{t.nav_posts} ({results.totals.posts})</h2>
              {results.totals.posts > results.posts.length && (
                <Link href={`/publications?q=${encodeURIComponent(q)}`} className="text-sm font-semibold text-teal-text hover:underline">
                  {t.see_all_feed}
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
