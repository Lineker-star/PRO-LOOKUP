"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Pager, ReasonAction, SearchBar, StatusTabs, useDebounced } from "@/components/admin/AdminUi";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, Tag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { PUBLIC_API_URL } from "@/lib/config";
import { formatDateTime, POST_STATUS } from "@/lib/format";
import type { OwnedPost, Ref } from "@/lib/types";

type Response = { data: OwnedPost[]; meta: { current_page: number; last_page: number; total: number }; counts: { published: number; hidden: number } };

/** Modération des publications : masquer (motif obligatoire), rétablir, supprimer (brief §8). */
export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"" | "published" | "hidden">("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const q = useDebounced(search);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await (await fetch(`${PUBLIC_API_URL}/public/categories`)).json()).data as Ref[],
    staleTime: 600_000,
  });
  const list = useQuery({
    queryKey: ["admin", "posts", status, category, q, page],
    queryFn: () => api<Response>("/admin/posts", { query: { status, category, q, page } }),
    placeholderData: (prev) => prev,
  });

  const act = async (path: string, body?: Record<string, unknown>, method: "POST" | "DELETE" = "POST") => {
    const res = await api<{ message: string }>(path, { method, body });
    setMessage(res.message);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div className="space-y-5">
      <AdminHeading
        crumbs={[{ label: "Publications" }]}
        title="Publications"
        lead="Toutes les publications en ligne ou masquées. Les brouillons restent privés et n’apparaissent pas ici."
      />
      {message && <Alert tone="success">{message}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusTabs
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          tabs={[
            { id: "", label: "Toutes" },
            { id: "published", label: "Publiées", count: list.data?.counts.published },
            { id: "hidden", label: "Masquées", count: list.data?.counts.hidden, tone: "danger" },
          ]}
        />
        <div className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select aria-label="Catégorie" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">Toutes les catégories</option>
              {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Titre ou texte…" />
        </div>
      </div>

      {list.isPending ? (
        <Spinner />
      ) : !list.data || list.data.data.length === 0 ? (
        <EmptyState icon="article" title="Aucune publication">Aucune publication ne correspond à ces filtres.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {list.data.data.map((post) => (
              <li key={post.id} className={post.status === "hidden" ? "bg-danger-soft/30" : ""}>
                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={POST_STATUS[post.status].tone}>{POST_STATUS[post.status].label}</StatusBadge>
                      {post.category && <Tag>{post.category.name}</Tag>}
                      <span className="text-xs text-muted">{formatDateTime(post.published_at)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-navy">{post.title ?? "Publication sans titre"}</p>
                    <p className="line-clamp-2 text-sm text-muted">{post.excerpt}</p>
                    {post.author && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <Avatar src={post.author.avatar_url} name={post.author.full_name} size="xs" ring={false} />
                        {post.author.id ? <Link href={`/admin/enseignants/${post.author.id}`} className="font-semibold text-navy hover:underline">{post.author.full_name}</Link> : post.author.full_name}
                      </p>
                    )}
                    {post.status === "hidden" && post.hidden_reason && <p className="mt-2 text-xs font-semibold text-danger">Motif du masquage : « {post.hidden_reason} »</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {post.status === "published" && (
                      <a href={`/publications/${post.id}`} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-navy hover:bg-mist">
                        <Icon name="open_in_new" size={16} /> Voir
                      </a>
                    )}
                    <Button variant="subtle" size="sm" icon={expanded === post.id ? "expand_less" : "gavel"} onClick={() => setExpanded(expanded === post.id ? null : post.id)}>
                      {expanded === post.id ? "Fermer" : "Modérer"}
                    </Button>
                  </div>
                </div>

                {expanded === post.id && (
                  <div className="space-y-3 border-t border-line bg-canvas px-5 py-4">
                    <div className="prose-post max-h-60 overflow-y-auto rounded-lg border border-line bg-white p-4 text-sm" dangerouslySetInnerHTML={{ __html: post.content }} />
                    <div className="flex flex-wrap items-start gap-3">
                      {post.status === "published" ? (
                        <ReasonAction label="Masquer la publication" icon="visibility_off" confirmLabel="Masquer" description="Elle disparaît immédiatement des pages publiques ; l’auteur reçoit le motif." onConfirm={(reason) => act(`/admin/posts/${post.id}/hide`, { reason })} size="sm" />
                      ) : (
                        <ReasonAction label="Rétablir la publication" icon="visibility" tone="primary" requireReason={false} reasonLabel="" confirmLabel="Rétablir" description="Elle redevient visible publiquement." onConfirm={() => act(`/admin/posts/${post.id}/restore`)} size="sm" />
                      )}
                      <ReasonAction label="Supprimer définitivement" icon="delete_forever" confirmLabel="Supprimer" reasonLabel="Motif (journalisé)" description="Action irréversible." onConfirm={(reason) => act(`/admin/posts/${post.id}`, { reason }, "DELETE")} size="sm" />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Pager page={page} lastPage={list.data.meta.last_page} total={list.data.meta.total} onChange={setPage} label="publication(s)" />
        </Card>
      )}
    </div>
  );
}
