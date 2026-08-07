import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Sign in | QA Central",
  description: "Sign in to the QA Central test management platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const profile = await getSessionProfile();
  if (profile) redirect("/modules");

  const { redirectTo } = await searchParams;
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : "/modules";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A84FF]">
            <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">QA Central</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Sign in to your test management workspace
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40">
          <LoginForm redirectTo={safeRedirect} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-600">
          QA Central — Test Management &amp; Quality Assurance Platform
        </p>
      </div>
    </main>
  );
}
