import clsx from "clsx";
import type { ReactNode } from "react";
import { QrCodePanel } from "@/components/public/QrCodePanel";
import { Tag } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cvDownloadUrl } from "@/lib/config";
import { fileSizeIntl, formatDate, ITEM_SECTIONS, LINK_LABELS, orcidUrl } from "@/lib/format";
import { fmt, type Dict } from "@/lib/i18n";
import type { ItemSection, ProfileItem, PublicTeacher } from "@/lib/types";

/**
 * Sections publiques d'un profil, dans la langue choisie par le visiteur.
 * Les sections masquées par l'enseignant ne sont même pas renvoyées par l'API :
 * elles n'apparaissent donc jamais ici.
 */
export function SectionCard({ icon, title, children, className }: { icon: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-line bg-white p-6 shadow-card print:break-inside-avoid print:border-0 print:p-0 print:shadow-none", className)}>
      <h2 className="flex items-center gap-2 text-base font-bold text-navy">
        <Icon name={icon} size={20} className="text-teal-text" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Frise (diplômes, expériences) : période à gauche, intitulé et organisme à droite. */
export function ItemTimeline({ items }: { items: ProfileItem[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-teal ring-2 ring-teal/20" aria-hidden />
          {item.period && <p className="tnum text-xs font-bold uppercase tracking-wider text-teal-text">{item.period}</p>}
          <p className="font-semibold text-navy">{item.title}</p>
          {item.organization && <p className="text-sm text-muted">{item.organization}</p>}
          {item.description && <p className="mt-1 text-sm leading-relaxed text-ink/80">{item.description}</p>}
        </li>
      ))}
    </ol>
  );
}

