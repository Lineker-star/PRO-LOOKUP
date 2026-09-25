"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLang } from "@/components/providers/LangProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

/** Menu avatar : Mon espace, Mon profil, Mes publications, Paramètres, Se déconnecter (brief §5.3). */
export function UserMenu() {
  const { me, logout } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  if (!me) return null;

  const isAdmin = me.role === "admin";
  const approved = me.status === "approved";

  const items = isAdmin
    ? [{ href: "/admin", icon: "admin_panel_settings", label: t.admin }]
    : approved
      ? [
          { href: "/espace", icon: "space_dashboard", label: t.my_space },
          { href: me.slug ? `/in/${me.slug}` : "/espace/profil", icon: "person", label: t.my_profile },
          { href: "/espace/publications", icon: "article", label: t.my_posts },
          { href: "/espace/parametres", icon: "settings", label: t.settings },
        ]
      : [{ href: "/espace/en-attente", icon: "hourglass_top", label: t.my_space }];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-white p-1 pr-2 hover:border-navy"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={me.avatar_url} name={me.full_name} size="xs" ring={false} />
        <Icon name="expand_more" size={18} className="text-muted" />
        <span className="sr-only">Menu du compte</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-float">
          <div className="flex items-center gap-3 border-b border-line p-3">
            <Avatar src={me.avatar_url} name={me.full_name} size="sm" ring={false} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">{me.full_name}</p>
              <p className="truncate text-xs text-muted">{isAdmin ? "Administrateur" : (me.grade?.name ?? me.email)}</p>
            </div>
          </div>
          <div className="p-1.5">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
              >
                <Icon name={item.icon} size={18} className="text-muted" />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await logout();
                router.push("/");
                router.refresh();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              <Icon name="logout" size={18} />
              {t.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
