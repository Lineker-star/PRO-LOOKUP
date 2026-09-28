import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { PostMediaView } from "@/components/public/PostMediaView";
import { ShareMenu } from "@/components/public/ShareMenu";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, Tag } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getPost } from "@/lib/api/server";
import { postUrl } from "@/lib/config";
import { affiliation, formatDate, formatDateTime } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { getDict, getI18n } from "@/lib/i18n-server";

export async function generateMetadata(props: PageProps<"/publications/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [result, t] = await Promise.all([getPost(id), getDict()]);
  if (!result) return { title: t.post_unavailable, robots: { index: false } };

  const { data: post } = result;
  const title = post.title ?? `${post.excerpt.slice(0, 70)}…`;
  const description = `${post.excerpt.slice(0, 180)} — ${post.author?.full_name ?? ""} · ${t.university}`;
  const images = post.media.filter((m) => m.type === "image" && m.url).map((m) => ({ url: m.url!, alt: m.alt ?? title }));

  return {
    title,
    description,
    alternates: { canonical: postUrl(post.id) },
    robots: result.author_indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "article",
      url: postUrl(post.id),
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.edited_at ?? undefined,
      authors: post.author ? [post.author.full_name] : undefined,
      // Première image de la publication ; à défaut, l'image générée par opengraph-image.tsx.
      ...(images.length ? { images: [images[0]] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Détail d'une publication (zone A) : contenu complet, carte de l'auteur, autres publications. */
export default async function PostPage(props: PageProps<"/publications/[id]">) {
  const { id } = await props.params;
  const [result, { t, locale }] = await Promise.all([getPost(id), getI18n()]);
  if (!result) notFound();

  const { data: post, others } = result;
  const author = post.author;
  const url = postUrl(post.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label={t.breadcrumb} className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/publications" className="inline-flex items-center gap-1 hover:text-navy">
          <Icon name="feed" size={16} /> {t.posts_title}
        </Link>
        {post.category && (
          <>
            <Icon name="chevron_right" size={16} />
            <Link href={`/publications?category=${post.category.slug}`} className="hover:text-navy">{post.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" aria-hidden />
            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {post.category && <Tag className="bg-teal-soft text-teal-text">{post.category.name}</Tag>}
                <time dateTime={post.published_at ?? undefined}>{fmt(t.published_on, { date: formatDate(post.published_at, locale) })}</time>
                {post.edited_at && <span>· {fmt(t.edited_on, { date: formatDateTime(post.edited_at, locale) })}</span>}
              </div>

              {post.title && <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">{post.title}</h1>}

              {author && (
                <Link href={`/in/${author.slug}`} className="group flex items-center gap-3">
                  <Avatar src={author.avatar_url} name={author.full_name} size="sm" />
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-navy group-hover:underline">{author.full_name}</span>
                      {author.grade && <GradeBadge name={author.grade.name} size="sm" />}
                    </span>
                    <span className="block text-xs text-muted">{affiliation(author) || t.university}</span>
                  </span>
                </Link>
              )}

              <div className="prose-post text-[16px] leading-relaxed text-ink/90" dangerouslySetInnerHTML={{ __html: post.content }} />

              {post.media.length > 0 && <PostMediaView media={post.media} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-4 sm:px-8">
              <p className="text-xs text-muted">{t.public_post_note}</p>
              <div className="flex items-center gap-2">
                <CopyLinkButton url={url} size="sm" label={t.copy_link} copiedLabel={t.link_copied} />
                <ShareMenu url={url} title={post.title ?? t.post_fallback_title} report={{ type: "post", id: post.id }} />
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-6 lg:col-span-4">
          {author && (
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-text">{t.about_author}</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar src={author.avatar_url} name={author.full_name} size="md" />
                <div className="min-w-0">
                  <p className="font-bold text-navy">{author.full_name}</p>
                  {author.title && <p className="text-sm text-muted">{author.title}</p>}
                </div>
              </div>
              {author.grade && <GradeBadge name={author.grade.name} size="sm" className="mt-3" />}
              {(author.school || author.department) && (
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {author.school && <li className="flex items-start gap-2"><Icon name="account_balance" size={16} className="mt-0.5" />{author.school}</li>}
                  {author.department && <li className="flex items-start gap-2"><Icon name="apartment" size={16} className="mt-0.5" />{author.department}</li>}
                </ul>
              )}
              <ButtonLink href={`/in/${author.slug}`} variant="outline" full className="mt-5" iconRight="arrow_forward">
                {t.see_full_profile}
              </ButtonLink>
            </div>
          )}

          {others.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                <Icon name="auto_stories" size={18} className="text-teal-text" />
                {t.other_posts}
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {others.map((other) => (
                  <li key={other.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/publications/${other.id}`} className="group block">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {[other.category?.name, formatDate(other.published_at, locale)].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-navy group-hover:underline">{other.title ?? other.excerpt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {author && (
                <Link href={`/in/${author.slug}?onglet=publications`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-text hover:underline">
                  {t.all_their_posts} <Icon name="arrow_forward" size={16} />
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
