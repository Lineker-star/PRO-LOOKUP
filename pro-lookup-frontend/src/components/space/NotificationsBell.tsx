"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { InAppNotification, NotificationsResponse } from "@/lib/types";

/** Cloche du centre de notifications : compteur de non-lues, liste déroulante, marquage comme lu. */
export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const inbox = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<NotificationsResponse>("/me/notifications"),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = inbox.data?.unread_count ?? 0;

  const markRead = async (item: InAppNotification) => {
    if (!item.read) {
      await api(`/me/notifications/${item.id}/read`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const markAll = async () => {
    await api("/me/notifications/read-all", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} non lue(s)` : "Notifications"}
        className="relative inline-flex size-10 items-center justify-center rounded-xl border border-line bg-white text-navy transition hover:border-navy"
      >
        <Icon name="notifications" size={22} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-float">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold text-navy">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-teal-text hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          {inbox.data && inbox.data.data.length > 0 ? (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {inbox.data.data.map((item) => (
                <li key={item.id} className={item.read ? "bg-white" : "bg-teal-soft/40"}>
                  <NotificationRow item={item} onOpen={() => { markRead(item); setOpen(false); }} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">Aucune notification pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item, onOpen }: { item: InAppNotification; onOpen: () => void }) {
  const content = (
    <>
      <p className="text-sm font-semibold text-navy">{item.title}</p>
      {item.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.body}</p>}
      <p className="mt-1 text-[11px] text-muted">{formatDateTime(item.created_at)}</p>
    </>
  );

  if (!item.action_url) {
    return <button type="button" onClick={onOpen} className="block w-full px-4 py-3 text-left">{content}</button>;
  }
  // Les liens de l'application restent internes ; les liens externes ouvrent un nouvel onglet.
  const external = /^https?:\/\//.test(item.action_url) && !item.action_url.startsWith(window.location.origin);
  if (external) {
    return (
      <a href={item.action_url} target="_blank" rel="noopener noreferrer" onClick={onOpen} className="block px-4 py-3">
        {content}
      </a>
    );
  }
  const path = item.action_url.replace(/^https?:\/\/[^/]+/, "");
  return (
    <Link href={path} onClick={onOpen} className="block px-4 py-3">
      {content}
    </Link>
  );
}
