import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/public/PostCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Field";
import { getCategories, getFaculties, getPosts, getStats } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Publications",
  description: "Actualités, articles, événements, annonces et travaux de recherche publiés par les enseignants de l’Université ZTF.",
  alternates: { canonical: `${SITE_URL}/publications` },
};

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
  const filters = { q: str(sp.q), category: str(sp.category), faculty: str(sp.faculty), department: str(sp.department), teacher: str(sp.teacher) };
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [categories, faculties, stats, result] = await Promise.all([
    getCategories(),
    getFaculties(),
    getStats(),
    getPosts({ ...filters, page, per_page: 10 }),
  ]);

  const departments = faculties.find((f) => f.slug === filters.faculty)?.departments ?? faculties.flatMap((f) => f.departments);
  const withCategory = (slug: string) => {
    const qs = new URLSearchParams(Object.entries({ ...filters, category: slug }).filter(([, v]) => v) as [string, string][]);
    return qs.toString() ? `/publications?${qs}` : "/publications";
  };

  return (
    <>
      <section className="hero-mesh text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Eyebrow light>Production des enseignants · accès libre</Eyebrow>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Publications</h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Actualités, articles, événements, annonces et travaux de recherche publiés par les enseignants de l’Université ZTF. Chaque
            publication est publique et partageable par un simple lien.
          </p>
          <p className="tnum mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
            <Icon name="feed" size={18} className="text-teal" /> {stats.posts} publication{stats.posts > 1 ? "s" : ""} en ligne
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Filtres */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          <form action="/publications" className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Icon name="tune" size={18} /> Filtrer les publications
            </h2>
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            <div>
              <label htmlFor="posts-q" className="mb-1 block text-xs font-semibold text-muted">Mot-clé</label>
              <div className="relative">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input id="posts-q" name="q" defaultValue={filters.q} placeholder="Rechercher…" className="h-11 w-full rounded-lg border border-line pl-10 pr-3 text-sm focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20" />
              </div>
            </div>
            <div>
              <label htmlFor="posts-faculty" className="mb-1 block text-xs font-semibold text-muted">Faculté</label>
              <Select id="posts-faculty" name="faculty" defaultValue={filters.faculty}>
                <option value="">Toutes les facultés</option>
                {faculties.map((f) => <option key={f.id} value={f.slug}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="posts-department" className="mb-1 block text-xs font-semibold text-muted">Département</label>
              <Select id="posts-department" name="department" defaultValue={filters.department}>
                <option value="">Tous les départements</option>
                {departments.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
              </Select>
            </div>
            {filters.teacher && (
              <p className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-xs">
                <span>Enseignant : <strong>{filters.teacher}</strong></span>
                <input type="hidden" name="teacher" value={filters.teacher} />
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy-soft">
                <Icon name="filter_list" size={18} /> Appliquer
              </button>
              <Link href="/publications" className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold text-navy hover:border-navy">
                Effacer
              </Link>
            </div>
          </form>

          <div className="rounded-2xl bg-navy p-5 text-white">
            <p className="text-sm font-semibold">Vous êtes enseignant à l’Université ZTF ?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">Publiez vos actualités et travaux, visibles par tous et partageables par un lien.</p>
            <ButtonLink href="/inscription" variant="accent" size="sm" className="mt-4">Demander un accès</ButtonLink>
          </div>
        </aside>

        {/* Fil */}
        <div className="space-y-5 lg:col-span-8 xl:col-span-9">
          <nav className="flex flex-wrap gap-2" aria-label="Catégories">
            <Link
              href={withCategory("")}
              className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition", !filters.category ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy")}
            >
              Tout le fil
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
            <EmptyState icon="feed" title="Aucune publication trouvée">
              Modifiez les filtres ou revenez plus tard.
            </EmptyState>
          )}

          <Pagination page={result.meta.current_page} lastPage={result.meta.last_page} total={result.meta.total} basePath="/publications" params={filters} label="publications" />
        </div>
      </div>
    </>
  );
}
