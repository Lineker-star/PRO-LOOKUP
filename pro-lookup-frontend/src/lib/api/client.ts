import { PUBLIC_API_URL } from "@/lib/config";
import { clearSession, getToken } from "@/lib/session";

/**
 * Client HTTP unique du navigateur (zones B et C), configuré pour Sanctum :
 * le jeton est envoyé en `Authorization: Bearer …`. Les erreurs de l'API
 * (message + erreurs par champ) sont remontées dans une ApiError.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }

  /** Premier message d'erreur d'un champ, pour l'afficher sous l'input. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; query?: Record<string, unknown> };

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let url = `${PUBLIC_API_URL}${path}`;
  if (options.query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    if (qs.toString()) url += `?${qs}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, body });
  } catch {
    throw new ApiError(0, "Le serveur est injoignable. Vérifiez votre connexion et réessayez.");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Jeton expiré ou révoqué : on nettoie la session locale.
    if (response.status === 401) clearSession();
    const message =
      response.status === 429
        ? "Trop de tentatives. Patientez une minute avant de réessayer."
        : (data?.message as string) || "Une erreur est survenue.";
    throw new ApiError(response.status, message, (data?.errors as Record<string, string[]>) ?? {});
  }

  return data as T;
}

/** Télécharge un fichier protégé (ex. justificatif) et l'ouvre dans un nouvel onglet. */
export async function openProtectedFile(path: string) {
  const token = getToken();
  const response = await fetch(`${PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token ?? ""}`, Accept: "*/*" },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, data?.message ?? "Fichier indisponible.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
