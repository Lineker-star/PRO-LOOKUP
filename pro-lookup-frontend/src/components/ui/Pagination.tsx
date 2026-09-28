import clsx from "clsx";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type PaginationLabels = { pagination: string; page_of: string; page_n: string; previous_page: string; next_page: string };

const FRENCH: PaginationLabels = {
  pagination: "Pagination",
  page_of: "Page {page} sur {last}",
  page_n: "Page {n}",
  previous_page: "Page précédente",
  next_page: "Page suivante",
};

/**
 * Pagination par liens (fonctionne sans JavaScript, bon pour le référencement).
 * `params` contient les filtres actuels, conservés d'une page à l'autre.
 * `summary` : total déjà accordé (« 12 enseignants ») ; `labels` : libellés traduits (pages publiques).
 */
export function Pagination({
  page,
  lastPage,
  basePath,
  params = {},
  total,
  label = "résultats",
  summary,
  labels = FRENCH,
}: {
  page: number;
  lastPage: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  total?: number;
  label?: string;
  summary?: string;
  labels?: PaginationLabels;
}) {
  const totalText = summary ?? (total !== undefined ? `${total} ${label}` : null);

  if (lastPage <= 1) {
    return totalText ? <p className="text-sm text-muted">{totalText}</p> : null;
  }

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p)); else qs.delete("page");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages = Array.from(new Set([1, page - 1, page, page + 1, lastPage])).filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);
  const fill = (s: string, vars: Record<string, number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={labels.pagination}>
      {totalText && (
        <p className="text-sm text-muted">
          {fill(labels.page_of, { page, last: lastPage })} · <span className="tnum">{totalText}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} label={labels.previous_page}>
          <Icon name="chevron_left" size={18} />
        </PageLink>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
            <PageLink href={href(p)} active={p === page} label={fill(labels.page_n, { n: p })}>
              {p}
            </PageLink>
          </span>
        ))}
        <PageLink href={href(page + 1)} disabled={page >= lastPage} label={labels.next_page}>
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
