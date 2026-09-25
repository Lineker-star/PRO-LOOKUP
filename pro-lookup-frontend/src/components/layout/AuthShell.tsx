import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Mise en page des écrans d'authentification (maquette « connexion desktop ») :
 * carte principale à gauche, encart institutionnel à droite.
 */
export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  aside,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-canvas">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden
      />
      <div className={`relative mx-auto grid gap-8 px-4 py-10 sm:px-6 lg:py-16 ${wide ? "max-w-6xl lg:grid-cols-12" : "max-w-6xl lg:grid-cols-12"}`}>
        <div className={wide ? "lg:col-span-8" : "lg:col-span-7"}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-raised">
            <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" aria-hidden />
            <div className="p-6 sm:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-text">
                <Icon name="lock" size={14} />
                {eyebrow}
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>
              {lead && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{lead}</p>}
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
        <aside className={wide ? "space-y-5 lg:col-span-4" : "space-y-5 lg:col-span-5"}>{aside ?? <DefaultAside />}</aside>
      </div>
    </div>
  );
}

function DefaultAside() {
  return (
    <>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-text">
          <span className="size-2 rounded-full bg-teal" /> Université ZTF — Bertoua
        </p>
        <h2 className="mt-3 text-lg font-bold text-navy">La vitrine du corps enseignant</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          PRO-LOOKUP publie les profils et travaux des enseignants de l’université. Tout le contenu public se consulte sans compte : la connexion
          sert uniquement aux enseignants et aux administrateurs.
        </p>
        <ul className="mt-5 space-y-3 text-sm">
          {[
            { icon: "verified_user", text: "Profils vérifiés par l’administration" },
            { icon: "public", text: "Profils et publications visibles dans le monde entier" },
            { icon: "share", text: "Partage par lien, QR code ou PDF" },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-mist text-navy">
                <Icon name={item.icon} size={18} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-navy p-6 text-white">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="support_agent" size={20} className="text-teal" /> Besoin d’aide ?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Pour tout problème d’accès à votre compte, adressez-vous au secrétariat de l’administration de l’Université ZTF.
        </p>
      </div>
    </>
  );
}
