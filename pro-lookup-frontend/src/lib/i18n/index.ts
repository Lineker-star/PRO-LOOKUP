/**
 * Langues de l'interface publique (brief §13, étendu à 11 langues).
 * Le français est la langue par défaut ; le choix est mémorisé dans le cookie `pl_lang`.
 *
 * Étendue : toute la zone publique (en-tête, pied de page, accueil, annuaire, publications,
 * recherche, profil public, partage, signalement). L'espace enseignant et l'administration
 * restent en français (voir DECISIONS.md). Les contenus saisis par les enseignants ne sont
 * jamais traduits automatiquement.
 */
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { fr, type Dict, type Plural } from "@/lib/i18n/fr";
import { hi } from "@/lib/i18n/hi";
import { it } from "@/lib/i18n/it";
import { ja } from "@/lib/i18n/ja";
import { pt } from "@/lib/i18n/pt";
import { ru } from "@/lib/i18n/ru";
import { sw } from "@/lib/i18n/sw";
import { zh } from "@/lib/i18n/zh";

export type { Dict, Plural };

/** Ordre d'affichage du sélecteur : français, anglais, puis les autres langues. */
export const LANGS = {
  fr: { name: "Français", html: "fr", locale: "fr-FR" },
  en: { name: "English", html: "en", locale: "en-GB" },
  de: { name: "Deutsch", html: "de", locale: "de-DE" },
  es: { name: "Español", html: "es", locale: "es-ES" },
  pt: { name: "Português", html: "pt", locale: "pt-PT" },
  zh: { name: "中文（普通话）", html: "zh-Hans", locale: "zh-CN" },
  hi: { name: "हिन्दी", html: "hi", locale: "hi-IN" },
  ru: { name: "Русский", html: "ru", locale: "ru-RU" },
  ja: { name: "日本語", html: "ja", locale: "ja-JP" },
  it: { name: "Italiano", html: "it", locale: "it-IT" },
  sw: { name: "Kiswahili", html: "sw", locale: "sw-KE" },
} as const;

export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];

export const dictionaries: Record<Lang, Dict> = { fr, en, de, es, pt, zh, hi, ru, ja, it, sw };

export function normalizeLang(value: string | undefined | null): Lang {
  return value && value in LANGS ? (value as Lang) : "fr";
}

/** Remplace {n}, {name}… dans un libellé. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Accorde un libellé pluriel selon la langue (« 1 enseignant », « 3 enseignants », « 5 преподавателей »…). */
export function plural(lang: Lang, forms: Plural, n: number, vars: Record<string, string | number> = {}): string {
  const rule = new Intl.PluralRules(LANGS[lang].locale).select(n) as keyof Plural;
  const number = new Intl.NumberFormat(LANGS[lang].locale).format(n);
  return fmt(forms[rule] ?? forms.other, { ...vars, n: number });
}
