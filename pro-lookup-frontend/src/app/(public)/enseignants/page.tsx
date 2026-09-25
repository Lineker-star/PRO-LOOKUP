import type { Metadata } from "next";
import { DirectoryFilters } from "@/components/public/DirectoryFilters";
import { TeacherCard } from "@/components/public/TeacherCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getFaculties, getGrades, getStats, getTeachers } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Annuaire des enseignants",
  description: "Tous les enseignants approuvés de l’Université ZTF : recherche par nom, faculté, département, grade et domaine d’expertise.",
  alternates: { canonical: `${SITE_URL}/enseignants` },
};

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Annuaire des enseignants (zone A) — maquette « classement général », sans hiérarchie de valeur. */
export default async function DirectoryPage(props: PageProps<"/enseignants">) {
  const sp = await props.searchParams;
  const filters = {
    q: str(sp.q),
    faculty: str(sp.faculty),
    department: str(sp.department),
    grade: str(sp.grade),
    expertise: str(sp.expertise),
    sort: str(sp.sort),
  };
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [faculties, grades, stats, result] = await Promise.all([
    getFaculties(),
    getGrades(),
    getStats(),
    getTeachers({ ...filters, page, per_page: 12 }),
  ]);

  const facultyName = faculties.find((f) => f.slug === filters.faculty)?.name;
  const gradeName = grades.find((g) => g.slug === filters.grade)?.name;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-text">
                <Icon name="verified" size={14} /> Annuaire officiel · accès libre
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Annuaire des enseignants</h1>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Retrouvez les enseignants de l’Université ZTF, leurs rattachements et leurs domaines d’expertise. Le grade est une information :
                l’annuaire ne classe personne.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { v: stats.teachers, l: "Enseignants", i: "groups" },
                { v: stats.faculties, l: "Facultés", i: "account_balance" },
                { v: stats.departments, l: "Départements", i: "apartment" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-line bg-canvas px-4 py-3">
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
        <DirectoryFilters faculties={faculties} grades={grades} initial={filters} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Eyebrow>{facultyName ?? "Toutes les facultés"}</Eyebrow>
            <p className="mt-1 text-sm text-muted">
              <span className="tnum font-semibold text-navy">{result.meta.total}</span> enseignant{result.meta.total > 1 ? "s" : ""}
              {gradeName ? ` · grade ${gradeName}` : ""}
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
            title="Aucun enseignant ne correspond à ces critères"
            action={<ButtonLink href="/enseignants" variant="outline" icon="restart_alt">Réinitialiser les filtres</ButtonLink>}
          >
            Essayez un autre nom ou retirez un filtre.
          </EmptyState>
        )}

        <Pagination
          page={result.meta.current_page}
          lastPage={result.meta.last_page}
          total={result.meta.total}
          basePath="/enseignants"
          params={{ ...filters }}
          label="enseignants"
        />
      </section>
    </>
  );
}
