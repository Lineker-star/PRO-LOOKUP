import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";

/** Plan du site : pages publiques + profils et publications indexables (brief §9.3, §12). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { teachers, posts } = await getSitemapEntries();

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/enseignants`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/publications`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/conditions`, changeFrequency: "yearly", priority: 0.2 },
    ...teachers.map((t) => ({
      url: `${SITE_URL}/in/${t.slug}`,
      lastModified: t.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/publications/${p.id}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
