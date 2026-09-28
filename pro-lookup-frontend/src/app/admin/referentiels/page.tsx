"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { StatusTabs } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import type { ReferenceItem, References, ReferenceType } from "@/lib/types";

const TABS: Record<ReferenceType, { label: string; icon: string; add: string; deleteEffect: string; info: string }> = {
  grades: {
    label: "Grades",
    icon: "workspace_premium",
    add: "Ajouter un grade",
    deleteEffect: "Les enseignants qui ont ce grade n’en auront plus : ils en choisiront un autre depuis leur profil.",
    info: "Le grade est une information, jamais une échelle de mérite : tous les badges ont le même aspect et l’annuaire ne trie jamais par grade.",
  },
  categories: {
    label: "Catégories de publication",
    icon: "label",
    add: "Ajouter une catégorie",
    deleteEffect: "Les publications de cette catégorie restent en ligne, sans catégorie.",
    info: "Catégories proposées aux enseignants lorsqu’ils publient, et filtres du fil public.",
  },
  schools: {
    label: "Écoles supérieures",
    icon: "account_balance",
    add: "Ajouter une école supérieure",
    deleteEffect: "Les enseignants gardent l’école qu’ils ont saisie ; elle disparaît seulement des suggestions et des filtres de l’annuaire.",
    info: "Les enseignants saisissent librement leur école supérieure et leur département / filière. Cette liste sert de suggestions à la saisie et de filtres dans l’annuaire ; un enseignant dont le texte correspond au nom d’une école y est rattaché automatiquement.",
  },
};

/**
 * Listes gérées par l'administration (brief §8) : ajouter, renommer, supprimer.
 * Chaque action est journalisée ; les confirmations se font dans la page.
 */
export default function ReferencesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReferenceType>("grades");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refs = useQuery({ queryKey: ["admin", "references"], queryFn: async () => (await api<{ data: References }>("/admin/references")).data });

  const mutate = async (fn: () => Promise<{ data: References }>, done: string) => {
    setError(null);
    setNotice(null);
    try {
      queryClient.setQueryData(["admin", "references"], (await fn()).data);
      // Les listes publiques en cache côté navigateur sont rafraîchies.
      for (const key of ["admin-list-refs", "creation-refs", "profile-refs", "categories"]) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }
      setNotice(done);
    } catch (e) {
      setError(e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Enregistrement impossible.");
      throw e;
    }
  };
  const create = (name: string) => mutate(() => api(`/admin/references/${tab}`, { method: "POST", body: { name } }), `« ${name} » ajouté(e).`);
  const rename = (id: number, name: string) => mutate(() => api(`/admin/references/${tab}/${id}`, { method: "PUT", body: { name } }), `Renommé(e) en « ${name} ».`);
  const remove = (item: ReferenceItem) => mutate(() => api(`/admin/references/${tab}/${item.id}`, { method: "DELETE" }), `« ${item.name} » supprimé(e).`);

  const meta = TABS[tab];

  return (
    <div className="space-y-5">
      <AdminHeading
        crumbs={[{ label: "Référentiels" }]}
        title="Grades, catégories et écoles supérieures"
        lead="Ajoutez, renommez ou supprimez les éléments de ces listes. Elles alimentent les formulaires, les profils, les publications et les filtres de l’annuaire."
      />
      <StatusTabs
        value={tab}
        onChange={(v) => { setTab(v); setError(null); setNotice(null); }}
        tabs={(Object.keys(TABS) as ReferenceType[]).map((id) => ({ id, label: TABS[id].label, count: refs.data?.[id].length }))}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {refs.isPending || !refs.data ? (
        <Spinner />
      ) : (
        <Card className="overflow-hidden">
          <p className="border-b border-line bg-canvas px-5 py-3 text-xs text-muted">
            <Icon name="info" size={14} className="mr-1 align-[-2px]" />
            {meta.info}
          </p>
          {refs.data[tab].length > 0 ? (
            <ul className="divide-y divide-line">
              {refs.data[tab].map((item) => (
                <li key={`${tab}-${item.id}`}>
                  <ItemRow item={item} icon={meta.icon} deleteEffect={meta.deleteEffect} onRename={(name) => rename(item.id, name)} onDelete={() => remove(item)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">Cette liste est vide.</p>
          )}
          <div className="border-t border-line px-5 py-4">
            <AddForm key={tab} label={meta.add} onAdd={create} />
          </div>
        </Card>
      )}
    </div>
  );
}

function ItemRow({
  item,
  icon,
  deleteEffect,
  onRename,
  onDelete,
}: {
  item: ReferenceItem;
  icon: string;
  deleteEffect: string;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setMode("view");
    } catch {
      /* message affiché en haut de page */
    } finally {
      setBusy(false);
    }
  };

  if (mode === "edit") {
    return (
      <form className="flex flex-wrap items-center gap-2 px-5 py-3" onSubmit={(e) => { e.preventDefault(); run(() => onRename(name.trim())); }}>
        <div className="min-w-0 flex-1 basis-60"><Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nouveau nom" maxLength={150} autoFocus /></div>
        <Button type="submit" size="sm" icon="check" loading={busy} disabled={!name.trim() || name.trim() === item.name}>Enregistrer</Button>
        <Button variant="ghost" size="sm" onClick={() => { setMode("view"); setName(item.name); }}>Annuler</Button>
      </form>
    );
  }

  return (
    <div className="px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon name={icon} size={20} className="text-muted" />
          <span className="truncate font-semibold text-navy">{item.name}</span>
          <span className="tnum whitespace-nowrap text-xs text-muted">· utilisé {item.usage} fois</span>
        </div>
        {mode === "view" && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon="edit" onClick={() => setMode("edit")}>Renommer</Button>
            <Button variant="outline" size="sm" icon="delete" className="text-danger hover:border-danger" onClick={() => setMode("delete")}>Supprimer</Button>
          </div>
        )}
      </div>
      {mode === "delete" && (
        <div className="mt-3 space-y-3 rounded-xl border border-danger/40 bg-danger-soft p-4">
          <p className="text-sm font-bold text-navy">Supprimer « {item.name} » ?</p>
          <p className="text-sm text-ink/80">
            {item.usage > 0 ? `Utilisé ${item.usage} fois. ` : ""}
            {deleteEffect}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode("view")}>Annuler</Button>
            <Button variant="danger" size="sm" icon="delete" loading={busy} onClick={() => run(onDelete)}>Supprimer définitivement</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddForm({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
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
      <div className="min-w-0 flex-1 basis-60"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={label} aria-label={label} maxLength={150} /></div>
      <Button type="submit" variant="primary" size="sm" icon="add" loading={busy} disabled={!name.trim()}>{label}</Button>
    </form>
  );
}
