import type { Me } from "@/lib/types";

/**
 * Règles d'affichage liées au rôle (confort uniquement : l'API Laravel reste seule juge).
 *
 * Un administrateur peut aussi être enseignant (`teaches`) : il a alors un profil public,
 * qui ne mentionne jamais son rôle, et peut publier comme tout enseignant approuvé.
 */
export function isAdmin(me: Me | null | undefined): boolean {
  return me?.role === "admin";
}

/** Compte dont le profil enseignant est (ou sera) public. */
export function hasTeacherProfile(me: Me | null | undefined): boolean {
  return Boolean(me && (me.role === "teacher" || me.teaches));
}

/** Peut publier : compte approuvé avec un profil enseignant. */
export function canPublish(me: Me | null | undefined): boolean {
  return Boolean(me && me.status === "approved" && hasTeacherProfile(me));
}
