/* eslint-disable @next/next/no-img-element -- bannière servie par l'API Laravel */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PostCard } from "@/components/public/PostCard";
import { ProfileActions } from "@/components/public/ProfileActions";
import { ProfileMainSections, ProfileSideSections } from "@/components/public/ProfileSections";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getTeacher, getTeacherPosts } from "@/lib/api/server";
import { profileUrl } from "@/lib/config";
import { fmt } from "@/lib/i18n";
import { getDict, getI18n } from "@/lib/i18n-server";

/** Récupère le profil ou applique les règles d'URL : 301 pour un ancien identifiant, 404 sinon. */
async function loadTeacher(slug: string) {
  const result = await getTeacher(slug);
  if (result.kind === "moved") permanentRedirect(`/in/${result.slug}`);
  if (result.kind === "missing") notFound();
  return result.teacher;
}

/** Balises d'aperçu de lien (WhatsApp, Facebook, LinkedIn…) générées côté serveur (brief §6.5). */
export async function generateMetadata(props: PageProps<"/in/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [result, dict] = await Promise.all([getTeacher(slug), getDict()]);
  if (result.kind !== "found") return { title: dict.profile_unavailable, robots: { index: false } };

  const t = result.teacher;
  const headline = [t.grade?.name, t.department].filter(Boolean).join(", ");
  const title = `${t.full_name}${headline ? ` — ${headline}` : ""} · ${dict.university}`;
  const description = (t.bio ?? t.title ?? fmt(dict.teacher_at, { name: t.full_name })).slice(0, 200);
  const url = profileUrl(t.slug);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: t.search_indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "profile", url, title, description, firstName: t.first_name, lastName: t.last_name },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TeacherProfilePage(props: PageProps<"/in/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const [teacher, { t, p, locale }] = await Promise.all([loadTeacher(slug), getI18n()]);
  const url = profileUrl(teacher.slug);
  const tab = sp.onglet === "publications" ? "publications" : "profil";
  const page = Math.max(1, Number(sp.page) || 1);
  const posts = tab === "publications" ? await getTeacherPosts(teacher.slug, page) : null;

  return (
    <>
      {/* ------------------------------------------------------------ En-tête du profil */}
      <section className="relative overflow-hidden bg-navy text-white">
        {teacher.banner_url ? (
          <>
            <img src={teacher.banner_url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30" aria-hidden />
          </>
        ) : (
          <div className="hero-mesh absolute inset-0" aria-hidden />
        )}

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
            <Link href="/enseignants" className="inline-flex items-center gap-1 hover:text-white">
              <Icon name="groups" size={16} /> {t.directory_short}
            </Link>
            {teacher.school && (
              <>
                <Icon name="chevron_right" size={16} />
                <span>{teacher.school}</span>
              </>
            )}
            <Icon name="chevron_right" size={16} />
            <span className="font-semibold text-gold">{teacher.full_name}</span>
          </nav>

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar src={teacher.avatar_url} name={teacher.full_name} size="xl" className="ring-4 ring-offset-4 ring-offset-navy" />
                <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-navy bg-teal text-navy" title={t.verified_profile}>
                  <Icon name="check" size={18} />
                </span>
              </div>
              <div className="min-w-0">
                {teacher.grade && <GradeBadge name={teacher.grade.name} />}
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{teacher.full_name}</h1>
                {teacher.title && <p className="mt-1 text-base text-white/85">{teacher.title}</p>}
                <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                  {teacher.school && (
                    <li className="inline-flex items-center gap-1.5">
                      <Icon name="account_balance" size={16} />
                      <span className="sr-only">{t.school} : </span>
                      {teacher.school}
                    </li>
                  )}
                  {teacher.department && (
                    <li className="inline-flex items-center gap-1.5">
                      <Icon name="apartment" size={16} />
                      <span className="sr-only">{t.department} : </span>
                      {teacher.department}
                    </li>
                  )}
                  <li className="inline-flex items-center gap-1.5">
                    <Icon name="location_city" size={16} />
                    {t.university}
                  </li>
                </ul>
              </div>
            </div>
            <ProfileActions teacher={teacher} url={url} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Onglets */}
      <div className="sticky top-16 z-30 border-b border-line bg-white lg:top-[72px]">
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6 lg:px-8" aria-label={t.profile_sections}>
          {[
            { id: "profil", label: t.tab_profile, icon: "person", href: `/in/${teacher.slug}` },
            { id: "publications", label: t.tab_posts, icon: "feed", href: `/in/${teacher.slug}?onglet=publications`, count: teacher.posts_count },
          ].map((item) => (
            <Link
              key={item.id}
              href={item.href}
              scroll={false}
              aria-current={tab === item.id ? "page" : undefined}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${
                tab === item.id ? "border-teal text-navy" : "border-transparent text-muted hover:text-navy"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {item.count !== undefined && <span className="tnum rounded-full bg-mist px-2 py-0.5 text-xs text-navy">{item.count}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* ------------------------------------------------------------ Contenu */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-8">
          {tab === "profil" ? (
            <ProfileMainSections teacher={teacher} t={t} />
          ) : posts && posts.data.length > 0 ? (
            <div className="space-y-5">
              {posts.data.map((post) => (
                <PostCard key={post.id} post={post} showAuthor={false} />
              ))}
              <Pagination
                page={posts.meta.current_page}
                lastPage={posts.meta.last_page}
                summary={p(t.posts_count, posts.meta.total)}
                basePath={`/in/${teacher.slug}`}
                params={{ onglet: "publications" }}
                labels={t}
              />
            </div>
          ) : (
            <EmptyState icon="feed" title={t.no_posts_title}>
              {fmt(t.no_posts_text, { name: teacher.full_name })}
            </EmptyState>
          )}
        </div>
        <aside className="lg:col-span-4">
          <ProfileSideSections teacher={teacher} url={url} t={t} locale={locale} />
        </aside>
      </div>
    </>
  );
}
