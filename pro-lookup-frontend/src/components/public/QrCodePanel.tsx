"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type QrLabels = { alt: string; png: string; svg: string; hint: string };

const FRENCH: QrLabels = {
  alt: "QR code menant à {url}",
  png: "Télécharger en PNG",
  svg: "Télécharger en SVG",
  hint: "À imprimer sur une carte de visite, une affiche ou une diapositive de conférence.",
};

/** QR code de l'URL du profil, téléchargeable en PNG et SVG (brief §6.5). Libellés traduits sur le profil public. */
export function QrCodePanel({ url, fileName, labels = FRENCH }: { url: string; fileName: string; labels?: QrLabels }) {
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    const options = { margin: 2, width: 600, color: { dark: "#0A2540", light: "#FFFFFF" }, errorCorrectionLevel: "M" as const };
    QRCode.toDataURL(url, options).then(setPng);
    QRCode.toString(url, { ...options, type: "svg" }).then(setSvg);
  }, [url]);

  const download = (href: string, ext: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = `${fileName}.${ext}`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element -- image générée localement (data URL)
          <img src={png} alt={labels.alt.replace("{url}", url)} className="size-56" />
        ) : (
          <div className="size-56 animate-pulse rounded-lg bg-mist" />
        )}
      </div>
      <p className="break-all text-center text-sm font-medium text-navy">{url}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" size="sm" icon="download" disabled={!png} onClick={() => png && download(png, "png")}>
          {labels.png}
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon="download"
          disabled={!svg}
          onClick={() => svg && download(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, "svg")}
        >
          {labels.svg}
        </Button>
      </div>
      <p className="text-center text-xs text-muted">{labels.hint}</p>
    </div>
  );
}
