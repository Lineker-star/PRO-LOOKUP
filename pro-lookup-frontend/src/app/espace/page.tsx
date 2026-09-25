"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CopyLinkButton } from "@/components/public/CopyLinkButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { SpaceHeading } from "@/components/space/SpaceShell";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, Card, Spinner } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { profileUrl } from "@/lib/config";
import { POST_STATUS, timeAgo } from "@/lib/format";
import type { Me, OwnedPost } from "@/lib/types";

type MyPosts = { data: OwnedPost[]; counts: { all: number; draft: number; published: number; hidden: number } };

/** Complétude du profil : chaque élément rempli rapporte des points. */
function completion(me: Me) {
  const checks = [
    { ok: Boolean(me.avatar_url), label: "Photo de profil" },
    { ok: Boolean(me.title), label: "Titre professionnel" },
    { ok: Boolean(me.bio), label: "Biographie" },
    { ok: me.expertise_tags.length > 0, label: "Spécialités" },
    { ok: me.items.course.length > 0, label: "Enseignements" },
    { ok: me.items.education.length > 0, label: "Parcours académique" },
    { ok: me.items.experience.length > 0, label: "Expérience" },
    { ok: Object.values(me.links).some(Boolean), label: "Liens (ORCID…)" },
  ];
  return { percent: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100), missing: checks.filter((c) => !c.ok) };
}

/** Tableau de bord de l'enseignant (brief §10) : état du compte, raccourcis, dernières publications, alertes. */
export default function SpaceDashboard() {
  const { me } = useAuth();
  const posts = useQuery({ queryKey: ["my-posts", "all"], queryFn: () => api<MyPosts>("/me/posts", { query: { per_page: 5 } }) });

  if (!me) return <Spinner />;
  const { percent, missing } = completion(me);
  const hidden = posts.data?.data.filter((p) => p.status === "hidden") ?? [];
  const url = me.slug ? profileUrl(me.slug) : null;

  return (
    <div className="space-y-6">
      <SpaceHeading
        eyebrow="Tableau de bord"
        title={`Bonjour ${me.first_name}`}
        lead="Gérez votre profil public et vos publications. Tout ce que vous publiez est visible par tous, sans compte."
        actions={<ButtonLink href="/espace/publications/nouvelle" variant="accent" icon="edit_square">Nouvelle publication</ButtonLink>}
      />

      {(posts.data?.counts.hidden ?? 0) > 0 && (
        <Alert tone="danger" title="Une publication a été masquée par l’administration">
          {hidden[0]?.hidden_reason && <>Motif : « {hidden[0].hidden_reason} ». </>}
          <Link href="/espace/publications?statut=hidden" className="font-semibold underline">Voir mes publications masquées</Link>
        </Alert>
      )}

      {/* État du compte + URL */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">État du compte</p>
          <div className="mt-3"><StatusBadge tone="success">Approuvé — profil public</StatusBadge></div>
          <p className="mt-3 text-sm text-muted">Votre profil apparaît dans l’annuaire et la recherche.</p>
        </Card>
        <Card className="p-5 md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Adresse de votre profil</p>
          {url && (
            <>
              <p className="mt-3 break-all rounded-lg bg-canvas px-3 py-2 font-mono text-sm font-semibold text-navy">{url.replace(/^https?:\/\//, "")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyLinkButton url={url} size="sm" />
                <ButtonLink href={`/in/${me.slug}`} variant="outline" size="sm" icon="visibility">Voir mon profil</ButtonLink>
                <ButtonLink href="/espace/profil-public" variant="ghost" size="sm" icon="tune">QR code, badge, visibilité</ButtonLink>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Publiées", value: posts.data?.counts.published, icon: "public", tone: "text-success" },
          { label: "Brouillons", value: posts.data?.counts.draft, icon: "edit_note", tone: "text-muted" },
          { label: "Masquées", value: posts.data?.counts.hidden, icon: "visibility_off", tone: "text-danger" },
          { label: "Profil complété", value: `${percent} %`, icon: "account_circle", tone: "text-teal-text" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <Icon name={s.icon} size={22} className={s.tone} />
            <p className="tnum mt-2 text-2xl font-extrabold text-navy">{s.value ?? "—"}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Dernières publications */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">Mes dernières publications</h2>
            <Link href="/espace/publications" className="text-sm font-semibold text-teal-text hover:underline">Tout gérer</Link>
          </div>
          {posts.isPending ? (
            <Spinner />
          ) : posts.data && posts.data.data.length > 0 ? (
            <ul className="divide-y divide-line">
              {posts.data.data.map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link href={`/espace/publications/${post.id}/modifier`} className="block truncate font-semibold text-navy hover:underline">
                      {post.title ?? post.excerpt}
                    </Link>
                    <p className="text-xs text-muted">{post.category?.name} · modifiée {timeAgo(post.updated_at)}</p>
                  </div>
                  <StatusBadge tone={POST_STATUS[post.status].tone}>{POST_STATUS[post.status].label}</StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted">Vous n’avez encore rien publié.</p>
              <ButtonLink href="/espace/publications/nouvelle" variant="primary" size="sm" icon="add" className="mt-4">Rédiger ma première publication</ButtonLink>
            </div>
          )}
        </Card>

        {/* Complétude */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-bold text-navy">Compléter mon profil</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-teal" style={{ width: `${percent}%` }} />
          </div>
          <p className="tnum mt-2 text-sm font-semibold text-navy">{percent} % complété</p>
          {missing.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {missing.slice(0, 5).map((m) => (
                <li key={m.label} className="flex items-center gap-2 text-muted">
                  <Icon name="radio_button_unchecked" size={18} /> {m.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-success">Votre profil est complet. Bravo !</p>
          )}
          <ButtonLink href="/espace/profil" variant="outline" size="sm" icon="edit" className="mt-5">Modifier mon profil</ButtonLink>
        </Card>
      </div>
    </div>
  );
}
