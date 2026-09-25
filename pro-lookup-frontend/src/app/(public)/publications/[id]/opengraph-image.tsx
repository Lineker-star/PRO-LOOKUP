import { getPost } from "@/lib/api/server";
import { brandedOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Publication d’un enseignant de l’Université ZTF sur PRO-LOOKUP";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Aperçu d'une publication sans image : titre, auteur et logo (brief §9.3). */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPost(id);

  if (!result) {
    return brandedOgImage({ eyebrow: "Publications", title: "Les publications des enseignants de l’Université ZTF" });
  }

  const { data: post } = result;
  const title = post.title ?? (post.excerpt.length > 90 ? `${post.excerpt.slice(0, 90)}…` : post.excerpt);

  return brandedOgImage({
    eyebrow: post.category?.name ?? "Publication",
    title,
    subtitle: post.author ? `${post.author.full_name} · Université ZTF` : "Université ZTF",
  });
}
