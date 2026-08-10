"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Activity, ActivitySquare, ArrowUpDown, BarChart2, Book, CalendarDays,
  CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, Database, FileText,
  Folder, GitCompareArrows, History, KeyRound, Layers, LayoutDashboard, List, LogOut,
  Moon, Play, Plug, RefreshCw, Server, Settings as SettingsIcon, ShieldCheck,
  Smartphone, Sun, Target, TrendingDown, TrendingUp, TriangleAlert, Users, Webhook,
  Wrench, Zap, type LucideIcon,
} from "lucide-react";
import type { QaModule } from "@/lib/modules";
import { MODULE_MENUS, isMenuItem, type MenuIconName } from "@/lib/module-menus";
import { useCurrentUser, triggerSignOut } from "@/lib/use-current-user";
import { useTheme, setTheme } from "@/lib/theme-store";

const ICONS: Record<MenuIconName, LucideIcon> = {
  dashboard: LayoutDashboard, execute: Play, queue: List, history: History,
  catalog: Book, projects: Folder, cron: Clock, webhook: Webhook,
  settings: SettingsIcon, users: Users, access: ShieldCheck, document: FileText,
  connector: Plug, gitCompare: GitCompareArrows, checkCircle: CheckCircle2,
  refresh: RefreshCw, zap: Zap, trendingUp: TrendingUp, trendingDown: TrendingDown,
  arrowUpDown: ArrowUpDown, target: Target, key: KeyRound, layers: Layers,
  clipboard: ClipboardList, alert: TriangleAlert, smartphone: Smartphone,
  server: Server, database: Database, activity: Activity,
  activitySquare: ActivitySquare, calendar: CalendarDays, barChart: BarChart2,
  wrench: Wrench,
};

// Each module page is its own route, so the layout remounts on every nav click.
// Persisting the collapsed state keeps the sidebar from popping back open on
// every navigation (the Performance module gets this for free — it never
// remounts, being a single page with local tab state).
const COLLAPSE_KEY = "qa-module-sidebar-collapsed";

type ModuleLayoutProps = {
  module: QaModule;
  username: string;
  children: React.ReactNode;
};

const rowBase = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const rowIdle =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200";
const rowActive = "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white";

export function ModuleLayout({ module, username, children }: ModuleLayoutProps) {
  const pathname = usePathname();
  const menus = MODULE_MENUS[module.id] ?? [];
  const { user } = useCurrentUser();
  const theme = useTheme();
  const isDarkMode = theme === "dark";

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read after mount: localStorage is unavailable during SSR, and reading it
  // in the initial state would desync hydration.
  useEffect(() => {
    setIsCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Storage unavailable — the choice just won't survive navigation.
      }
      return next;
    });
  };

  const href = (menuId: string) => `/modules/${module.id}/${menuId}`;
  const isActive = (menuId: string) => pathname === href(menuId);
  const displayName = user?.displayName ?? user?.username ?? username;
  const initials = (user?.username ?? user?.displayName ?? user?.email ?? username ?? "?").slice(0, 2);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside
        className={`hidden h-full shrink-0 flex-col border-r border-zinc-200 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-950 md:flex ${
          isCollapsed ? "w-16" : "w-[240px]"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">QA</div>
              <span className="truncate text-sm font-semibold">{module.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 ${
              isCollapsed ? "mx-auto" : ""
            }`}
          >
            {isCollapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
          </button>
        </div>

        <nav aria-label={`${module.name} navigation`} className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <Link href="/modules" title="Back to Menu" className={`${rowBase} ${rowIdle}`}>
            <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="truncate">Back to Menu</span>}
          </Link>

          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

          {menus.map((menu, index) => {
            if (!isMenuItem(menu)) {
              return isCollapsed ? (
                <div key={`group-${index}`} className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
              ) : (
                <p
                  key={`group-${index}`}
                  className="mt-3 px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                >
                  {menu.label}
                </p>
              );
            }

            const Icon = menu.icon ? ICONS[menu.icon] : null;

            // Parents with sub-items are section headers, not destinations —
            // matching the reference, where only leaves are navigable.
            if (menu.subItems?.length) {
              if (isCollapsed) {
                return (
                  <p
                    key={menu.id}
                    title={menu.label}
                    className="flex items-center justify-center px-3 py-2 text-zinc-400 dark:text-zinc-500"
                  >
                    {Icon ? <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
                  </p>
                );
              }
              return (
                <div key={menu.id} className="space-y-0.5">
                  <p className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {Icon ? <Icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" /> : null}
                    <span className="truncate">{menu.label}</span>
                  </p>
                  <div className="ml-4 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {menu.subItems.map((sub) => (
                      <Link
                        key={sub.id}
                        href={href(sub.id)}
                        aria-current={isActive(sub.id) ? "page" : undefined}
                        className={`${rowBase} ${isActive(sub.id) ? rowActive : rowIdle}`}
                      >
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={menu.id}
                href={href(menu.id)}
                title={menu.label}
                aria-current={isActive(menu.id) ? "page" : undefined}
                className={`${rowBase} ${isActive(menu.id) ? rowActive : rowIdle} ${isCollapsed ? "justify-center" : ""}`}
              >
                {Icon ? (
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={`shrink-0 ${isActive(menu.id) ? "text-blue-600 dark:text-blue-400" : ""}`}
                    aria-hidden="true"
                  />
                ) : null}
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{menu.label}</span>
                    {menu.n !== undefined ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {menu.n}
                      </span>
                    ) : null}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex shrink-0 flex-col gap-1 border-t border-zinc-200 p-2 dark:border-zinc-800">
          <div className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/70">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold uppercase text-white">
              {initials}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span>
                  {user?.role ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">{user.role}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={triggerSignOut}
                  aria-label="Log out"
                  title="Log out"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
            className={`${rowBase} ${rowIdle} ${isCollapsed ? "justify-center" : ""}`}
          >
            <span className="flex size-5 shrink-0 items-center justify-center">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </span>
            {!isCollapsed && <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>
      </aside>

      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <header className="flex min-h-12 shrink-0 items-center border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/modules" className="hover:text-zinc-900 dark:hover:text-zinc-100">QA Central</Link>
            <span className="px-2">/</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{module.title}</span>
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
        </div>
      </section>
    </main>
  );
}
