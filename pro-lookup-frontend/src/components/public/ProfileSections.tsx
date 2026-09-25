import clsx from "clsx";
import type { ReactNode } from "react";
import { Tag } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ITEM_SECTIONS, LINK_LABELS, orcidUrl } from "@/lib/format";
import type { ItemSection, ProfileItem, PublicTeacher } from "@/lib/types";

/**
 * Sections publiques d'un profil. Les sections masquées par l'enseignant ne sont
 * même pas renvoyées par l'API : elles n'apparaissent donc jamais ici.
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

function ItemList({ items, section }: { items: ProfileItem[]; section: ItemSection }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-navy">{item.title}</p>
            {item.period && <span className="tnum text-xs font-semibold text-muted">{item.period}</span>}
          </div>
          {item.organization && <p className="text-sm text-muted">{item.organization}</p>}
          {item.description && <p className="mt-1 text-sm leading-relaxed text-ink/80">{item.description}</p>}
          {item.url && (
            <a href={item.url.startsWith("http") ? item.url : `https://doi.org/${item.url}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-text hover:underline">
              <Icon name="link" size={14} />
              {section === "scientific_publication" ? "Lien / DOI" : "Lien"}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Colonne principale : À propos, expertise, enseignements, parcours, expérience, recherche, distinctions. */
export function ProfileMainSections({ teacher }: { teacher: PublicTeacher }) {
  const { items } = teacher;
  const research = [...items.research_area, ...items.scientific_publication];
  const hasContent =
    teacher.bio || teacher.expertise_tags.length || items.course.length || items.education.length || items.experience.length || research.length || items.award.length;

  if (!hasContent) {
    return (
      <SectionCard icon="info" title="Profil">
        <p className="text-sm text-muted">Cet enseignant n’a pas encore complété les sections publiques de son profil.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {teacher.bio && (
        <SectionCard icon="description" title="À propos">
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{teacher.bio}</p>
        </SectionCard>
      )}

      {teacher.expertise_tags.length > 0 && (
        <SectionCard icon="psychology" title="Domaines d’expertise et spécialités">
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
        <SectionCard icon={ITEM_SECTIONS.course.icon} title={ITEM_SECTIONS.course.label}>
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
        <SectionCard icon={ITEM_SECTIONS.education.icon} title={ITEM_SECTIONS.education.label}>
          <ItemTimeline items={items.education} />
        </SectionCard>
      )}

      {items.experience.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.experience.icon} title={ITEM_SECTIONS.experience.label}>
          <ItemTimeline items={items.experience} />
        </SectionCard>
      )}

      {research.length > 0 && (
        <SectionCard icon="biotech" title="Recherche">
          {items.research_area.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Axes de recherche</h3>
              <div className="mt-2">
                <ItemList items={items.research_area} section="research_area" />
              </div>
            </div>
          )}
          {items.scientific_publication.length > 0 && (
            <div className={items.research_area.length ? "mt-6" : ""}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Publications scientifiques</h3>
              <div className="mt-2">
                <ItemList items={items.scientific_publication} section="scientific_publication" />
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {items.award.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.award.icon} title={ITEM_SECTIONS.award.label}>
          <ItemList items={items.award} section="award" />
        </SectionCard>
      )}
    </div>
  );
}

/** Colonne latérale : coordonnées publiques, liens, langues. */
export function ProfileSideSections({ teacher, url }: { teacher: PublicTeacher; url: string }) {
  const links = Object.entries(teacher.links).filter(([, v]) => Boolean(v)) as [string, string][];
  const { email, phone, office } = teacher.contacts;

  return (
    <div className="space-y-6">
      <SectionCard icon="contact_mail" title="Coordonnées">
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

      {links.length > 0 && (
        <SectionCard icon="public" title="Liens">
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
                    {LINK_LABELS[key]?.label ?? key}
                  </span>
                  <Icon name="open_in_new" size={16} className="text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {teacher.items.language.length > 0 && (
        <SectionCard icon={ITEM_SECTIONS.language.icon} title={ITEM_SECTIONS.language.label}>
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
          <Icon name="verified_user" size={18} /> Profil vérifié
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          Ce profil a été approuvé par l’administration de l’Université ZTF. Son contenu est publié et tenu à jour par l’enseignant.
        </p>
      </div>
    </div>
  );
}
