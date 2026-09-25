/* eslint-disable @next/next/no-img-element -- document d'impression */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import QRCode from "qrcode";
import { PrintToolbar } from "@/components/public/PrintToolbar";
import { ItemTimeline } from "@/components/public/ProfileSections";
import { Avatar } from "@/components/ui/Avatar";
import { getTeacher } from "@/lib/api/server";
import { profileUrl } from "@/lib/config";
import { formatDate, ITEM_SECTIONS, LINK_LABELS, orcidUrl } from "@/lib/format";
import type { ProfileItem } from "@/lib/types";

export const metadata: Metadata = { title: "Profil (PDF)", robots: { index: false, follow: false } };

/**
 * Version imprimable du profil (mise en page CV). Elle est construite à partir de l'API
 * PUBLIQUE : seules les sections et coordonnées rendues publiques y figurent (brief §6.5).
 */
export default async function ProfilePdfPage(props: PageProps<"/in/[slug]/pdf">) {
  const { slug } = await props.params;
  const result = await getTeacher(slug);
  if (result.kind === "moved") permanentRedirect(`/in/${result.slug}/pdf`);
  if (result.kind === "missing") notFound();

  const t = result.teacher;
  const url = profileUrl(t.slug);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#0A2540", light: "#FFFFFF" } });
  const links = Object.entries(t.links).filter(([, v]) => Boolean(v)) as [string, string][];
  const research = [...t.items.research_area, ...t.items.scientific_publication];

  return (
    <div className="min-h-full bg-canvas print:bg-white">
      <PrintToolbar backHref={`/in/${t.slug}`} />

      <article className="mx-auto my-8 max-w-4xl bg-white p-10 shadow-raised print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-navy pb-6">
          <div className="flex items-center gap-5">
            <Avatar src={t.avatar_url} name={t.full_name} size="lg" />
            <div>
              <h1 className="text-3xl font-extrabold text-navy">{t.full_name}</h1>
              {t.title && <p className="text-base text-ink/80">{t.title}</p>}
              <p className="mt-1 text-sm text-muted">
                {[t.grade?.name, t.department ? `Département ${t.department.name}` : null, t.faculty?.name].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-lg font-extrabold text-navy">PRO-LOOKUP</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Université ZTF — Bertoua</p>
            </div>
            <Image src="/logo/pro-lookup-symbole.png" alt="" width={48} height={48} />
          </div>
        </header>

        <div className="mt-8 grid gap-8 md:grid-cols-3 print:grid-cols-3">
          <div className="space-y-8 md:col-span-2 print:col-span-2">
            {t.bio && (
              <PdfSection title="À propos">
                <p className="whitespace-pre-line text-sm leading-relaxed">{t.bio}</p>
              </PdfSection>
            )}
            {t.items.experience.length > 0 && (
              <PdfSection title={ITEM_SECTIONS.experience.label}>
                <ItemTimeline items={t.items.experience} />
              </PdfSection>
            )}
            {t.items.education.length > 0 && (
              <PdfSection title={ITEM_SECTIONS.education.label}>
                <ItemTimeline items={t.items.education} />
              </PdfSection>
            )}
            {t.items.course.length > 0 && (
              <PdfSection title={ITEM_SECTIONS.course.label}>
                <PlainList items={t.items.course} />
              </PdfSection>
            )}
            {research.length > 0 && (
              <PdfSection title="Recherche">
                <PlainList items={research} />
              </PdfSection>
            )}
            {t.items.award.length > 0 && (
              <PdfSection title={ITEM_SECTIONS.award.label}>
                <PlainList items={t.items.award} />
              </PdfSection>
            )}
          </div>

          <aside className="space-y-8">
            <PdfSection title="Coordonnées">
              <ul className="space-y-1.5 text-sm">
                {t.contacts.email && <li>{t.contacts.email}</li>}
                {t.contacts.phone && <li>{t.contacts.phone}</li>}
                {t.contacts.office && <li>{t.contacts.office}</li>}
                <li className="break-all text-teal-text">{url.replace(/^https?:\/\//, "")}</li>
              </ul>
            </PdfSection>
            {t.expertise_tags.length > 0 && (
              <PdfSection title="Expertise">
                <ul className="space-y-1 text-sm">
                  {t.expertise_tags.map((tag) => (
                    <li key={tag}>• {tag}</li>
                  ))}
                </ul>
              </PdfSection>
            )}
            {t.items.language.length > 0 && (
              <PdfSection title="Langues">
                <ul className="space-y-1 text-sm">
                  {t.items.language.map((l) => (
                    <li key={l.id}>
                      <strong>{l.title}</strong>
                      {l.organization ? ` — ${l.organization}` : ""}
                    </li>
                  ))}
                </ul>
              </PdfSection>
            )}
            {links.length > 0 && (
              <PdfSection title="Liens">
                <ul className="space-y-1 text-sm">
                  {links.map(([key, value]) => (
                    <li key={key} className="break-all">
                      <strong>{LINK_LABELS[key]?.label ?? key} :</strong> {key === "orcid" ? orcidUrl(value) : value}
                    </li>
                  ))}
                </ul>
              </PdfSection>
            )}
          </aside>
        </div>

        <footer className="mt-10 flex items-center justify-between gap-6 border-t border-line pt-6">
          <div className="text-xs text-muted">
            <p className="font-semibold text-navy">Profil public PRO-LOOKUP — Université ZTF</p>
            <p className="break-all">{url}</p>
            <p>Document généré le {formatDate(new Date().toISOString())}</p>
          </div>
          <img src={qr} alt={`QR code vers ${url}`} className="size-24" />
        </footer>
      </article>
    </div>
  );
}

function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-3 border-b border-line pb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-text">{title}</h2>
      {children}
    </section>
  );
}

function PlainList({ items }: { items: ProfileItem[] }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-semibold text-navy">
            {item.title}
            {item.period ? <span className="font-normal text-muted"> · {item.period}</span> : null}
          </p>
          {item.organization && <p className="text-muted">{item.organization}</p>}
        </li>
      ))}
    </ul>
  );
}
