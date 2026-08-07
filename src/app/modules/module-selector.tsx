"use client";

import { useState } from "react";
import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileBarChart,
  FlaskConical,
  GitBranch,
  HeartPulse,
  LineChart,
  LogOut,
  Settings2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { QaModule } from "@/lib/modules";
import { triggerSignOut } from "@/lib/use-current-user";
import { ThemeToggle } from "@/app/login/theme-toggle";

const iconMap = {
  activity: Activity,
  chart: LineChart,
  bot: Bot,
  flask: FlaskConical,
  heart: HeartPulse,
  phone: Smartphone,
  git: GitBranch,
  orders: ChartNoAxesCombined,
  reports: FileBarChart,
  settings: Settings2,
  regression: ClipboardCheck,
  users: ShieldCheck,
} as const;

const statusStyles = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  Beta: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  "Coming Soon": "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  Disabled: "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600",
} as const;

export function ModuleSelector({ modules, username }: { modules: QaModule[]; username: string }) {
  const router = useRouter();
  const [language, setLanguage] = useState<"ID" | "EN">("EN");

  function selectModule(module: QaModule) {
    if (!module.enabled || (module.status !== "Available" && module.status !== "Beta")) return;
    window.localStorage.setItem("qa-last-module", module.id);
    router.push(module.route);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-8 text-zinc-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 dark:text-zinc-50 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setLanguage((current) => (current === "EN" ? "ID" : "EN"))}
            aria-label={`Switch language to ${language === "EN" ? "Indonesian" : "English"}`}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {language}
          </button>
          <button
            type="button"
            onClick={triggerSignOut}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Logout
          </button>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-8rem)] flex-col justify-center py-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-400">QA CENTRAL</p>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Welcome back, {username}</h1>
            <p className="mt-4 text-pretty text-lg leading-7 text-zinc-600 dark:text-zinc-400">Select a module to view the dashboard and monitoring tools.</p>
          </div>

          <section aria-label="QA Central modules" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const isAvailable = module.enabled && (module.status === "Available" || module.status === "Beta");
              const Icon = iconMap[module.icon];
              return (
                <button
                  key={module.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => selectModule(module)}
                  title={!isAvailable ? `${module.name} is ${module.status.toLowerCase()}` : `Open ${module.name}`}
                  className="group flex min-h-64 flex-col items-center rounded-2xl border border-zinc-200/80 bg-white/85 p-6 text-center shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-zinc-200 disabled:hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:shadow-black/20 dark:focus-visible:ring-offset-zinc-950"
                >
                  <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-zinc-50 text-blue-600 transition-transform group-hover:scale-105 dark:bg-zinc-800 dark:text-blue-300">
                    <Icon className="size-7" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col gap-3">
                    <span className="text-lg font-semibold leading-6">{module.name}</span>
                    <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{module.description}</span>
                  </span>
                  <span className={`mt-5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[module.status]}`}>
                    {module.status}
                  </span>
                </button>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
