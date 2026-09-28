import type { AccountStatus, ItemSection, PostStatus, VisibilitySection } from "@/lib/types";

/**
 * Dates : français par défaut (espace enseignant, administration) ; les pages publiques
 * passent la locale de la langue choisie par le visiteur.
 */
export function formatDate(iso: string | null | undefined, locale = "fr-FR"): string {
  return iso ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";
}

export function formatDateTime(iso: string | null | undefined, locale = "fr-FR"): string {
  return iso
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
    : "";
}

/** « il y a 3 heures », « il y a 2 jours »… puis date complète au-delà d'un mois. */
export function timeAgo(iso: string | null | undefined, locale = "fr-FR", justNow = "à l’instant"): string {
  if (!iso) return "";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (seconds < 60) return justNow;
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
  if (seconds < 86400 * 30) return rtf.format(-Math.floor(seconds / 86400), "day");
  return formatDate(iso, locale);
}

/** « Informatique · École Supérieure des Sciences… » : rattachement libre saisi par l'enseignant. */
export function affiliation(teacher: { school?: string | null; department?: string | null }, ...extra: (string | null | undefined)[]): string {
  return [teacher.department, teacher.school, ...extra].filter(Boolean).join(" · ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Taille de fichier dans la langue du visiteur (« 1,2 Mo », « 1.2 MB », « 1,2 МБ »…). */
export function fileSizeIntl(bytes: number | null | undefined, locale = "fr-FR"): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024
    ? new Intl.NumberFormat(locale, { style: "unit", unit: "kilobyte", unitDisplay: "short", maximumFractionDigits: 0 }).format(kb)
    : new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", unitDisplay: "short", maximumFractionDigits: 1 }).format(kb / 1024);
}

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  pending: { label: "En attente", tone: "warning" },
  approved: { label: "Approuvé", tone: "success" },
  rejected: { label: "Refusé", tone: "danger" },
  suspended: { label: "Suspendu", tone: "danger" },
};

export const POST_STATUS: Record<PostStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  published: { label: "Publiée", tone: "success" },
  hidden: { label: "Masquée", tone: "danger" },
};

/** Libellés et icônes des sections répétables du profil. */
export const ITEM_SECTIONS: Record<ItemSection, { label: string; icon: string; add: string; orgLabel: string; periodLabel: string }> = {
  course: { label: "Enseignements", icon: "co_present", add: "Ajouter un cours", orgLabel: "Niveau / filière", periodLabel: "Période" },
  education: { label: "Parcours académique", icon: "school", add: "Ajouter un diplôme", orgLabel: "Établissement", periodLabel: "Année" },
  experience: { label: "Expérience professionnelle", icon: "work", add: "Ajouter une expérience", orgLabel: "Organisme", periodLabel: "Période" },
  research_area: { label: "Axes de recherche", icon: "biotech", add: "Ajouter un axe de recherche", orgLabel: "Laboratoire / équipe", periodLabel: "Période" },
  scientific_publication: { label: "Publications scientifiques", icon: "menu_book", add: "Ajouter une publication scientifique", orgLabel: "Revue / éditeur", periodLabel: "Année" },
  award: { label: "Distinctions et prix", icon: "workspace_premium", add: "Ajouter une distinction", orgLabel: "Décernée par", periodLabel: "Année" },
  language: { label: "Langues", icon: "translate", add: "Ajouter une langue", orgLabel: "Niveau", periodLabel: "" },
};

export const VISIBILITY_SECTIONS: Record<VisibilitySection, string> = {
  about: "À propos (biographie)",
  expertise: "Domaines d’expertise et spécialités",
  courses: "Enseignements",
  education: "Parcours académique",
  experience: "Expérience professionnelle",
  research: "Recherche et publications scientifiques",
  awards: "Distinctions et prix",
  languages: "Langues",
  links: "Liens (ORCID, Google Scholar…)",
  cv: "CV en PDF (bouton « Télécharger le CV »)",
};

export const REPORT_REASONS: Record<string, string> = {
  inappropriate: "Contenu inapproprié",
  false_information: "Informations fausses",
  spam: "Spam ou publicité",
  copyright: "Atteinte aux droits d’auteur",
  harassment: "Harcèlement ou propos offensants",
  other: "Autre motif",
};

export const LINK_LABELS: Record<string, { label: string; icon: string }> = {
  orcid: { label: "ORCID", icon: "fingerprint" },
  google_scholar: { label: "Google Scholar", icon: "school" },
  researchgate: { label: "ResearchGate", icon: "science" },
  linkedin: { label: "LinkedIn", icon: "work" },
  website: { label: "Site personnel", icon: "language" },
};

/** Lien ORCID complet à partir d'un identifiant ou d'une URL. */
export function orcidUrl(value: string): string {
  return value.startsWith("http") ? value : `https://orcid.org/${value}`;
}
