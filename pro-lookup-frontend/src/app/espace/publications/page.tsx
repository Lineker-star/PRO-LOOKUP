"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { postUrl } from "@/lib/config";
import { formatDateTime, POST_STATUS } from "@/lib/format";
import type { OwnedPost, PostStatus } from "@/lib/types";

type MyPosts = {
  data: OwnedPost[];
  meta: { current_page: number; last_page: number; total: number };
  counts: { all: number; draft: number; published: number; hidden: number };
};

export default function MyPostsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MyPosts />
    </Suspense>
  );
}

/** Mes publications : brouillons, publiées, masquées par l'administration (brief §7.3). */
function MyPosts() {
  const params = useSearchParams();
  const router = useRouter();
  const status = (params.get("statut") ?? "") as PostStatus | "";
  const page = Number(params.get("page")) || 1;
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const posts = useQuery({
    queryKey: ["my-posts", status, page],
    queryFn: () => api<MyPosts>("/me/posts", { query: { status, page, per_page: 15 } }),
  });

  const tabs: { id: PostStatus | ""; label: string; count?: number }[] = [
    { id: "", label: "Toutes", count: posts.data?.counts.all },
    { id: "published", label: "Publiées", count: posts.data?.counts.published },
    { id: "draft", label: "Brouillons", count: posts.data?.counts.draft },
    { id: "hidden", label: "Masquées", count: posts.data?.counts.hidden },
  ];

  const remove = async (id: number) => {
    setDeleting(true);
    try {
      await api(`/me/posts/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SpaceHeading
        eyebrow="Publications"
        title="Mes publications"
        lead="Toute publication publiée est visible par tout le monde, sans compte, et partageable par un lien."
        actions={<ButtonLink href="/espace/publications/nouvelle" variant="accent" icon="edit_square">Nouvelle publication</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={status === tab.id}
            onClick={() => router.push(tab.id ? `/espace/publications?statut=${tab.id}` : "/espace/publications")}
            className={clsx(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold",
              status === tab.id ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy",
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className={clsx("tnum rounded-full px-1.5 text-xs", status === tab.id ? "bg-white/20" : "bg-mist")}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {posts.isPending ? (
        <Spinner />
      ) : !posts.data || posts.data.data.length === 0 ? (
        <EmptyState
          icon="article"
          title={status ? "Aucune publication dans cette catégorie" : "Vous n’avez encore rien publié"}
          action={<ButtonLink href="/espace/publications/nouvelle" icon="add">Rédiger une publication</ButtonLink>}
        >
          Actualités, articles, événements, annonces ou travaux de recherche : partagez-les avec le monde entier.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {posts.data.data.map((post) => (
            <Card key={post.id} className={clsx("p-5", post.status === "hidden" && "border-danger/30")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={POST_STATUS[post.status].tone}>{POST_STATUS[post.status].label}</StatusBadge>
                    {post.category && <span className="text-xs font-semibold text-muted">{post.category.name}</span>}
                    <span className="text-xs text-muted">· modifiée le {formatDateTime(post.updated_at)}</span>
                  </div>
                  <h2 className="mt-2 font-bold text-navy">{post.title ?? "Publication sans titre"}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
                  {post.media.length > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                      <Icon name="attach_file" size={14} /> {post.media.length} média{post.media.length > 1 ? "s" : ""}
                    </p>
                  )}
                  {post.status === "hidden" && (
                    <Alert tone="danger" className="mt-3" title="Masquée par l’administration">
                      {post.hidden_reason ?? "Aucun motif précisé."} Vous pouvez la corriger ; seul un administrateur peut la rétablir.
                    </Alert>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {post.status === "published" && (
                    <>
                      <ButtonLink href={`/publications/${post.id}`} variant="ghost" size="sm" icon="visibility">Voir</ButtonLink>
                      <CopyLinkButton url={postUrl(post.id)} size="sm" label="Lien" />
                    </>
                  )}
                  <ButtonLink href={`/espace/publications/${post.id}/modifier`} variant="outline" size="sm" icon="edit">Modifier</ButtonLink>
                  {confirming === post.id ? (
                    <span className="flex items-center gap-2 rounded-lg bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">
                      Supprimer définitivement ?
                      <Button variant="danger" size="sm" loading={deleting} onClick={() => remove(post.id)}>Oui</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>Non</Button>
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" icon="delete" className="text-danger" onClick={() => setConfirming(post.id)}>Supprimer</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {posts.data.meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-muted">Page {page} sur {posts.data.meta.last_page}</span>
              <div className="flex gap-2">
                {page > 1 && <Link className="font-semibold text-teal-text" href={`/espace/publications?${new URLSearchParams({ ...(status ? { statut: status } : {}), page: String(page - 1) })}`}>Précédente</Link>}
                {page < posts.data.meta.last_page && <Link className="font-semibold text-teal-text" href={`/espace/publications?${new URLSearchParams({ ...(status ? { statut: status } : {}), page: String(page + 1) })}`}>Suivante</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
