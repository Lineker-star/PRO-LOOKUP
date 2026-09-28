"use client";

import Link from "next/link";
import { PostMediaView } from "@/components/public/PostMediaView";
import { ShareMenu } from "@/components/public/ShareMenu";
import { useLang } from "@/components/providers/LangProvider";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, Tag } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { postUrl } from "@/lib/config";
import { affiliation, formatDate, timeAgo } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import type { Post } from "@/lib/types";

/**
 * Publication dans le fil public (maquette « fil d'actualité », sans réactions ni
 * commentaires : brief §7.1). Le texte est tronqué, le détail est sur sa propre page.
 */
export function PostCard({ post, showAuthor = true }: { post: Post; showAuthor?: boolean }) {
  const { t, locale } = useLang();
  const author = post.author;

  return (
    <article className="rounded-2xl border border-line bg-white shadow-card">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {showAuthor && author ? (
            <Link href={`/in/${author.slug}`} className="group flex min-w-0 items-center gap-3">
              <Avatar src={author.avatar_url} name={author.full_name} size="sm" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-navy group-hover:underline">{author.full_name}</span>
                  {author.grade && <GradeBadge name={author.grade.name} size="sm" />}
                </span>
                <span className="block truncate text-xs text-muted">{affiliation(author) || t.university}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          <ShareMenu url={postUrl(post.id)} title={post.title ?? t.post_fallback_title} report={{ type: "post", id: post.id }} compact />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post.category && <Tag className="bg-teal-soft text-teal-text">{post.category.name}</Tag>}
          <time dateTime={post.published_at ?? undefined} title={formatDate(post.published_at, locale)} suppressHydrationWarning>
            {timeAgo(post.published_at, locale, t.just_now)}
          </time>
          {post.edited_at && <span>· {fmt(t.edited_on, { date: formatDate(post.edited_at, locale) })}</span>}
        </div>

        <Link href={`/publications/${post.id}`} className="block">
          {post.title && <h3 className="text-lg font-bold leading-snug text-navy hover:underline">{post.title}</h3>}
          <p className="mt-1.5 line-clamp-4 text-[15px] leading-relaxed text-ink/85">{post.excerpt}</p>
        </Link>

        {post.media.length > 0 && <PostMediaView media={post.media} compact />}
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3 sm:px-6">
        <Link href={`/publications/${post.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-text hover:underline">
          <Icon name="menu_book" size={18} />
          {t.read_post}
        </Link>
      </div>
    </article>
  );
}
