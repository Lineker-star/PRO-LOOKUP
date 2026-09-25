import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getFaculties, getGrades } from "@/lib/api/server";

export const metadata: Metadata = { title: "Demander un accès", robots: { index: false, follow: false } };

/** Demande d'inscription d'un enseignant (brief §5.1). */
export default async function RegisterPage() {
  const [faculties, grades] = await Promise.all([getFaculties(), getGrades()]);
  return <RegisterForm faculties={faculties} grades={grades} />;
}
