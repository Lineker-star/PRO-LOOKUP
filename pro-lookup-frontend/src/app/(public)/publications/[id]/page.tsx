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
import { formatDate, formatDateTime } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/publications/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getPost(id);
  if (!result) return { title: "Publication indisponible", robots: { index: false } };

  const { data: post } = result;
  const title = post.title ?? `${post.excerpt.slice(0, 70)}…`;
  const description = `${post.excerpt.slice(0, 180)} — ${post.author?.full_name ?? ""} · Université ZTF`;
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
  const result = await getPost(id);
  if (!result) notFound();

  const { data: post, others } = result;
  const author = post.author;
  const url = postUrl(post.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Fil d’Ariane" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/publications" className="inline-flex items-center gap-1 hover:text-navy">
          <Icon name="feed" size={16} /> Publications
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
                <time dateTime={post.published_at ?? undefined}>Publiée le {formatDate(post.published_at)}</time>
                {post.edited_at && <span>· modifiée le {formatDateTime(post.edited_at)}</span>}
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
                    <span className="block text-xs text-muted">{[author.department?.name, "Université ZTF"].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              )}

              <div className="prose-post text-[16px] leading-relaxed text-ink/90" dangerouslySetInnerHTML={{ __html: post.content }} />

              {post.media.length > 0 && <PostMediaView media={post.media} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-4 sm:px-8">
              <p className="text-xs text-muted">Publication publique — partagez-la librement.</p>
              <div className="flex items-center gap-2">
                <CopyLinkButton url={url} size="sm" />
                <ShareMenu url={url} title={post.title ?? "Publication PRO-LOOKUP"} report={{ type: "post", id: post.id }} label="Plus…" />
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-6 lg:col-span-4">
          {author && (
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-text">À propos de l’auteur</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar src={author.avatar_url} name={author.full_name} size="md" />
                <div className="min-w-0">
                  <p className="font-bold text-navy">{author.full_name}</p>
                  {author.title && <p className="text-sm text-muted">{author.title}</p>}
                </div>
              </div>
              {author.grade && <GradeBadge name={author.grade.name} size="sm" className="mt-3" />}
              <p className="mt-3 text-sm text-muted">{[author.faculty?.name, author.department?.name].filter(Boolean).join(" · ")}</p>
              <ButtonLink href={`/in/${author.slug}`} variant="outline" full className="mt-5" iconRight="arrow_forward">
                Voir le profil complet
              </ButtonLink>
            </div>
          )}

          {others.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                <Icon name="auto_stories" size={18} className="text-teal-text" />
                Autres publications de l’auteur
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {others.map((other) => (
                  <li key={other.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/publications/${other.id}`} className="group block">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {other.category?.name} · {formatDate(other.published_at)}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-navy group-hover:underline">{other.title ?? other.excerpt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {author && (
                <Link href={`/in/${author.slug}?onglet=publications`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-text hover:underline">
                  Toutes ses publications <Icon name="arrow_forward" size={16} />
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
