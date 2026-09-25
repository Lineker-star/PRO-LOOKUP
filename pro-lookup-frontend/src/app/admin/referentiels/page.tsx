"use client";

import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { StatusTabs } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import type { ReferenceItem, References } from "@/lib/types";

type Type = "grades" | "categories" | "faculties" | "departments";

/**
 * Listes gérées par l'administration (brief §8) : ajouter, renommer, désactiver.
 * Rien n'est supprimé : un élément désactivé disparaît des formulaires mais reste affiché là où il est utilisé.
 */
export default function ReferencesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"grades" | "categories" | "faculties">("grades");
  const [error, setError] = useState<string | null>(null);
  const refs = useQuery({ queryKey: ["admin", "references"], queryFn: async () => (await api<{ data: References }>("/admin/references")).data });

  const mutate = async (fn: () => Promise<{ data: References }>) => {
    setError(null);
    try {
      queryClient.setQueryData(["admin", "references"], (await fn()).data);
      await queryClient.invalidateQueries({ queryKey: ["public-refs"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["faculties"] });
    } catch (e) {
      setError(e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Enregistrement impossible.");
      throw e;
    }
  };
  const create = (type: Type, name: string, faculty_id?: number) => mutate(() => api(`/admin/references/${type}`, { method: "POST", body: { name, faculty_id } }));
  const update = (type: Type, id: number, body: Record<string, unknown>) => mutate(() => api(`/admin/references/${type}/${id}`, { method: "PUT", body }));

  return (
    <div className="space-y-5">
      <AdminHeading
        crumbs={[{ label: "Référentiels" }]}
        title="Grades, catégories, facultés et départements"
        lead="Ces listes alimentent les formulaires d’inscription, les profils, les publications et les filtres de l’annuaire."
      />
      <StatusTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "grades", label: "Grades", count: refs.data?.grades.length },
          { id: "categories", label: "Catégories de publication", count: refs.data?.categories.length },
          { id: "faculties", label: "Facultés et départements", count: refs.data?.faculties.length },
        ]}
      />
      {error && <Alert tone="danger">{error}</Alert>}

      {refs.isPending || !refs.data ? (
        <Spinner />
      ) : tab === "faculties" ? (
        <div className="space-y-4">
          {refs.data.faculties.map((faculty) => (
            <Card key={faculty.id} className="overflow-hidden">
              <ItemRow item={faculty} icon="account_balance" onRename={(name) => update("faculties", faculty.id, { name })} onToggle={() => update("faculties", faculty.id, { is_active: !faculty.is_active })} strong />
              <div className="border-t border-line bg-canvas px-5 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Départements</p>
                <ul className="divide-y divide-line rounded-xl border border-line bg-white">
                  {faculty.departments.map((d) => (
                    <li key={d.id}>
                      <ItemRow item={d} icon="apartment" onRename={(name) => update("departments", d.id, { name })} onToggle={() => update("departments", d.id, { is_active: !d.is_active })} />
                    </li>
                  ))}
                </ul>
                <AddForm label="Ajouter un département" onAdd={(name) => create("departments", name, faculty.id)} />
              </div>
            </Card>
          ))}
          <Card className="p-5">
            <AddForm label="Ajouter une faculté" onAdd={(name) => create("faculties", name)} />
          </Card>
        </div>
      ) : (
        <Card className="overflow-hidden">
          {tab === "grades" && (
            <p className="border-b border-line bg-canvas px-5 py-3 text-xs text-muted">
              <Icon name="info" size={14} className="mr-1 align-[-2px]" />
              Le grade est une information, jamais une échelle de mérite : tous les badges ont le même aspect et l’annuaire ne trie jamais par grade.
            </p>
          )}
          <ul className="divide-y divide-line">
            {refs.data[tab].map((item) => (
              <li key={item.id}>
                <ItemRow
                  item={item}
                  icon={tab === "grades" ? "workspace_premium" : "label"}
                  onRename={(name) => update(tab, item.id, { name })}
                  onToggle={() => update(tab, item.id, { is_active: !item.is_active })}
                />
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-4">
            <AddForm label={tab === "grades" ? "Ajouter un grade" : "Ajouter une catégorie"} onAdd={(name) => create(tab, name)} />
          </div>
        </Card>
      )}
    </div>
  );
}

function ItemRow({ item, icon, onRename, onToggle, strong }: { item: ReferenceItem; icon: string; onRename: (name: string) => Promise<void>; onToggle: () => Promise<void>; strong?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setEditing(false);
    } catch {
      /* message affiché en haut de page */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={clsx("flex flex-wrap items-center justify-between gap-3 px-5 py-3", !item.is_active && "opacity-60")}>
      {editing ? (
        <form className="flex flex-1 flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); run(() => onRename(name)); }}>
          <div className="min-w-60 flex-1"><Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nouveau nom" autoFocus /></div>
          <Button type="submit" size="sm" icon="check" loading={busy} disabled={!name.trim()}>Enregistrer</Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setName(item.name); }}>Annuler</Button>
        </form>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <Icon name={icon} size={20} className="text-muted" />
            <span className={clsx("truncate text-navy", strong ? "font-bold" : "font-semibold")}>{item.name}</span>
            {!item.is_active && <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-muted">Désactivé</span>}
            <span className="tnum text-xs text-muted">· utilisé {item.usage} fois</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(true)}>Renommer</Button>
            <Button variant="outline" size="sm" icon={item.is_active ? "toggle_off" : "toggle_on"} loading={busy} onClick={() => run(onToggle)}>
              {item.is_active ? "Désactiver" : "Réactiver"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AddForm({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onAdd(name.trim());
          setName("");
        } catch {
          /* message affiché en haut de page */
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="min-w-60 flex-1"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={label} aria-label={label} /></div>
      <Button type="submit" variant="primary" size="sm" icon="add" loading={busy} disabled={!name.trim()}>{label}</Button>
    </form>
  );
}
