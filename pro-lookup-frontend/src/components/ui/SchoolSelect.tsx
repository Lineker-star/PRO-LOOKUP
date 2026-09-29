"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import type { School } from "@/lib/types";

const OTHER = "__other__";

/**
 * École supérieure : liste déroulante alimentée par le référentiel géré par l'administration
 * (« Grades, catégories, écoles »), avec une option « Autre » qui révèle une saisie libre.
 * Toute école ajoutée par l'administration apparaît donc ici sans autre changement.
 */
export function SchoolSelect({
  id,
  schools,
  value,
  onChange,
  invalid,
  required = true,
}: {
  id: string;
  schools: School[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  required?: boolean;
}) {
  const matches = (v: string) => schools.some((s) => s.name === v);
  // « Autre » choisi explicitement, ou valeur qui ne correspond à aucune école de la liste
  // (ex. liste encore en chargement, ou école saisie avant l'existence de ce référentiel).
  const [explicitOther, setExplicitOther] = useState(false);
  const other = explicitOther || (value !== "" && !matches(value));

  return (
    <div className="space-y-2">
      <Select
        id={id}
        value={other ? OTHER : value}
        invalid={invalid}
        required={required}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setExplicitOther(true);
            onChange("");
          } else {
            setExplicitOther(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">Choisir…</option>
        {schools.map((s) => (
          <option key={s.id} value={s.name}>{s.name}</option>
        ))}
        <option value={OTHER}>Autre (préciser)</option>
      </Select>
      {other && (
        <Input
          aria-label="Nom de l’école supérieure"
          placeholder="Nom de l’école supérieure"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          invalid={invalid}
          required={required}
          maxLength={150}
          autoFocus
        />
      )}
    </div>
  );
}
