import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** Les zones B (espace enseignant) et C (administration) ne sont jamais indexées. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/espace", "/admin", "/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/recherche", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
