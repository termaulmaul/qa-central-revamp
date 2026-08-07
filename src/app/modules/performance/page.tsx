"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, LayoutDashboard, Play, List, History, 
  Clock, BookOpen, Folder, Network, Settings as SettingsIcon, Activity,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon
} from 'lucide-react';
import { modules } from "@/lib/modules";
import { useCurrentUser, triggerSignOut } from "@/lib/use-current-user";
import { useTheme, setTheme } from "@/lib/theme-store";
import './legacy-theme.css';

// Import Tabs
import { PerformanceQueue } from './tabs/PerformanceQueueTab';
import { RunHistory } from './tabs/RunHistoryTab';
import { CronScheduler } from './tabs/CronSchedulerTab';
import { ApiCatalog } from './tabs/ApiCatalogTab';
import { Projects } from './tabs/ProjectsTab';
import { Webhooks } from './tabs/WebhooksTab';
import { Settings } from './tabs/SettingsTab';
import { Overview as ExecuteTest } from './tabs/ExecuteTestTab';

type DashboardRun = {
  id: string | number;
  script: string;
  startedAt: string;
  state?: string;
};

type DashboardSummary = {
  healthScore?: number | null;
  cpuPercent?: number | null;
  memoryPercent?: number | null;
  activeRunners?: number | null;
  verdicts: string[];
  recent: DashboardRun[];
};

type SystemStatus = {
  memoryTotalGb?: number | null;
  memoryUsedGb?: number | null;
  loadAvg?: number | number[] | null;
};

type DashboardTrends = { runs?: DashboardRun[] };

