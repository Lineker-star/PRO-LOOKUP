/**
 * Bilinguisme FR / EN (brief §13). Le français est la langue par défaut.
 * La langue choisie est mémorisée dans le cookie `pl_lang`.
 * Ce dictionnaire couvre l'interface commune (en-tête, pied de page, actions,
 * titres des pages publiques) ; voir DECISIONS.md pour l'étendue de la traduction.
 */

export type Lang = "fr" | "en";

const fr = {
  nav_teachers: "Enseignants",
  nav_posts: "Publications",
  search_placeholder: "Rechercher un enseignant, une publication…",
  login: "Se connecter",
  request_access: "Demander un accès",
  publish: "Publier",
  my_space: "Mon espace",
  my_profile: "Mon profil",
  my_posts: "Mes publications",
  settings: "Paramètres",
  logout: "Se déconnecter",
  admin: "Administration",
  menu: "Menu",
  footer_tagline: "La vitrine professionnelle publique du corps enseignant de l’Université ZTF.",
  footer_explore: "Explorer",
  footer_teachers: "Espace enseignants",
  footer_legal: "Informations",
  privacy: "Politique de confidentialité",
  terms: "Conditions d’utilisation",
  rights: "Tous droits réservés.",
  home_eyebrow: "Université ZTF — Bertoua",
  home_title: "Découvrez les enseignants de l’Université ZTF",
  home_lead:
    "Parcours, domaines d’expertise, enseignements et travaux : chaque profil est vérifié par l’administration de l’université et consultable librement, partout dans le monde.",
  home_cta_directory: "Parcourir l’annuaire",
  home_cta_posts: "Lire les publications",
  stats_teachers: "Enseignants",
  stats_posts: "Publications",
  stats_faculties: "Facultés",
  stats_departments: "Départements",
  featured: "Enseignants à découvrir",
  latest_posts: "Dernières publications",
  see_all: "Tout voir",
  cta_title: "Vous êtes enseignant à l’Université ZTF ?",
  cta_text: "Demandez votre accès pour publier votre profil professionnel et partager vos travaux. Chaque demande est vérifiée par l’administration.",
  directory_title: "Annuaire des enseignants",
  posts_title: "Publications",
  search_title: "Recherche",
  copy_link: "Copier le lien",
  link_copied: "Lien copié",
  share: "Partager",
  more: "Plus…",
  report: "Signaler",
};

const en: typeof fr = {
  nav_teachers: "Faculty",
  nav_posts: "Posts",
  search_placeholder: "Search a teacher, a post…",
  login: "Sign in",
  request_access: "Request access",
  publish: "Post",
  my_space: "My space",
  my_profile: "My profile",
  my_posts: "My posts",
  settings: "Settings",
  logout: "Sign out",
  admin: "Administration",
  menu: "Menu",
  footer_tagline: "The public professional showcase of ZTF University’s teaching staff.",
  footer_explore: "Explore",
  footer_teachers: "For teachers",
  footer_legal: "Information",
  privacy: "Privacy policy",
  terms: "Terms of use",
  rights: "All rights reserved.",
  home_eyebrow: "ZTF University — Bertoua",
  home_title: "Meet the teachers of ZTF University",
  home_lead:
    "Background, expertise, courses and research: every profile is verified by the university administration and freely available worldwide.",
  home_cta_directory: "Browse the directory",
  home_cta_posts: "Read the posts",
  stats_teachers: "Teachers",
  stats_posts: "Posts",
  stats_faculties: "Faculties",
  stats_departments: "Departments",
  featured: "Teachers to discover",
  latest_posts: "Latest posts",
  see_all: "See all",
  cta_title: "Are you a teacher at ZTF University?",
  cta_text: "Request access to publish your professional profile and share your work. Every request is verified by the administration.",
  directory_title: "Faculty directory",
  posts_title: "Posts",
  search_title: "Search",
  copy_link: "Copy link",
  link_copied: "Link copied",
  share: "Share",
  more: "More…",
  report: "Report",
};

export const dictionaries = { fr, en };
export type Dict = typeof fr;

export function normalizeLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : "fr";
}