function ItemList({ items, section, t }: { items: ProfileItem[]; section: ItemSection; t: Dict }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-navy">{item.title}</p>
            {item.period && <span className="tnum text-xs font-semibold text-muted">{item.period}</span>}
          </div>
          {(item.author || item.organization) && (
            <p className="text-sm text-muted">{[item.author, item.organization].filter(Boolean).join(" · ")}</p>
          )}
          {item.description && <p className="mt-1 text-sm leading-relaxed text-ink/80">{item.description}</p>}
          {item.url && (
            <a href={item.url.startsWith("http") ? item.url : `https://doi.org/${item.url}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-text hover:underline">
              <Icon name="link" size={14} />
              {section === "scientific_publication" ? t.link_doi : t.link}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Colonne principale : À propos, expertise, enseignements, parcours, expérience, recherche, distinctions. */
export function ProfileMainSections({ teacher, t }: { teacher: PublicTeacher; t: Dict }) {
  const { items } = teacher;
  const research = [...items.research_area, ...items.scientific_publication];
  const hasContent =
    teacher.bio || teacher.expertise_tags.length || items.course.length || items.education.length || items.experience.length || research.length || items.award.length;

  if (!hasContent) {
    return (
      <SectionCard icon="info" title={t.tab_profile}>
        <p className="text-sm text-muted">{t.profile_incomplete}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {teacher.bio && (
        <SectionCard icon="description" title={t.section_about}>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{teacher.bio}</p>
        </SectionCard>
      )}

      {teacher.expertise_tags.length > 0 && (
        <SectionCard icon="psychology" title={t.section_expertise}>
          <div className="flex flex-wrap gap-2">
            {teacher.expertise_tags.map((tag) => (
              <Tag key={tag} className="px-3 py-1.5 text-sm">
                <span className="mr-1.5 size-1.5 rounded-full bg-teal" aria-hidden />
                {tag}
              </Tag>
            ))}
          </div>
        </SectionCard>
      )}

      {items.course.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.course.icon} title={t.section_courses}>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.course.map((course) => (
              <div key={course.id} className="rounded-xl border border-line bg-canvas p-4">
                <p className="font-semibold text-navy">{course.title}</p>
                {course.organization && <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-teal-text">{course.organization}</p>}
                {course.description && <p className="mt-1.5 text-sm text-ink/80">{course.description}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {items.education.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.education.icon} title={t.section_education}>
          <ItemTimeline items={items.education} />
        </SectionCard>
      )}

      {items.experience.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.experience.icon} title={t.section_experience}>
          <ItemTimeline items={items.experience} />
        </SectionCard>
      )}

      {research.length > 0 && (
        <SectionCard icon="biotech" title={t.section_research}>
          {items.research_area.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t.research_areas}</h3>
              <div className="mt-2">
                <ItemList items={items.research_area} section="research_area" t={t} />
              </div>
            </div>
          )}
          {items.scientific_publication.length > 0 && (
            <div className={items.research_area.length ? "mt-6" : ""}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t.scientific_publications}</h3>
              <div className="mt-2">
                <ItemList items={items.scientific_publication} section="scientific_publication" t={t} />
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {items.award.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.award.icon} title={t.section_awards}>
          <ItemList items={items.award} section="award" t={t} />
        </SectionCard>
      )}
    </div>
  );
}

/** Colonne latérale : coordonnées publiques, liens, langues. */
export function ProfileSideSections({ teacher, url, t, locale }: { teacher: PublicTeacher; url: string; t: Dict; locale: string }) {
  const links = Object.entries(teacher.links).filter(([, v]) => Boolean(v)) as [string, string][];
  const { email, phone, office } = teacher.contacts;

  return (
    <div className="space-y-6">
      {teacher.cv && (
        <SectionCard icon="description" title={t.cv_title} className="print:hidden">
          <p className="text-sm text-muted">{fmt(t.cv_text, { name: teacher.full_name })}</p>
          <a
            href={cvDownloadUrl(teacher.slug)}
            download
            className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 transition hover:border-teal"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
              <Icon name="picture_as_pdf" size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy">{t.download_cv}</span>
              <span className="block text-xs text-muted">
                {["PDF", fileSizeIntl(teacher.cv.size, locale), teacher.cv.updated_at ? fmt(t.cv_updated, { date: formatDate(teacher.cv.updated_at, locale) }) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <Icon name="download" size={20} className="text-teal-text" />
          </a>
        </SectionCard>
      )}

      <SectionCard icon="contact_mail" title={t.contacts}>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2.5">
            <Icon name="link" size={18} className="mt-0.5 text-muted" />
            <a href={url} className="break-all font-medium text-teal-text hover:underline">{url.replace(/^https?:\/\//, "")}</a>
          </li>
          {email && (
            <li className="flex items-start gap-2.5">
              <Icon name="mail" size={18} className="mt-0.5 text-muted" />
              <a href={`mailto:${email}`} className="break-all text-ink hover:underline">{email}</a>
            </li>
          )}
          {phone && (
            <li className="flex items-start gap-2.5">
              <Icon name="call" size={18} className="mt-0.5 text-muted" />
              <span className="text-ink">{phone}</span>
            </li>
          )}
          {office && (
            <li className="flex items-start gap-2.5">
              <Icon name="meeting_room" size={18} className="mt-0.5 text-muted" />
              <span className="text-ink">{office}</span>
            </li>
          )}
        </ul>
      </SectionCard>

      <SectionCard icon="qr_code_2" title={t.qr_title}>
        <p className="mb-4 text-sm text-muted">{t.qr_subtitle}</p>
        <QrCodePanel
          url={url}
          fileName={`qr-${teacher.slug}`}
          labels={{ alt: t.qr_alt, png: t.qr_png, svg: t.qr_svg, hint: t.qr_hint }}
        />
      </SectionCard>

      {links.length > 0 && (
        <SectionCard icon="public" title={t.section_links}>
          <ul className="space-y-2">
            {links.map(([key, value]) => (
              <li key={key}>
                <a
                  href={key === "orcid" ? orcidUrl(value) : value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-navy hover:border-teal"
                >
                  <span className="flex items-center gap-2">
                    <Icon name={LINK_LABELS[key]?.icon ?? "link"} size={18} className="text-teal-text" />
                    {key === "website" ? t.personal_website : (LINK_LABELS[key]?.label ?? key)}
                  </span>
                  <Icon name="open_in_new" size={16} className="text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {teacher.items.language.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.language.icon} title={t.section_languages}>
          <ul className="space-y-2">
            {teacher.items.language.map((lang) => (
              <li key={lang.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy">{lang.title}</span>
                {lang.organization && <span className="text-muted">{lang.organization}</span>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="rounded-2xl bg-navy p-6 text-white print:hidden">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gold">
          <Icon name="verified_user" size={18} /> {t.verified_profile}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{t.verified_profile_text}</p>
      </div>
    </div>
  );
}
