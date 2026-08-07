import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleLayout } from "../module-layout";
import { requireAuth } from "@/lib/auth";
import { modules } from "@/lib/modules";

export async function generateMetadata({ params }: { params: Promise<{ moduleId: string }> }): Promise<Metadata> {
  const { moduleId } = await params;
  const qaModule = modules.find((item) => item.id === moduleId);
  return { title: qaModule ? `${qaModule.title} | QA Central` : "Module | QA Central" };
}

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const qaModule = modules.find((item) => item.id === moduleId && item.id !== "test-case-generator");
  if (!qaModule) notFound();

  const profile = await requireAuth();
  const username = profile?.displayName ?? profile?.username ?? "there";

  return (
    <ModuleLayout module={qaModule} username={username}>
      <section id="overview" aria-labelledby="coming-soon-title" className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 id="coming-soon-title" className="text-lg font-semibold">Coming Soon</h2>
        <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-400">This module is registered and routed, but its production workflow is not available yet.</p>
      </section>
      <section id="reports" aria-label="Placeholder content" className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Placeholder content area</p>
      </section>
    </ModuleLayout>
  );
}
