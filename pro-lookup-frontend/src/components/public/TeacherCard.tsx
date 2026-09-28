"use client";

import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { TeacherCard as TeacherCardType } from "@/lib/types";

/**
 * Carte d'un enseignant dans l'annuaire (maquette « classement général »).
 * École supérieure et département / filière sont affichés tels que l'enseignant les a saisis.
 */
export function TeacherCard({ teacher }: { teacher: TeacherCardType }) {
  const { t, p } = useLang();
  const posts = teacher.posts_count ?? 0;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <Avatar src={teacher.avatar_url} name={teacher.full_name} size="md" />
        {teacher.grade && <GradeBadge name={teacher.grade.name} size="sm" />}
      </div>

      <h3 className="mt-4 text-base font-bold text-navy">
        <Link href={`/in/${teacher.slug}`} className="after:absolute after:inset-0 after:rounded-2xl">
          {teacher.full_name}
        </Link>
      </h3>
      {teacher.title && <p className="mt-0.5 text-sm text-muted">{teacher.title}</p>}

      <div className="mt-4 space-y-1.5 rounded-xl bg-canvas p-3 text-xs text-ink/80">
        {teacher.school && (
          <p className="flex items-start gap-2">
            <Icon name="account_balance" size={16} className="mt-px text-muted" />
            <span>
              <span className="sr-only">{t.school} : </span>
              {teacher.school}
            </span>
          </p>
        )}
        {teacher.department && (
          <p className="flex items-start gap-2">
            <Icon name="apartment" size={16} className="mt-px text-muted" />
            <span>
              <span className="sr-only">{t.department} : </span>
              {teacher.department}
            </span>
          </p>
        )}
        {teacher.expertise && (
          <p className="flex items-start gap-2">
            <Icon name="psychology" size={16} className="mt-px text-muted" />
            <span>{teacher.expertise}</span>
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <span className="tnum text-xs text-muted">{p(t.posts_count, posts)}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-teal-text group-hover:underline">
          {t.view_profile} <Icon name="arrow_forward" size={16} />
        </span>
      </div>
    </article>
  );
}
