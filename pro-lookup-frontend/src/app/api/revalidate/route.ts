import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Signal de mise à jour envoyé par Laravel (brief §9.2) : quand un profil ou une publication
 * change, est masqué ou supprimé, les pages publiques en cache sont vidées immédiatement.
 * Protégé par un secret partagé (REVALIDATE_SECRET = FRONTEND_REVALIDATE_SECRET côté Laravel).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string").slice(0, 50) : [];

  // { expire: 0 } : le contenu périmé n'est plus jamais servi (suspension, masquage…).
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: tags, at: new Date().toISOString() });
}
