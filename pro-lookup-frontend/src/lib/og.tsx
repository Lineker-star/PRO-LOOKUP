import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Format standard des images d'aperçu de lien (Open Graph / Twitter). */
export const OG_SIZE = { width: 1200, height: 630 };

let logoCache: string | null = null;

async function logoDataUrl(): Promise<string> {
  if (!logoCache) {
    const file = await readFile(join(process.cwd(), "public", "logo", "pro-lookup-symbole.png"));
    logoCache = `data:image/png;base64,${file.toString("base64")}`;
  }
  return logoCache;
}

/**
 * Image d'aperçu PRO-LOOKUP : bandeau bleu nuit, logo, et contenu principal
 * (photo + nom + grade pour un profil, titre + auteur pour une publication).
 */
export async function brandedOgImage({
  eyebrow,
  title,
  subtitle,
  photo,
  initials,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  photo?: string | null;
  initials?: string;
  badge?: string | null;
}) {
  const logo = await logoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0A2540 0%, #0A2540 60%, #13375C 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 72, height: 72, borderRadius: 18, background: "white", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={60} height={60} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>PRO-LOOKUP</div>
            <div style={{ fontSize: 20, color: "#9FB3C8", letterSpacing: 2 }}>UNIVERSITÉ ZTF — BERTOUA</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          {(photo || initials) && (
            <div
              style={{
                display: "flex",
                width: 230,
                height: 230,
                borderRadius: 999,
                border: "8px solid #D4A24C",
                overflow: "hidden",
                background: "#13375C",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 90,
                fontWeight: 800,
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} width={230} height={230} style={{ objectFit: "cover" }} alt="" />
              ) : (
                initials
              )}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 24, color: "#00A9A5", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</div>
            <div style={{ fontSize: title.length > 60 ? 48 : 64, fontWeight: 800, lineHeight: 1.1, marginTop: 12 }}>{title}</div>
            {badge && (
              <div style={{ display: "flex", marginTop: 20 }}>
                <div style={{ background: "#D4A24C", color: "#0A2540", fontSize: 24, fontWeight: 800, padding: "8px 20px", borderRadius: 999, textTransform: "uppercase" }}>
                  {badge}
                </div>
              </div>
            )}
            {subtitle && <div style={{ fontSize: 28, color: "#C9D6E3", marginTop: 18 }}>{subtitle}</div>}
          </div>
        </div>

        <div style={{ display: "flex", height: 8, borderRadius: 8, background: "linear-gradient(90deg, #00A9A5, #D4A24C)" }} />
      </div>
    ),
    OG_SIZE,
  );
}

/** Une image distante n'est utilisable que si elle est joignable ; sinon on retombe sur les initiales. */
export async function reachable(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2000) });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}
