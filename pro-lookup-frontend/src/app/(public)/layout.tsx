import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getDict } from "@/lib/i18n-server";

/** Zone A — pages publiques : en-tête public + pied de page. */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const t = await getDict();

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PublicFooter t={t} />
    </>
  );
}
