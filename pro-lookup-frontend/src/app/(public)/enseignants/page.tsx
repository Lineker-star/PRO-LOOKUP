import type { Metadata } from "next";
import { DirectoryFilters } from "@/components/public/DirectoryFilters";
import { TeacherCard } from "@/components/public/TeacherCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getGrades, getSchools, getStats, getSuggestions, getTeachers } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { getDict, getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.directory_title,
    description: t.directory_meta,
    alternates: { canonical: `${SITE_URL}/enseignants` },
  };
}

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Annuaire des enseignants (zone A) — maquette « classement général », sans hiérarchie de valeur. */
export default async function DirectoryPage(props: PageProps<"/enseignants">) {
  const sp = await props.searchParams;
  const filters = {
    q: str(sp.q).trim(),
    school: str(sp.school),
    department: str(sp.department).trim(),
    grade: str(sp.grade),
    expertise: str(sp.expertise).trim(),
    sort: str(sp.sort),
  };
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [{ t, p }, schools, grades, stats, suggestions, result] = await Promise.all([
    getI18n(),
    getSchools(),
    getGrades(),
    getStats(),
    getSuggestions(),
    getTeachers({ ...filters, page, per_page: 12 }),
  ]);

  const schoolName = schools.find((s) => s.slug === filters.school)?.name;
  const gradeName = grades.find((g) => g.slug === filters.grade)?.name;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-text">
                <Icon name="verified" size={14} /> {t.directory_badge}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{t.directory_title}</h1>
              <p className="mt-3 text-base leading-relaxed text-muted">{t.directory_lead}</p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { v: stats.teachers, l: t.stats_teachers, i: "groups" },
                { v: stats.schools, l: t.stats_schools, i: "account_balance" },
                { v: stats.departments, l: t.stats_departments, i: "apartment" },
              ].map((s) => (
                <div key={s.i} className="rounded-xl border border-line bg-canvas px-4 py-3">
                  <Icon name={s.i} size={18} className="text-teal-text" />
                  <dd className="tnum mt-1 text-2xl font-extrabold text-navy">{s.v}</dd>
                  <dt className="text-[11px] uppercase tracking-wider text-muted">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <DirectoryFilters schools={schools} grades={grades} departments={suggestions.departments} initial={filters} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Eyebrow>{schoolName ?? t.all_schools}</Eyebrow>
            <p className="mt-1 text-sm text-muted">
              <span className="tnum font-semibold text-navy">{p(t.teachers_count, result.meta.total)}</span>
              {filters.department ? ` · ${filters.department}` : ""}
              {gradeName ? ` · ${gradeName}` : ""}
              {filters.expertise ? ` · ${filters.expertise}` : ""}
              {filters.q ? ` · « ${filters.q} »` : ""}
            </p>
          </div>
        </div>

        {result.data.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.data.map((teacher) => (
              <TeacherCard key={teacher.slug} teacher={teacher} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="person_search"
            title={t.directory_empty_title}
            action={<ButtonLink href="/enseignants" variant="outline" icon="restart_alt">{t.reset_filters}</ButtonLink>}
          >
            {t.directory_empty_text}
          </EmptyState>
        )}

        <Pagination
          page={result.meta.current_page}
          lastPage={result.meta.last_page}
          summary={p(t.teachers_count, result.meta.total)}
          basePath="/enseignants"
          params={{ ...filters }}
          labels={t}
        />
      </section>
    </>
  );
}
