"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/providers/LangProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PUBLIC_API_URL } from "@/lib/config";
import type { SearchResults } from "@/lib/types";

/**
 * Recherche de l'en-tête avec suggestions instantanées (maquette « dropdown recherche ») :
 * enseignants et publications, puis lien « Voir tous les résultats ».
 */
export function HeaderSearch({ className }: { className?: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${PUBLIC_API_URL}/public/search?limit=4&q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* recherche abandonnée */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const showDropdown = open && q.trim().length >= 2 && results;

  return (
    <div ref={box} className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            setOpen(false);
            router.push(`/recherche?q=${encodeURIComponent(q.trim())}`);
          }
        }}
        className="relative"
      >
        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (e.target.value.trim().length < 2) setResults(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={t.search_placeholder}
          aria-label={t.search_placeholder}
          className="h-10 w-full rounded-lg border border-transparent bg-mist pl-9 pr-3 text-sm placeholder:text-muted focus:border-teal focus:bg-white focus:outline-none"
        />
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-float">
          <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5 text-xs">
            <span className="font-semibold text-navy">
              Recherche : <span className="text-teal-text">« {q.trim()} »</span>
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 text-muted ring-1 ring-line">Échap pour fermer</span>
          </div>

          {results.teachers.length === 0 && results.posts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Aucun résultat pour cette recherche.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2">
              {results.teachers.length > 0 && (
                <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted">Enseignants</p>
              )}
              {results.teachers.map((teacher) => (
                <Link
                  key={teacher.slug}
                  href={`/in/${teacher.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-mist"
                >
                  <Avatar src={teacher.avatar_url} name={teacher.full_name} size="xs" ring={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">{teacher.full_name}</span>
                    <span className="block truncate text-xs text-muted">
                      {[teacher.grade?.name, teacher.department?.name].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              ))}
              {results.posts.length > 0 && (
                <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-muted">Publications</p>
              )}
              {results.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/publications/${post.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-mist"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                    <Icon name="article" size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">{post.title ?? post.excerpt}</span>
                    <span className="block truncate text-xs text-muted">{post.author?.full_name}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <Link
            href={`/recherche?q=${encodeURIComponent(q.trim())}`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-line px-4 py-3 text-sm font-semibold text-teal-text hover:bg-canvas"
          >
            Voir tous les résultats ({results.totals.teachers + results.totals.posts})
            <Icon name="arrow_forward" size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}
