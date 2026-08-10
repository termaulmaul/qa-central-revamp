"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Settings (localStorage-only, as the single-page version did) ─────────────

const SETTINGS_KEY = "api-automation.settings";

export interface StoredSettings {
  qaseToken: string;
  projectCode: string;
  llmBaseUrl: string;
  llmApiToken: string;
}

const EMPTY_SETTINGS: StoredSettings = { qaseToken: "", projectCode: "", llmBaseUrl: "", llmApiToken: "" };

export function loadSettings(): StoredSettings {
  if (typeof window === "undefined") return EMPTY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return EMPTY_SETTINGS;
    return { ...EMPTY_SETTINGS, ...(JSON.parse(raw) as Partial<StoredSettings>) };
  } catch {
    return EMPTY_SETTINGS;
  }
}

export function saveSettings(settings: StoredSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Every page under this module is its own route now, so each view that needs the
 * Qase/LLM credentials loads them itself instead of receiving them by prop from
 * a shared tab container. `ready` distinguishes "not read yet" from "read and
 * empty", so views don't flash a "configure Settings first" gate on mount.
 */
export function useApiAutomationSettings() {
  const [settings, setSettings] = useState<StoredSettings>(EMPTY_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const persist = useCallback((next: StoredSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  return { settings, ready, persist };
}

// ─── Tailwind class constants ────────────────────────────────────────────────

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
export const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
export const ghostButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";
export const cardClass = "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50";
export const panelClass = "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50";
export const noteClass =
  "rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400";
export const monoClass = "font-mono text-xs text-zinc-700 dark:text-zinc-300";
export const thClass = "px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
export const tdClass = "px-4 py-2.5 align-top text-sm text-zinc-700 dark:text-zinc-300";

// ─── Fetch helpers ───────────────────────────────────────────────────────────

export async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(await responseError(res));
  return (await res.json()) as T;
}

/** Calls the app's Qase proxy (`/api/qase/**`), which needs the token as a header. */
export async function qaseGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api/qase/${path.replace(/^\//, "")}`, {
    headers: { Token: token },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await responseError(res));
  return (await res.json()) as T;
}

// ─── Queue jobs (the module's own real data source) ──────────────────────────

export interface QueueJob {
  id: string;
  script: string | null;
  state: string;
  target: string | null;
  config: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
}

export interface HistoryQueueJob {
  id: string;
  state: "succeeded" | "failed" | "cancelled";
  script: string | null;
  target: string | null;
  config: Record<string, unknown> | null;
  runNo: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  failureReason: string | null;
}

/** Both /api/queue and /api/queue/history return untyped `config` jsonb. */
export function isApiAutomationJob(job: { config: Record<string, unknown> | null }): boolean {
  return (job.config as { kind?: string } | null)?.kind === "api-automation";
}

/** Live (queued + running) api-automation-tagged jobs from GET /api/queue. */
export function useApiAutomationQueue() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // GET /api/queue only reports jobs still in flight (current + queue); the
      // terminal ones live behind GET /api/queue/history (see HistoryView).
      const body = await getJson<{ current?: QueueJob | null; queue?: QueueJob[] }>("/api/queue");
      const all = [...(body.current ? [body.current] : []), ...(body.queue ?? [])];
      setJobs(all.filter(isApiAutomationJob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the job queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, loading, error, reload };
}

/** Terminal api-automation-tagged jobs from GET /api/queue/history. */
export function useApiAutomationHistory(pageSize = 100) {
  const [jobs, setJobs] = useState<HistoryQueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await getJson<{ jobs: HistoryQueueJob[] }>(`/api/queue/history?pageSize=${pageSize}`);
      setJobs((Array.isArray(body.jobs) ? body.jobs : []).filter(isApiAutomationJob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load run history");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, loading, error, reload };
}

/** Enqueues on the shared queue with the tag every view in this module filters on. */
export async function enqueueApiAutomationJob(script: string, config: Record<string, unknown>) {
  const res = await fetch("/api/queue/job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ script, target: null, config: { ...config, kind: "api-automation" } }),
  });
  if (!res.ok) throw new Error(await responseError(res));
  return (await res.json()) as { jobId: string; position: number };
}

// ─── Presentational helpers ─────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
      {message}
    </div>
  );
}

/**
 * Used wherever the reference page reads a backend that genuinely has no
 * counterpart in this app, so the page states the ceiling instead of rendering
 * an empty table that looks like real "no data".
 */
export function EnvironmentGapNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{title}</p>
      <div className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-300/90">{children}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {children}
      </td>
    </tr>
  );
}

export function MetricCard({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{caption ?? " "}</p>
    </div>
  );
}

const STATE_TONES: Record<string, string> = {
  queued: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  running: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  succeeded:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  cancelled: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
};

export function StateBadge({ state }: { state: string }) {
  const tone = STATE_TONES[state.toLowerCase()] ?? STATE_TONES.queued;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{state}</span>
  );
}

/** Pill row used by Baseline's env/service filters and Analytics' range picker. */
export function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</span>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              active
                ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : "—";
}

export function formatDuration(ms: number | null) {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}
