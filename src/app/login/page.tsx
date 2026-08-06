import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { LoginForm } from "./login-form";

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
  if (profile) redirect("/");

  const { redirectTo } = await searchParams;
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A84FF]">
            <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">QA Central</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to your test management workspace
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl">
          <LoginForm redirectTo={safeRedirect} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          QA Central — Test Management &amp; Quality Assurance Platform
        </p>
      </div>
    </main>
  );
}
