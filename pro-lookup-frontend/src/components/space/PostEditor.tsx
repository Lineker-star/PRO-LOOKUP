"use client";

/* eslint-disable @next/next/no-img-element -- aperçus locaux et médias de l'API */
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PostMediaView } from "@/components/public/PostMediaView";
import { useAuth } from "@/components/providers/AuthProvider";
import { RichTextEditor } from "@/components/space/RichTextEditor";
import { Avatar } from "@/components/ui/Avatar";
import { GradeBadge, StatusBadge, Tag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert, Card } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import { PUBLIC_API_URL } from "@/lib/config";
import { fileSize, POST_STATUS } from "@/lib/format";
import type { OwnedPost, Ref } from "@/lib/types";

type Pending = { file: File; alt: string; preview: string | null };

/**
 * Fenêtre « Nouvelle publication » (brief §7.3) : titre, catégorie, texte mis en forme,
 * médias (10 images OU un PDF OU un lien), aperçu, brouillon ou publication immédiate.
 */
export function PostEditor({ post }: { post?: OwnedPost }) {
  const { me } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await (await fetch(`${PUBLIC_API_URL}/public/categories`)).json()).data as Ref[],
    staleTime: 600_000,
  });

  const [title, setTitle] = useState(post?.title ?? "");
  const [categoryId, setCategoryId] = useState(String(post?.category_id ?? ""));
  const [content, setContent] = useState(post?.content ?? "");
  const [existing, setExisting] = useState(post?.media ?? []);
  const [pending, setPending] = useState<Pending[]>([]);
  const [linkUrl, setLinkUrl] = useState(post?.media.find((m) => m.type === "link")?.url ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);

  useEffect(() => () => pending.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)), [pending]);

  const existingFiles = existing.filter((m) => m.type !== "link");
  const hasPdf = existingFiles.some((m) => m.type === "pdf") || pending.some((p) => p.file.type === "application/pdf");
  const imageCount = existingFiles.filter((m) => m.type === "image").length + pending.filter((p) => p.file.type !== "application/pdf").length;
  const hasFiles = existingFiles.length > 0 || pending.length > 0;
  const textLength = useMemo(() => content.replace(/<[^>]+>/g, "").length, [content]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const list = Array.from(files);
    const pdfs = list.filter((f) => f.type === "application/pdf");
    if (pdfs.length && (list.length > 1 || hasFiles)) {
      setError(new ApiError(422, "Une publication contient soit des images (10 maximum), soit un seul document PDF."));
      return;
    }
    if (!pdfs.length && (hasPdf || imageCount + list.length > 10)) {
      setError(new ApiError(422, "Une publication peut contenir au maximum 10 images, sans document PDF."));
      return;
    }
    setLinkUrl("");
    setPending((prev) => [...prev, ...list.map((file) => ({ file, alt: "", preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null }))]);
  };

  const removeExisting = async (mediaId: number) => {
    if (!post) return;
    await api(`/me/posts/${post.id}/media/${mediaId}`, { method: "DELETE" });
    setExisting((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const save = async (status: "draft" | "published") => {
    setSaving(status);
    setError(null);
    try {
      const body = { title: title.trim() || null, content, category_id: Number(categoryId) || null, status, link_url: hasFiles ? null : linkUrl.trim() || null };
      const saved = post
        ? await api<{ data: OwnedPost }>(`/me/posts/${post.id}`, { method: "PUT", body })
        : await api<{ data: OwnedPost }>("/me/posts", { method: "POST", body });

      // Les médias sont envoyés une fois la publication créée.
      if (pending.length) {
        const form = new FormData();
        pending.forEach((p, i) => {
          form.append("files[]", p.file);
          form.append(`alts[${i}]`, p.alt);
        });
        await api(`/me/posts/${saved.data.id}/media`, { method: "POST", body: form });
      }

      await queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      router.push(status === "published" && saved.data.status === "published" ? `/publications/${saved.data.id}` : "/espace/publications");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "Enregistrement impossible."));
      setSaving(null);
    }
  };

  const category = categories.data?.find((c) => String(c.id) === categoryId);
  const canSave = textLength > 0 && Boolean(categoryId);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" aria-hidden />

      {/* En-tête façon « Commencer un post » */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          {me && <Avatar src={me.avatar_url} name={me.full_name} size="sm" />}
          <div>
            <p className="font-semibold text-navy">{me?.full_name}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <Icon name="public" size={14} /> Public — visible par tout le monde
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post && <StatusBadge tone={POST_STATUS[post.status].tone}>{POST_STATUS[post.status].label}</StatusBadge>}
          <div className="flex rounded-lg bg-mist p-1 text-sm font-semibold" role="tablist">
            {(["edit", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={clsx("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5", mode === m ? "bg-white text-navy shadow-card" : "text-muted")}
              >
                <Icon name={m === "edit" ? "edit" : "visibility"} size={16} />
                {m === "edit" ? "Rédiger" : "Aperçu"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {error && <Alert tone="danger">{error.field("content") ?? error.field("category_id") ?? error.message}</Alert>}
        {post?.status === "hidden" && (
          <Alert tone="danger" title="Publication masquée par l’administration">
            {post.hidden_reason} — Vos corrections seront enregistrées, mais la publication restera masquée jusqu’à ce qu’un administrateur la rétablisse.
          </Alert>
        )}

        {mode === "edit" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Titre" htmlFor="p-title" hint="Facultatif — recommandé pour un article." className="sm:col-span-2">
                <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Titre de la publication" />
              </Field>
              <Field label="Catégorie" htmlFor="p-category" required error={error?.field("category_id")}>
                <Select id="p-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Choisir…</option>
                  {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Texte" htmlFor="p-content" required aside={`${textLength} caractères`}>
              <RichTextEditor value={content} onChange={setContent} placeholder="Partagez une actualité, un article, un événement, vos travaux…" />
            </Field>

            {/* Médias */}
            <div className="space-y-3 rounded-xl border border-line bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Joindre à la publication</p>
                <p className="text-xs text-muted">10 images maximum · ou 1 PDF · ou 1 lien</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className={clsx("inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:border-navy", (hasPdf || imageCount >= 10) && "pointer-events-none opacity-50")}>
                  <Icon name="image" size={18} className="text-teal-text" /> Images
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                <label className={clsx("inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:border-navy", hasFiles && "pointer-events-none opacity-50")}>
                  <Icon name="picture_as_pdf" size={18} className="text-danger" /> Document PDF
                  <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              </div>

              {!hasFiles && (
                <Field label="Lien externe" htmlFor="p-link" hint="Un lien vers un article, une vidéo, un site…">
                  <Input id="p-link" type="url" icon="link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
                </Field>
              )}

              {(existingFiles.length > 0 || pending.length > 0) && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {existingFiles.map((m) => (
                    <li key={`e-${m.id}`} className="flex items-center gap-3 rounded-lg border border-line bg-white p-2">
                      {m.type === "image" && m.url ? <img src={m.url} alt={m.alt ?? ""} className="size-14 rounded-md object-cover" /> : <Icon name="picture_as_pdf" size={32} className="text-danger" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{m.alt || m.original_name || "Média"}</span>
                      <button type="button" onClick={() => removeExisting(m.id)} className="inline-flex size-8 items-center justify-center rounded-md text-danger hover:bg-danger-soft" aria-label="Retirer ce média">
                        <Icon name="delete" size={18} />
                      </button>
                    </li>
                  ))}
                  {pending.map((p, i) => (
                    <li key={`p-${i}`} className="flex items-start gap-3 rounded-lg border border-teal/40 bg-white p-2">
                      {p.preview ? <img src={p.preview} alt="" className="size-14 rounded-md object-cover" /> : <Icon name="picture_as_pdf" size={32} className="text-danger" />}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-xs font-semibold text-navy">{p.file.name} · {fileSize(p.file.size)}</p>
                        {p.preview && (
                          <input
                            value={p.alt}
                            onChange={(e) => setPending((prev) => prev.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                            placeholder="Texte alternatif (description de l’image)"
                            aria-label={`Texte alternatif de ${p.file.name}`}
                            className="h-8 w-full rounded-md border border-line px-2 text-xs focus:border-teal focus:outline-none"
                            maxLength={255}
                          />
                        )}
                      </div>
                      <button type="button" onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))} className="inline-flex size-8 items-center justify-center rounded-md text-danger hover:bg-danger-soft" aria-label="Retirer ce fichier">
                        <Icon name="close" size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          /* Aperçu tel qu'il apparaîtra publiquement */
          <div className="rounded-2xl border border-line bg-white p-6">
            {me && (
              <div className="flex items-center gap-3">
                <Avatar src={me.avatar_url} name={me.full_name} size="sm" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                    {me.full_name} {me.grade && <GradeBadge name={me.grade.name} size="sm" />}
                  </p>
                  <p className="text-xs text-muted">{[me.department, me.school].filter(Boolean).join(" · ") || "Université ZTF"}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              {category && <Tag className="bg-teal-soft text-teal-text">{category.name}</Tag>}
              à l’instant
            </div>
            {title && <h2 className="mt-3 text-xl font-bold text-navy">{title}</h2>}
            {content ? (
              <div className="prose-post mt-2 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <p className="mt-2 text-sm text-muted">Votre texte apparaîtra ici.</p>
            )}
            <div className="mt-4 space-y-3">
              {existingFiles.length > 0 && <PostMediaView media={existingFiles} />}
              {pending.some((p) => p.preview) && (
                <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
                  {pending.filter((p) => p.preview).map((p, i) => <img key={i} src={p.preview!} alt={p.alt} className="aspect-[4/3] w-full object-cover" />)}
                </div>
              )}
              {!hasFiles && linkUrl && <PostMediaView media={[{ id: 0, type: "link", url: linkUrl, alt: null, original_name: null, size: null }]} />}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-4">
        <Button variant="ghost" icon="arrow_back" onClick={() => router.push("/espace/publications")}>Annuler</Button>
        <div className="flex flex-wrap gap-2">
          {post?.status !== "published" && post?.status !== "hidden" && (
            <Button variant="outline" icon="save" loading={saving === "draft"} disabled={!canSave || saving !== null} onClick={() => save("draft")}>
              Enregistrer en brouillon
            </Button>
          )}
          <Button variant="accent" icon="send" loading={saving === "published"} disabled={!canSave || saving !== null} onClick={() => save("published")}>
            {post?.status === "published" || post?.status === "hidden" ? "Enregistrer les modifications" : "Publier"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
