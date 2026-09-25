"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api/client";

const schema = z.object({
  email: z.string().min(1, "Saisissez votre email.").email("Adresse email invalide."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** Formulaire de connexion. Redirection selon le compte après connexion (brief §5.3). */
export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const me = await login(values.email, values.password, values.remember);
      const from = params.get("depuis");
      // Un enseignant approuvé revient sur la page d'où il venait ; sinon, page d'accueil de son compte.
      const target = from && from.startsWith("/") && !from.startsWith("//") && me.status === "approved" && me.role === "teacher" ? from : homeFor(me);
      router.replace(target);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? (e.field("email") ?? e.message) : "Connexion impossible.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {params.get("expire") && <Alert tone="warning">Votre session a expiré. Reconnectez-vous pour continuer.</Alert>}
      {params.get("reinitialise") && <Alert tone="success">Votre mot de passe a été modifié. Vous pouvez vous connecter.</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <Field label="Email" htmlFor="login-email" error={formState.errors.email?.message} required>
        <Input id="login-email" type="email" autoComplete="email" icon="mail" placeholder="prenom.nom@exemple.cm" invalid={!!formState.errors.email} {...register("email")} />
      </Field>

      <Field label="Mot de passe" htmlFor="login-password" error={formState.errors.password?.message} required>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            icon="key"
            className="pr-11"
            invalid={!!formState.errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-navy"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
          </button>
        </div>
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" className="size-4 rounded border-line accent-navy" {...register("remember")} />
          Rester connecté
        </label>
        <Link href="/mot-de-passe-oublie" className="font-semibold text-teal-text hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" variant="accent" size="lg" full iconRight="arrow_forward" loading={formState.isSubmitting}>
        Se connecter
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4 text-sm">
        <span className="flex items-center gap-2 text-ink">
          <Icon name="how_to_reg" size={20} className="text-teal-text" />
          Vous êtes enseignant et n’avez pas de compte ?
        </span>
        <Link href="/inscription" className="inline-flex items-center gap-1 font-semibold text-teal-text hover:underline">
          Demander un accès <Icon name="chevron_right" size={18} />
        </Link>
      </div>
    </form>
  );
}
