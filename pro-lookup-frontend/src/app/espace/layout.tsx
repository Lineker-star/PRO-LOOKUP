import type { Metadata } from "next";
import { SpaceShell } from "@/components/space/SpaceShell";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata: Metadata = {
  title: { default: "Mon espace", template: "%s · Mon espace · PRO-LOOKUP" },
  robots: { index: false, follow: false },
};

/** Zone B — espace enseignant : même en-tête que le site public + navigation latérale (brief §13). */
export default function SpaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <>
      <PublicHeader />
      <SpaceShell>{children}</SpaceShell>
    </>
  );
}
