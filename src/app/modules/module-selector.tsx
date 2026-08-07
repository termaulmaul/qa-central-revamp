"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { QaModule } from "@/lib/modules";

const statusStyles = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  Beta: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  "Coming Soon": "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  Disabled: "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600",
} as const;

export function ModuleSelector({ modules, username }: { modules: QaModule[]; username: string }) {
  const router = useRouter();

  useEffect(() => {
    const lastModule = window.localStorage.getItem("qa-last-module");
    const rememberedModule = modules.find(
      (module) => module.id === lastModule && (module.status === "Available" || module.status === "Beta"),
    );
    if (rememberedModule && modules.filter((module) => module.status === "Available" || module.status === "Beta").length === 1) {
      router.replace(rememberedModule.route);
    }
  }, [modules, router]);

  function selectModule(module: QaModule) {
    if (module.status !== "Available" && module.status !== "Beta") return;
    window.localStorage.setItem("qa-last-module", module.id);
    router.push(module.route);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-12 text-zinc-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 dark:text-zinc-50 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-blue-600 dark:text-blue-400">QA CENTRAL</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Welcome back, {username}</h1>
          <p className="mt-4 text-pretty text-lg leading-7 text-zinc-600 dark:text-zinc-400">Choose a module to continue.</p>
        </header>

        <section aria-label="Available QA modules" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const isAvailable = module.status === "Available" || module.status === "Beta";
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => selectModule(module)}
                title={!isAvailable ? `${module.title} is ${module.status.toLowerCase()}` : undefined}
                className="group flex min-h-56 flex-col rounded-2xl border border-white/80 bg-white/75 p-6 text-left shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:shadow-black/20 dark:focus-visible:ring-offset-zinc-950"
              >
                <span className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-300">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <span className="flex flex-1 flex-col gap-2">
                  <span className="text-lg font-semibold leading-6">{module.title}</span>
                  <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{module.description}</span>
                </span>
                <span className={`mt-6 w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[module.status]}`}>
                  {module.status}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
