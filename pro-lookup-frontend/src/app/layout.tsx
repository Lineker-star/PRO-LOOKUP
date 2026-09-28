import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { SITE_NAME, SITE_URL, UNIVERSITY_FULL } from "@/lib/config";
import { LANGS } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";

// Latin étendu (allemand, espagnol, portugais, italien, swahili…) et cyrillique (russe).
// Le chinois, le japonais et le hindi utilisent les polices du système.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — La qualité des enseignants de l’Université ZTF`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "PRO-LOOKUP, la vitrine professionnelle publique du corps enseignant de l’Université ZTF (Bertoua, Cameroun) : profils, parcours, expertises et publications.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: "fr_FR", type: "website" },
  twitter: { card: "summary_large_image" },
  // Icône du site : favicon.ico, icon.png et apple-icon.png (symbole PRO-LOOKUP) dans src/app.
  other: { "institution": UNIVERSITY_FULL },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();

  return (
    <html lang={LANGS[lang].html} className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Icônes Material Symbols (même jeu que les maquettes). « block » évite d’afficher le nom de l’icône
            en texte pendant le chargement ; la feuille est chargée une fois pour toute l’application. */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=block"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
