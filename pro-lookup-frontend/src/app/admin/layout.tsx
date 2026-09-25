import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration · PRO-LOOKUP" },
  robots: { index: false, follow: false },
};

/** Zone C — administration : barre latérale, pas de pied de page (brief §8). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
