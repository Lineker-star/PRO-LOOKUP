"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import type { Lang } from "@/lib/i18n";

export function Providers({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider lang={lang}>
        <AuthProvider>{children}</AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
