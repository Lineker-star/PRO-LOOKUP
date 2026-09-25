"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { clearSession, getToken, saveSession, subscribeSession, updateSessionMarker } from "@/lib/session";
import type { Me } from "@/lib/types";

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<Me>;
  /** Enregistre la session renvoyée par /auth/register. */
  startSession: (token: string, user: Me) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Page d'arrivée après connexion selon le compte (brief §5.3). */
export function homeFor(me: Pick<Me, "role" | "status">): string {
  if (me.role === "admin") return "/admin";
  return me.status === "approved" ? "/espace" : "/espace/en-attente";
}

/** Présence du jeton : lue dans le cookie côté navigateur, toujours « absent » au rendu serveur. */
function useHasToken(): boolean {
  return useSyncExternalStore(
    subscribeSession,
    () => Boolean(getToken()),
    () => false,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = useHasToken();

  const meQuery = useQuery({
    queryKey: ["me"],
    enabled: hasToken,
    queryFn: async () => (await api<{ data: Me }>("/me")).data,
    retry: false,
    staleTime: 60_000,
  });

  // Garde le marqueur rôle/statut du proxy à jour (ex. compte approuvé entre-temps).
  useEffect(() => {
    if (meQuery.data) updateSessionMarker(meQuery.data.role, meQuery.data.status);
  }, [meQuery.data]);

  // Jeton rejeté par l'API : la session locale est effacée (le cookie notifie l'interface).
  useEffect(() => {
    if (meQuery.isError) clearSession();
  }, [meQuery.isError]);

  const startSession = useCallback(
    (token: string, user: Me, remember = false) => {
      queryClient.setQueryData(["me"], user);
      saveSession(token, user.role, user.status, remember);
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const response = await api<{ token: string; user: Me }>("/auth/login", {
        method: "POST",
        body: { email, password, remember },
      });
      startSession(response.token, response.user, remember);
      return response.user;
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Déjà déconnecté côté serveur : on nettoie quand même.
    }
    clearSession();
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const setMe = useCallback((me: Me) => queryClient.setQueryData(["me"], me), [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      me: hasToken ? (meQuery.data ?? null) : null,
      loading: hasToken && meQuery.isPending,
      isAuthenticated: hasToken && Boolean(meQuery.data),
      login,
      startSession: (token, user) => startSession(token, user, false),
      logout,
      refresh,
      setMe,
    }),
    [hasToken, meQuery.data, meQuery.isPending, login, startSession, logout, refresh, setMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return context;
}
