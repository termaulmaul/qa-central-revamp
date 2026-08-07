"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BarChart3, LayoutDashboard, Settings2 } from "lucide-react";
import type { QaModule } from "@/lib/modules";

type ModuleLayoutProps = {
  module: QaModule;
  username: string;
  children: React.ReactNode;
};

const menuItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Reports", icon: BarChart3 },
  { label: "Configuration", icon: Settings2 },
];

export function ModuleLayout({ module, username, children }: ModuleLayoutProps) {
  const pathname = usePathname();

  return (
    <main className="flex min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
        <div className="flex h-12 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex size-6 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">QA</div>
          <span className="truncate text-sm font-semibold">Central Dashboard</span>
        </div>
        <nav aria-label="Module navigation" className="flex flex-1 flex-col gap-1 p-2">
          <Link href="/modules" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Back to Menu</span>
          </Link>
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
          <Link href={module.route} aria-current={pathname === module.route ? "page" : undefined} className="flex items-center gap-3 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            <LayoutDashboard className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="truncate">{module.name}</span>
          </Link>
          {menuItems.slice(1).map(({ label, icon: Icon }) => (
            <a key={label} href={`#${label.toLowerCase()}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">Signed in as {username}</div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-12 items-center border-b border-zinc-200 bg-white/90 px-4 dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6">
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400"><Link href="/modules" className="hover:text-zinc-900 dark:hover:text-zinc-100">QA Central</Link><span className="px-2">/</span><span className="font-medium text-zinc-900 dark:text-zinc-100">{module.title}</span></p>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Module</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight">{module.title}</h1>
              <p className="mt-2 max-w-2xl text-pretty leading-6 text-zinc-600 dark:text-zinc-400">{module.description}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
