"use client";

/* eslint-disable @next/next/no-img-element -- aperçu local de la photo choisie */
import clsx from "clsx";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/client";
import type { Me } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Photo de profil cliquable : on clique (ou on dépose un fichier) directement sur l'avatar
 * pour ajouter ou changer sa photo. Sans photo, les initiales laissent place à un appel
 * « Ajouter une photo ». L'image est ré-encodée côté serveur (sans métadonnées).
 */
export function AvatarUploader({
  me,
  size = "xl",
  className,
  showActions = true,
}: {
  me: Me;
  size?: "lg" | "xl";
  className?: string;
  /** Liens « Changer / Retirer » sous l'avatar. */
  showActions?: boolean;
}) {
  const { setMe } = useAuth();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const upload = async (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    setConfirmRemove(false);
    if (!ACCEPTED.includes(file.type)) return setError("Photo au format JPG, PNG ou WebP.");
    if (file.size > MAX_BYTES) return setError("La photo ne doit pas dépasser 5 Mo.");

    setPreview(URL.createObjectURL(file));
    setBusy(true);
    const body = new FormData();
    body.append("image", file);
    try {
      setMe((await api<{ data: Me }>("/me/images/avatar", { method: "POST", body })).data);
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("image") ?? e.message) : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
      setPreview(null);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      setMe((await api<{ data: Me }>("/me/images/avatar", { method: "DELETE" })).data);
      setConfirmRemove(false);
    } catch {
      setError("Suppression impossible.");
    } finally {
      setBusy(false);
    }
  };

  const hasPhoto = Boolean(me.avatar_url);
  const dimension = size === "xl" ? "size-32" : "size-20";

  return (
    <div className={clsx("flex w-fit flex-col items-center", className)}>
      <label
        htmlFor={inputId}
        title={hasPhoto ? "Changer la photo" : "Ajouter une photo"}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={clsx(
          "group relative block cursor-pointer rounded-full focus-within:ring-3 focus-within:ring-teal/40",
          busy && "pointer-events-none",
        )}
      >
        {preview ? (
          <img src={preview} alt="" className={clsx(dimension, "rounded-full object-cover ring-2 ring-gold ring-offset-2")} />
        ) : hasPhoto ? (
          <Avatar src={me.avatar_url} name={me.full_name} size={size} />
        ) : (
          // Pas encore de photo : zone de dépôt explicite à la place des initiales.
          <span
            className={clsx(
              dimension,
              "flex flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed text-center transition",
              over ? "border-teal bg-teal-soft text-teal-text" : "border-gold bg-gold-soft text-navy group-hover:border-teal group-hover:bg-teal-soft",
            )}
          >
            <Icon name="add_a_photo" size={size === "xl" ? 32 : 28} />
            {/* En petite taille, l'icône seule suffit (le lien « Choisir une photo » est juste dessous). */}
            {size === "xl" && <span className="px-3 text-xs font-semibold leading-tight">Ajouter une photo</span>}
          </span>
        )}

        {/* Voile au survol (ou pendant le glisser-déposer) sur une photo existante. */}
        {(hasPhoto || preview) && (
          <span
            className={clsx(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-navy/60 text-white transition",
              busy || over ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            )}
          >
            {busy ? (
              <span className="size-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Icon name="photo_camera" size={size === "xl" ? 28 : 22} />
                <span className="text-[11px] font-semibold">Changer</span>
              </>
            )}
          </span>
        )}
        {!hasPhoto && busy && !preview && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <span className="size-7 animate-spin rounded-full border-2 border-navy border-t-transparent" />
          </span>
        )}

        {/* Pastille appareil photo, toujours visible (utile sur mobile, sans survol). */}
        <span
          className={clsx(
            "absolute flex items-center justify-center rounded-full border-2 border-white bg-teal text-navy shadow-raised",
            size === "xl" ? "bottom-0 right-0 size-9" : "-bottom-1 -right-1 size-7",
          )}
        >
          <Icon name="photo_camera" size={size === "xl" ? 18 : 14} />
        </span>

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            upload(file);
          }}
        />
        <span className="sr-only">{hasPhoto ? "Changer la photo de profil" : "Ajouter une photo de profil"}</span>
      </label>

      {showActions && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          {confirmRemove ? (
            <>
              <span className="text-ink">Retirer la photo ?</span>
              <button type="button" onClick={remove} className="font-semibold text-danger hover:underline" disabled={busy}>Oui</button>
              <button type="button" onClick={() => setConfirmRemove(false)} className="font-semibold text-muted hover:underline">Non</button>
            </>
          ) : (
            <>
              <label htmlFor={inputId} className="cursor-pointer font-semibold text-teal-text hover:underline">
                {hasPhoto ? "Changer la photo" : "Choisir une photo"}
              </label>
              {hasPhoto && (
                <button type="button" onClick={() => setConfirmRemove(true)} className="font-semibold text-danger hover:underline">
                  Retirer
                </button>
              )}
            </>
          )}
        </div>
      )}
      {error && <p className="mt-2 max-w-48 text-center text-xs font-medium text-danger" role="alert">{error}</p>}
      {!hasPhoto && !error && showActions && <p className="mt-1 max-w-52 text-center text-[11px] text-muted">JPG, PNG ou WebP · 5 Mo max.</p>}
    </div>
  );
}
