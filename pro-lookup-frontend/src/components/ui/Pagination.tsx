import clsx from "clsx";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Pagination par liens (fonctionne sans JavaScript, bon pour le référencement).
 * `params` contient les filtres actuels, conservés d'une page à l'autre.
 */
export function Pagination({
  page,
  lastPage,
  basePath,
  params = {},
  total,
  label = "résultats",
}: {
  page: number;
  lastPage: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  total?: number;
  label?: string;
}) {
  if (lastPage <= 1) {
    return total !== undefined ? <p className="text-sm text-muted">{total} {label}</p> : null;
  }

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p)); else qs.delete("page");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages = Array.from(new Set([1, page - 1, page, page + 1, lastPage])).filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
      {total !== undefined && (
        <p className="text-sm text-muted">
          Page {page} sur {lastPage} · <span className="tnum">{total}</span> {label}
        </p>
      )}
      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} label="Page précédente">
          <Icon name="chevron_left" size={18} />
        </PageLink>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
            <PageLink href={href(p)} active={p === page} label={`Page ${p}`}>
              {p}
            </PageLink>
          </span>
        ))}
        <PageLink href={href(page + 1)} disabled={page >= lastPage} label="Page suivante">
          <Icon name="chevron_right" size={18} />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({ href, children, active, disabled, label }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; label: string }) {
  const cls = clsx(
    "tnum inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold",
    active ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) return <span className={cls} aria-disabled>{children}</span>;
  return (
    <Link href={href} className={cls} aria-label={label} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
