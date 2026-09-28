"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLang } from "@/components/providers/LangProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Field";
import { fmt } from "@/lib/i18n";
import type { Ref, School } from "@/lib/types";

type Values = { q: string; school: string; department: string; grade: string; expertise: string; sort: string };

/**
 * Barre de filtres de l'annuaire. La saisie de texte est FACULTATIVE : les filtres seuls
 * (école supérieure, département / filière, grade, expertise) suffisent pour chercher.
 * Le département / filière est un texte libre, comme sur les profils.
 */
export function DirectoryFilters({ schools, grades, departments, initial }: { schools: School[]; grades: Ref[]; departments: string[]; initial: Values }) {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<Values>(initial);
  const [pending, startTransition] = useTransition();

  const apply = (next: Values) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v.trim()) qs.set(k, v.trim());
    startTransition(() => router.push(qs.toString() ? `${pathname}?${qs}` : pathname));
  };

  const update = (patch: Partial<Values>, submit = true) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (submit) apply(next);
  };

  const active = Object.entries(values).filter(([k, v]) => v && k !== "sort");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(values);
      }}
      className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
      aria-busy={pending}
    >
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label htmlFor="dir-q" className="mb-1 block text-xs font-semibold text-muted">
            {t.directory_search_label} <span className="font-normal">({t.optional})</span>
          </label>
          <div className="relative">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="dir-q"
              value={values.q}
              onChange={(e) => update({ q: e.target.value }, false)}
              placeholder={t.directory_search_placeholder}
              aria-describedby="dir-q-hint"
              className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm placeholder:text-muted focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="dir-school" className="mb-1 block text-xs font-semibold text-muted">{t.school}</label>
          <Select id="dir-school" value={values.school} onChange={(e) => update({ school: e.target.value })}>
            <option value="">{t.all_schools}</option>
            {schools.map((s) => (
              <option key={s.id} value={s.slug}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="dir-department" className="mb-1 block text-xs font-semibold text-muted">{t.department}</label>
          <input
            id="dir-department"
            list="dir-department-list"
            value={values.department}
            onChange={(e) => update({ department: e.target.value }, false)}
            onBlur={() => values.department !== initial.department && apply(values)}
            placeholder={t.department_placeholder}
            className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm placeholder:text-muted focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
          />
          <datalist id="dir-department-list">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="dir-grade" className="mb-1 block text-xs font-semibold text-muted">{t.grade}</label>
          <Select id="dir-grade" value={values.grade} onChange={(e) => update({ grade: e.target.value })}>
            <option value="">{t.all_grades}</option>
            {grades.map((g) => (
              <option key={g.id} value={g.slug}>{g.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end lg:col-span-1">
          <Button type="submit" variant="primary" icon="filter_list" full loading={pending} aria-label={t.filter}>
            <span className="lg:sr-only">{t.filter}</span>
          </Button>
        </div>
      </div>

      <p id="dir-q-hint" className="mt-3 flex items-start gap-2 text-xs text-muted">
        <Icon name="info" size={16} className="shrink-0 text-teal-text" />
        {t.search_optional_hint}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="dir-expertise" className="text-xs font-semibold text-muted">{t.expertise_label} :</label>
          <input
            id="dir-expertise"
            value={values.expertise}
            onChange={(e) => update({ expertise: e.target.value }, false)}
            onBlur={() => values.expertise !== initial.expertise && apply(values)}
            placeholder={t.expertise_placeholder}
            className="h-8 w-44 rounded-md border border-line px-2 text-xs focus:border-teal focus:outline-none"
          />
          {active.length > 0 && (
            <button
              type="button"
              onClick={() => update({ q: "", school: "", department: "", grade: "", expertise: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-navy hover:bg-line"
            >
              <Icon name="close" size={14} /> {fmt(t.clear_filters, { n: active.length })}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="dir-sort" className="font-semibold text-muted">
            <Icon name="swap_vert" size={16} className="align-middle" /> {t.sort_by}
          </label>
          <select
            id="dir-sort"
            value={values.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-8 rounded-md border border-line bg-white px-2 text-xs font-semibold text-navy focus:border-teal focus:outline-none"
          >
            <option value="">{t.sort_last_name}</option>
            <option value="first_name">{t.sort_first_name}</option>
          </select>
        </div>
      </div>
    </form>
  );
}
