import { NextResponse, type NextRequest } from "next/server";

/**
 * Gardes d'accès (brief §10) — elles améliorent la navigation mais ne protègent rien :
 * la sécurité reste assurée par l'API Laravel sur chaque requête.
 *
 *  - visiteur sur une route B ou C            → /connexion
 *  - enseignant non approuvé sur une route B  → /espace/en-attente
 *  - non-administrateur sur /admin            → page 403
 *  - administrateur sur /espace               → autorisé (il peut aussi enseigner et gérer son profil)
 *  - compte déjà connecté sur /connexion      → son espace
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("pl_token")?.value;
  const [role, status] = (request.cookies.get("pl_session")?.value ?? "").split(".");
  const isPrivate = pathname.startsWith("/espace") || pathname.startsWith("/admin");

  if (isPrivate && !token) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("depuis", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token && role !== "admin") {
    return NextResponse.rewrite(new URL("/acces-refuse", request.url), { status: 403 });
  }

  // Un administrateur peut aussi être enseignant : il accède à son espace (profil, publications).
  if (pathname.startsWith("/espace") && token) {
    if (status && status !== "approved" && !pathname.startsWith("/espace/en-attente") && pathname !== "/espace/profil") {
      return NextResponse.redirect(new URL("/espace/en-attente", request.url));
    }
  }

  if ((pathname === "/connexion" || pathname === "/inscription") && token && role) {
    const home = role === "admin" ? "/admin" : status === "approved" ? "/espace" : "/espace/en-attente";
    return NextResponse.redirect(new URL(home, request.url));
  }

  const response = NextResponse.next();
  // Les zones B et C ne sont jamais indexées (brief §12).
  if (isPrivate) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/espace/:path*", "/admin/:path*", "/connexion", "/inscription"],
};
