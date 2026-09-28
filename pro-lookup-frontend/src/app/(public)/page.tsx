import Link from "next/link";
import { PostCard } from "@/components/public/PostCard";
import { TeacherCard } from "@/components/public/TeacherCard";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Field";
import { getGrades, getPosts, getSchools, getStats, getTeachers } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { getI18n } from "@/lib/i18n-server";

export const metadata = {
  alternates: { canonical: SITE_URL },
};

/** Accueil public (zone A) — maquette « accueil public desktop ZTF ». */
export default async function HomePage() {
  const [{ t, p }, stats, schools, grades, teachersPage, postsPage] = await Promise.all([
    getI18n(),
    getStats(),
    getSchools(),
    getGrades(),
    getTeachers({ per_page: 24 }),
    getPosts({ per_page: 3 }),
  ]);

  // Enseignants mis en avant : les profils les plus actifs, avec photo de préférence.
  const featured = [...teachersPage.data]
    .sort((a, b) => Number(Boolean(b.avatar_url)) - Number(Boolean(a.avatar_url)) || (b.posts_count ?? 0) - (a.posts_count ?? 0))
    .slice(0, 4);

  const figures = [
    { value: stats.teachers, label: t.stats_teachers, icon: "groups" },
    { value: stats.posts, label: t.stats_posts, icon: "feed" },
    { value: stats.schools, label: t.stats_schools, icon: "account_balance" },
    { value: stats.departments, label: t.stats_departments, icon: "apartment" },
  ];

  const steps = [
    { icon: "app_registration", title: t.how_step1_title, text: t.how_step1_text },
    { icon: "fact_check", title: t.how_step2_title, text: t.how_step2_text },
    { icon: "public", title: t.how_step3_title, text: t.how_step3_text },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- Bandeau institutionnel */}
      <section className="hero-mesh relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-32 lg:pt-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
              <span className="size-1.5 rounded-full bg-teal" aria-hidden />
              {t.home_eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">{t.home_title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.home_lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/enseignants" variant="accent" size="lg" icon="person_search">
                {t.home_cta_directory}
              </ButtonLink>
              <ButtonLink href="/publications" variant="light" size="lg" icon="feed" className="bg-white/10 text-white hover:bg-white/20">
                {t.home_cta_posts}
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{t.key_figures}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-navy">
                  <Icon name="verified" size={14} /> {t.verified_profiles}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {figures.map((f) => (
                  <div key={f.label} className="rounded-xl border border-white/10 bg-navy-deep/40 p-4">
                    <Icon name={f.icon} size={20} className="text-teal" />
                    <dd className="tnum mt-2 text-3xl font-extrabold">{f.value}</dd>
                    <dt className="mt-0.5 text-xs uppercase tracking-wider text-white/60">{f.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/60">
                <Icon name="verified_user" size={16} className="shrink-0 text-teal" />
                {t.verified_note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Recherche (texte facultatif) */}
      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
        <form action="/enseignants" className="rounded-2xl border border-line bg-white p-5 shadow-float sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <Icon name="manage_search" size={22} className="text-teal-text" />
              {t.home_search_title}
            </h2>
            <span className="text-xs text-muted">{t.home_search_free}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label htmlFor="home-q" className="mb-1 block text-xs font-semibold text-muted">
                {t.search_field_label} <span className="font-normal">({t.optional})</span>
              </label>
              <div className="relative">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="home-q"
                  name="q"
                  placeholder={t.home_search_placeholder}
                  aria-describedby="home-q-hint"
                  className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm placeholder:text-muted focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="home-school" className="mb-1 block text-xs font-semibold text-muted">
                {t.school}
              </label>
              <Select id="home-school" name="school" defaultValue="">
                <option value="">{t.all_schools}</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="home-grade" className="mb-1 block text-xs font-semibold text-muted">
                {t.grade}
              </label>
              <Select id="home-grade" name="grade" defaultValue="">
                <option value="">{t.all_grades}</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end md:col-span-2">
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-soft">
                <Icon name="search" size={20} />
                {t.search_submit}
              </button>
            </div>
          </div>
          <p id="home-q-hint" className="mt-3 flex items-start gap-2 text-xs text-muted">
            <Icon name="info" size={16} className="shrink-0 text-teal-text" />
            {t.search_optional_hint}
          </p>
        </form>
      </section>

      {/* ---------------------------------------------------------------- Écoles supérieures */}
      {schools.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={t.schools_eyebrow} title={t.schools_title} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {schools.map((school, i) => (
              <Link
                key={school.id}
                href={`/enseignants?school=${school.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal hover:shadow-raised"
              >
                <span className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-mist text-navy group-hover:bg-teal-soft group-hover:text-teal-text">
                    <Icon name={["science", "engineering", "trending_up", "menu_book"][i % 4]} size={24} />
                  </span>
                  <span className="tnum text-xs font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="mt-4 text-base font-bold leading-snug text-navy">{school.name}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-teal-text">
                  {p(t.teachers_count, school.teachers_count)}
                  <Icon name="chevron_right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Enseignants mis en avant */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={t.featured_eyebrow} title={t.featured} href="/enseignants" linkLabel={t.see_all} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((teacher) => (
              <TeacherCard key={teacher.slug} teacher={teacher} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Dernières publications */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.latest_eyebrow} title={t.latest_posts} href="/publications" linkLabel={t.see_all} />
        {postsPage.data.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {postsPage.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">{t.no_posts_yet}</p>
        )}
      </section>

      {/* ---------------------------------------------------------------- Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>{t.how_eyebrow}</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-3xl">{t.how_title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.how_text}</p>
              <ButtonLink href="/inscription" variant="primary" icon="how_to_reg" className="mt-6">
                {t.register}
              </ButtonLink>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
              {steps.map((step, i) => (
                <li key={step.icon} className="relative rounded-2xl border border-line bg-canvas p-5">
                  <span className="tnum absolute right-4 top-4 text-3xl font-extrabold text-line">0{i + 1}</span>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-white">
                    <Icon name={step.icon} size={22} />
                  </span>
                  <h3 className="mt-4 font-bold text-navy">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="hero-mesh flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl p-8 text-white sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.cta_title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">{t.cta_text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/inscription" variant="accent" size="lg" icon="how_to_reg">
              {t.register}
            </ButtonLink>
            <ButtonLink href="/connexion" variant="light" size="lg" icon="login" className="bg-white/10 text-white hover:bg-white/20">
              {t.login}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-text hover:underline">
          {linkLabel}
          <Icon name="arrow_forward" size={18} />
        </Link>
      )}
    </div>
  );
}
