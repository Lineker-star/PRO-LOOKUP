import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/public/PostCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Field";
import { getCategories, getPosts, getSchools, getStats, getSuggestions } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { getDict, getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.posts_title,
    description: t.posts_meta,
    alternates: { canonical: `${SITE_URL}/publications` },
  };
}

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const categoryIcons: Record<string, string> = {
  actualite: "newspaper",
  article: "article",
  evenement: "event",
  annonce: "campaign",
  "travaux-de-recherche": "biotech",
};

/** Fil public de toutes les publications (zone A), du plus récent au plus ancien. */
export default async function PostsPage(props: PageProps<"/publications">) {
  const sp = await props.searchParams;
  const filters = {
    q: str(sp.q).trim(),
    category: str(sp.category),
    school: str(sp.school),
    department: str(sp.department).trim(),
    teacher: str(sp.teacher),
  };
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [{ t, p }, categories, schools, suggestions, stats, result] = await Promise.all([
    getI18n(),
    getCategories(),
    getSchools(),
    getSuggestions(),
    getStats(),
    getPosts({ ...filters, page, per_page: 10 }),
  ]);

  const withCategory = (slug: string) => {
    const qs = new URLSearchParams(Object.entries({ ...filters, category: slug }).filter(([, v]) => v) as [string, string][]);
    return qs.toString() ? `/publications?${qs}` : "/publications";
  };

  return (
    <>
      <section className="hero-mesh text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Eyebrow light>{t.posts_eyebrow}</Eyebrow>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.posts_title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{t.posts_lead}</p>
          <p className="tnum mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
            <Icon name="feed" size={18} className="text-teal" /> {p(t.posts_online, stats.posts)}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Filtres */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          <form action="/publications" className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Icon name="tune" size={18} /> {t.filter_posts}
            </h2>
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            <div>
              <label htmlFor="posts-q" className="mb-1 block text-xs font-semibold text-muted">
                {t.keyword} <span className="font-normal">({t.optional})</span>
              </label>
              <div className="relative">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input id="posts-q" name="q" defaultValue={filters.q} placeholder={t.search_short} className="h-11 w-full rounded-lg border border-line pl-10 pr-3 text-sm focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20" />
              </div>
            </div>
            <div>
              <label htmlFor="posts-school" className="mb-1 block text-xs font-semibold text-muted">{t.school}</label>
              <Select id="posts-school" name="school" defaultValue={filters.school}>
                <option value="">{t.all_schools}</option>
                {schools.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="posts-department" className="mb-1 block text-xs font-semibold text-muted">{t.department}</label>
              <input
                id="posts-department"
                name="department"
                list="posts-department-list"
                defaultValue={filters.department}
                placeholder={t.department_placeholder}
                className="h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
              />
              <datalist id="posts-department-list">
                {suggestions.departments.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            {filters.teacher && (
              <p className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-xs">
                <span>{t.teacher_label} : <strong>{filters.teacher}</strong></span>
                <input type="hidden" name="teacher" value={filters.teacher} />
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy-soft">
                <Icon name="filter_list" size={18} /> {t.apply}
              </button>
              <Link href="/publications" className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold text-navy hover:border-navy">
                {t.clear}
              </Link>
            </div>
          </form>

          <div className="rounded-2xl bg-navy p-5 text-white">
            <p className="text-sm font-semibold">{t.cta_title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">{t.posts_cta_text}</p>
            <ButtonLink href="/inscription" variant="accent" size="sm" icon="how_to_reg" className="mt-4">{t.register}</ButtonLink>
          </div>
        </aside>

        {/* Fil */}
        <div className="space-y-5 lg:col-span-8 xl:col-span-9">
          <nav className="flex flex-wrap gap-2" aria-label={t.categories}>
            <Link
              href={withCategory("")}
              className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition", !filters.category ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy")}
            >
              {t.all_feed}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={withCategory(c.slug)}
                aria-current={filters.category === c.slug ? "page" : undefined}
                className={clsx(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
                  filters.category === c.slug ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy",
                )}
              >
                <Icon name={categoryIcons[c.slug] ?? "label"} size={16} />
                {c.name}
              </Link>
            ))}
          </nav>

          {result.data.length > 0 ? (
            <div className="mx-auto max-w-3xl space-y-5 xl:mx-0">
              {result.data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState icon="feed" title={t.posts_empty_title}>
              {t.posts_empty_text}
            </EmptyState>
          )}

          <Pagination
            page={result.meta.current_page}
            lastPage={result.meta.last_page}
            summary={p(t.posts_count, result.meta.total)}
            basePath="/publications"
            params={filters}
            labels={t}
          />
        </div>
      </div>
    </>
  );
}
