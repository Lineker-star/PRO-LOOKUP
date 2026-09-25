import { getTeacher } from "@/lib/api/server";
import { initials } from "@/lib/format";
import { brandedOgImage, OG_SIZE, reachable } from "@/lib/og";

export const alt = "Profil d’un enseignant de l’Université ZTF sur PRO-LOOKUP";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Aperçu du profil : photo, nom, grade, département et logo (brief §6.5). */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getTeacher(slug);

  if (result.kind !== "found") {
    return brandedOgImage({ eyebrow: "Annuaire des enseignants", title: "Les enseignants de l’Université ZTF" });
  }

  const t = result.teacher;
  return brandedOgImage({
    eyebrow: "Profil enseignant",
    title: t.full_name,
    badge: t.grade?.name,
    subtitle: [t.department ? `Département ${t.department.name}` : null, "Université ZTF"].filter(Boolean).join(" · "),
    photo: await reachable(t.avatar_url),
    initials: initials(t.full_name),
  });
}
