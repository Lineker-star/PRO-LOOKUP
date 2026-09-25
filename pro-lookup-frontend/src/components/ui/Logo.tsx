import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

/** Logo PRO-LOOKUP : symbole officiel + nom, avec la mention de l'université. */
export function Logo({ light = false, subtitle = true, href = "/", className }: { light?: boolean; subtitle?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={clsx("flex items-center gap-2.5", className)} aria-label="PRO-LOOKUP — accueil">
      <span className={clsx("flex size-10 items-center justify-center rounded-xl", light ? "bg-white" : "bg-white ring-1 ring-line")}>
        <Image src="/logo/pro-lookup-symbole.png" alt="" width={34} height={34} priority />
      </span>
      <span className="leading-tight">
        <span className={clsx("block text-[17px] font-extrabold tracking-tight", light ? "text-white" : "text-navy")}>
          PRO<span className="text-teal">-</span>LOOKUP
        </span>
        {subtitle && (
          <span className={clsx("block text-[10px] font-semibold uppercase tracking-[0.12em]", light ? "text-white/70" : "text-muted")}>
            Université ZTF — Bertoua
          </span>
        )}
      </span>
    </Link>
  );
}
