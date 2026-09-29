import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getGrades, getSchools, getSuggestions } from "@/lib/api/server";

export const metadata: Metadata = { title: "S’inscrire", robots: { index: false, follow: false } };

/** Inscription d'un enseignant (brief §5.1) : école supérieure et département / filière saisis librement. */
export default async function RegisterPage() {
  const [suggestions, grades, schools] = await Promise.all([getSuggestions(), getGrades(), getSchools()]);
  return <RegisterForm suggestions={suggestions} grades={grades} schools={schools} />;
}
