"use client";

import Link from "next/link";
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
  const [language, setLanguage] = useState<"ID" | "EN">("EN");

  function rememberModule(module: QaModule) {
    window.localStorage.setItem("qa-last-module", module.id);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-4 text-zinc-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 dark:text-zinc-50 sm:px-8 lg:px-12">
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

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] flex-col justify-center py-2">
          <div className="mx-auto mb-4 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-400">QA CENTRAL</p>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">Welcome back, {username}</h1>
            <p className="mt-4 text-pretty text-lg leading-7 text-zinc-600 dark:text-zinc-400">Select a module to view the dashboard and monitoring tools.</p>
          </div>

          <section aria-label="QA Central modules" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {modules.map((module) => {
              const isAvailable = module.enabled;
              const Icon = iconMap[module.icon];
              return (
                <Link
                  key={module.id}
                  href={module.route}
                  onClick={(event) => {
                    if (!isAvailable) {
                      event.preventDefault();
                      return;
                    }
                    rememberModule(module);
                  }}
                  aria-disabled={!isAvailable}
                  tabIndex={isAvailable ? 0 : -1}
                  title={!isAvailable ? `${module.name} is ${module.status.toLowerCase()}` : `Open ${module.name}`}
                  className="group flex min-h-0 flex-col items-center rounded-2xl border border-zinc-200/80 bg-white/85 p-3 text-center shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 aria-disabled:hover:translate-y-0 aria-disabled:hover:border-zinc-200 aria-disabled:hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:shadow-black/20 dark:focus-visible:ring-offset-zinc-950"
                >
                  <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-zinc-50 text-blue-600 transition-transform group-hover:scale-105 dark:bg-zinc-800 dark:text-blue-300">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="text-base font-semibold leading-5">{module.name}</span>
                    <span className="line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{module.description}</span>
                  </span>
                  <span className={`mt-3 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[module.status]}`}>
                    {module.status}
                  </span>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
