"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Field";
import type { FacultyWithDepartments, Ref } from "@/lib/types";

type Values = { q: string; faculty: string; department: string; grade: string; expertise: string; sort: string };

/** Barre de filtres de l'annuaire. Le département proposé dépend de la faculté choisie. */
export function DirectoryFilters({ faculties, grades, initial }: { faculties: FacultyWithDepartments[]; grades: Ref[]; initial: Values }) {
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<Values>(initial);
  const [pending, startTransition] = useTransition();

  const departments = faculties.find((f) => f.slug === values.faculty)?.departments ?? faculties.flatMap((f) => f.departments);

  const apply = (next: Values) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
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
        <div className="relative lg:col-span-4">
          <label htmlFor="dir-q" className="sr-only">
            Rechercher par nom
          </label>
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="dir-q"
            value={values.q}
            onChange={(e) => update({ q: e.target.value }, false)}
            placeholder="Rechercher par nom, titre ou expertise…"
            className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm placeholder:text-muted focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20"
          />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="dir-faculty" className="sr-only">Faculté</label>
          <Select id="dir-faculty" value={values.faculty} onChange={(e) => update({ faculty: e.target.value, department: "" })}>
            <option value="">Toutes les facultés</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.slug}>{f.name}</option>
            ))}
          </Select>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="dir-department" className="sr-only">Département</label>
          <Select id="dir-department" value={values.department} onChange={(e) => update({ department: e.target.value })}>
            <option value="">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={d.slug}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="dir-grade" className="sr-only">Grade</label>
          <Select id="dir-grade" value={values.grade} onChange={(e) => update({ grade: e.target.value })}>
            <option value="">Tous les grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.slug}>{g.name}</option>
            ))}
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Button type="submit" variant="primary" icon="filter_list" full loading={pending}>
            Filtrer
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="dir-expertise" className="text-xs font-semibold text-muted">Domaine d’expertise :</label>
          <input
            id="dir-expertise"
            value={values.expertise}
            onChange={(e) => update({ expertise: e.target.value }, false)}
            onBlur={() => values.expertise !== initial.expertise && apply(values)}
            placeholder="ex. énergie solaire"
            className="h-8 w-44 rounded-md border border-line px-2 text-xs focus:border-teal focus:outline-none"
          />
          {active.length > 0 && (
            <button
              type="button"
              onClick={() => update({ q: "", faculty: "", department: "", grade: "", expertise: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-navy hover:bg-line"
            >
              <Icon name="close" size={14} /> Effacer les filtres ({active.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="dir-sort" className="font-semibold text-muted">
            <Icon name="swap_vert" size={16} className="align-middle" /> Trier par
          </label>
          <select
            id="dir-sort"
            value={values.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-8 rounded-md border border-line bg-white px-2 text-xs font-semibold text-navy focus:border-teal focus:outline-none"
          >
            <option value="">Nom (A → Z)</option>
            <option value="first_name">Prénom (A → Z)</option>
          </select>
        </div>
      </div>
    </form>
  );
}
