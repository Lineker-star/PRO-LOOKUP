"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PostEditor } from "@/components/space/PostEditor";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/Feedback";
import { api } from "@/lib/api/client";
import type { OwnedPost } from "@/lib/types";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = useQuery({ queryKey: ["my-post", id], queryFn: async () => (await api<{ data: OwnedPost }>(`/me/posts/${id}`)).data, retry: false });

  if (post.isPending) return <Spinner />;
  if (post.isError || !post.data) {
    return (
      <EmptyState icon="search_off" title="Publication introuvable" action={<ButtonLink href="/espace/publications">Mes publications</ButtonLink>}>
        Elle a peut-être été supprimée.
      </EmptyState>
    );
  }

  return (
    <div>
      <SpaceHeading eyebrow="Publications" title="Modifier la publication" lead="La mention « Modifiée le … » apparaîtra si la publication était déjà en ligne." />
      <PostEditor post={post.data} />
    </div>
  );
}