const IconButton = ({ icon: Icon, onClick, className = '', active = false }: { icon: React.ElementType, onClick?: () => void, className?: string, active?: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-md spring-transition
      ${active 
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' 
        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 hover:text-zinc-700'} 
      ${className}`}
  >
    <Icon size={18} strokeWidth={1.5} />
  </button>
);

export default function PerformanceModulePage() {
  const moduleInfo = modules.find((item) => item.id === "performance")!;
  const { user } = useCurrentUser();
  const username = user?.displayName ?? user?.username ?? "there";
  
  const [activeTab, setActiveTab] = useState('pt-dash');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Dashboard states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [runs, setRuns] = useState<DashboardRun[]>([]);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const menus = [
    { id: 'pt-dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pt-run', label: 'Execute Test', icon: Play },
    { id: 'pt-queue', label: 'Performance Queue', icon: List },
    { id: 'pt-hist', label: 'Run History', icon: History },
    { id: 'pt-sch', label: 'Cron Scheduler', icon: Clock },
    { id: 'pt-cat', label: 'API Catalog', icon: BookOpen },
    { id: 'overview', label: 'Projects', icon: Folder },
    { id: 'pt-hook', label: 'Webhooks', icon: Network },
    { id: 'pt-cfg', label: 'Settings', icon: SettingsIcon }
  ];

  const load = useCallback(() => {
    const id = ++requestId.current;
    let pending = 3;
    setLoading(true);
    setError('');
    const query = ''; 
    const fail = (cause: unknown, clear: () => void) => {
      if (id !== requestId.current) return;
      clear();
      setError((current) => current || (cause instanceof Error ? cause.message : 'Unable to load dashboard'));
    };
    const complete = () => {
      pending -= 1;
      if (id === requestId.current && pending === 0) setLoading(false);
    };

    const fetchJson = async (res: Response) => {
      if (res.ok) return res.json();
      const body = await res.json().catch(() => null);
      throw new Error(typeof body?.error === 'string' ? body.error : 'Unable to load dashboard');
    }

    fetch(`/api/dashboard/summary${query}`).then(fetchJson)
      .then((data) => id === requestId.current && setSummary(data as DashboardSummary))
      .catch((err) => fail(err, () => setSummary(null))).finally(complete);
    fetch(`/api/dashboard/trends${query}`).then(fetchJson)
      .then((data) => {
        const trends = data as DashboardTrends;
        if (id === requestId.current) setRuns(Array.isArray(trends.runs) ? trends.runs : []);
      })
      .catch((err) => fail(err, () => setRuns([]))).finally(complete);
    fetch(`/api/sys-status${query}`).then(fetchJson)
      .then((data) => id === requestId.current && setSystem(data))
      .catch((err) => fail(err, () => setSystem(null))).finally(complete);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unavailable = (value: number | null | undefined, suffix = '') => value === null || value === undefined ? 'Unavailable' : `${value.toFixed(1).replace(/\.0$/, '')}${suffix}`;
  const timestamp = (value: string | null | undefined) => {
    if (!value) return 'Unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
  };

  const successfulRuns = runs.filter((run) => run.state === 'succeeded').length;
  const noMetrics = !system || (system.memoryTotalGb == null && system.memoryUsedGb == null && system.loadAvg == null);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white font-sans text-zinc-900 selection:bg-blue-500/30 dark:bg-zinc-950 dark:text-zinc-100">
      <aside 
        className={`hidden h-full flex-col border-r border-zinc-200 bg-white spring-transition dark:border-zinc-800 dark:bg-zinc-950 md:flex ${isCollapsed ? 'w-16' : 'w-[240px]'}`}
        style={{ minWidth: isCollapsed ? '64px' : '240px' }}
      >
        {/* Workspace Header */}
        <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                QA
              </div>
              <span className="font-semibold text-sm truncate">Central Dashboard</span>
            </div>
          )}
          <IconButton 
            icon={isCollapsed ? ChevronRight : ChevronLeft} 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={isCollapsed ? 'mx-auto' : ''}
          />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <Link
            href="/modules"
            aria-label="Back to Menu"
            title="Back to Menu"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            {!isCollapsed && <span className="truncate">Back to Menu</span>}
          </Link>
          
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
          
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveTab(menu.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm group
                ${activeTab === menu.id 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200'}`}
            >
              <menu.icon size={16} strokeWidth={1.5} className={activeTab === menu.id ? 'text-blue-600 dark:text-blue-400' : ''} />
              {!isCollapsed && <span className="truncate">{menu.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex flex-col gap-1">
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900/70">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white uppercase">
                {(user.username ?? user.displayName ?? user.email ?? '?').slice(0, 2)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {user.displayName ?? user.username ?? user.email}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-blue-500 font-semibold">
                    {user.role}
                  </span>
                </div>
              )}
              {!isCollapsed && (
                <IconButton
                  icon={LogOut}
                  onClick={() => triggerSignOut()}
                  className="shrink-0 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-500/10"
                />
              )}
            </div>
          )}
          <button 
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200 spring-transition text-sm"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      <section className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] dark:bg-zinc-950 dark:shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <header className="sticky top-0 z-10 flex min-h-12 shrink-0 items-center border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/modules" className="hover:text-zinc-900 dark:hover:text-zinc-100">QA Central</Link>
            <span className="px-2">/</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{moduleInfo.title}</span>
          </p>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'pt-dash' && (
            <div className="pt-page-stack">
              <div className="shrink-0 mb-6">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{moduleInfo.title}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{moduleInfo.description}</p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" aria-busy={loading}>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-4">Health Score</span>
                  <div>
                    <strong className="block text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">{summary ? unavailable(summary.healthScore) : 'Unavailable'}</strong>
                    <small className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">DB-derived</small>
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-4">CPU Usage</span>
                  <div>
                    <strong className="block text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">{summary ? unavailable(summary.cpuPercent, '%') : 'Unavailable'}</strong>
                    <small className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Grafana · 10.184.120.48</small>
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-4">Memory Usage</span>
                  <div>
                    <strong className="block text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">{summary ? unavailable(summary.memoryPercent, '%') : 'Unavailable'}</strong>
                    <small className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Grafana · 10.184.120.48</small>
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-4">K6 Processes</span>
                  <div>
                    <strong className="block text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">{summary ? String(summary.activeRunners || 0) : 'Unavailable'}</strong>
                    <small className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Active project jobs</small>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col min-h-0 space-y-6">
                  <div className="panel h-64">
                    <div className="ph">
                      <h3>Verdict Trend</h3>
                      <span className="ph-meta">SUCCEEDED {summary?.verdicts.filter(v => v === 'SUCCEEDED').length || 0} / {summary?.verdicts.length || 0} RUNS</span>
                    </div>
                    <div className="panel-body flex items-end gap-1 relative pt-10 pb-0">
                      {!summary?.verdicts.length ? (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm italic">
                          No project runs available.
                        </div>
                      ) : (
                        summary.verdicts.map((v, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80 ${v === 'SUCCEEDED' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ height: `${Math.max(10, (i * 37) % 90 + 10)}%` }}
                            title={v}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <div className="panel overflow-hidden">
                    <table className="mock w-full">
                      <thead>
                        <tr>
                          <th>Target Script</th>
                          <th className="text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.recent.length ? (
                          summary.recent.map((run) => (
                            <tr key={run.id}>
                              <td className="font-mono text-xs">{run.script}</td>
                              <td className="text-right text-xs text-zinc-500">{new Date(run.startedAt).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={2} className="empty-state py-8">No project runs available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="panel h-full">
                    <div className="ph">
                      <h3>System Details</h3>
                    </div>
                    <div className="panel-body">
                      {!system ? (
                        <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-500 text-sm italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[200px]">
                          No DB-backed system metrics available
                        </div>
                      ) : (
                        <div className="space-y-4 font-mono text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-xs">Memory Total:</span>
                            <span className="font-mono text-sm">{unavailable(system?.memoryTotalGb, ' GB')}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-xs">Memory Used:</span>
                            <span className="font-mono text-sm">{unavailable(system?.memoryUsedGb, ' GB')}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                            <span className="text-zinc-500 text-xs">Load Average:</span>
                            <span className="font-mono text-sm">{Array.isArray(system?.loadAvg) ? system.loadAvg.join(', ') : unavailable(system?.loadAvg)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'pt-queue' && <PerformanceQueue />}
          {activeTab === 'pt-hist' && <RunHistory />}
          {activeTab === 'pt-sch' && <CronScheduler />}
          {activeTab === 'pt-cat' && <ApiCatalog />}
          {activeTab === 'overview' && <Projects />}
          {activeTab === 'pt-hook' && <Webhooks />}
          {activeTab === 'pt-cfg' && <Settings />}
          {activeTab === 'pt-run' && <ExecuteTest onNavigate={setActiveTab} />}
        </div>
      </section>
    </main>
  );
}
