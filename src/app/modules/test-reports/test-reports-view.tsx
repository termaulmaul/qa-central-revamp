"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, ClipboardList, Layers, Loader2, RefreshCw, Save } from "lucide-react";
import { fmtInt, fmtPct, type ApiMetricRow } from "@/app/modules/performance/utils/report-metrics";

interface Project {
  id: string;
  name: string;
}

interface LiveSummary {
  generatedAt: string;
  projectId: string | null;
  runsSampled: number;
  rows: ApiMetricRow[];
  total: ApiMetricRow;
  queue: { counts: Record<string, number>; total: number };
}

interface TestReport {
  id: string;
  projectId: string | null;
  name: string;
  summary: Record<string, unknown>;
  createdAt: string;
}

const QUEUE_STATUS_LABELS: [string, string][] = [
  ["queued", "Queued"],
  ["running", "Running"],
  ["succeeded", "Succeeded"],
  ["failed", "Failed"],
  ["cancelled", "Cancelled"],
];

async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
}

// Duration-specific display formatting (ms -> human string). report-metrics.ts
// only exports plain-number/percent formatters (fmtInt/fmtPct, reused below for
// counts and error rates) — it has no ms-duration formatter, so this stays local.
function fmtDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function TestReportsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");

  const [summary, setSummary] = useState<LiveSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [reports, setReports] = useState<TestReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [reportName, setReportName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "ok" | "err">("idle");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((body: { projects?: Project[] }) => setProjects(Array.isArray(body.projects) ? body.projects : []))
      .catch(() => setProjects([]));
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
      const res = await fetch(`/api/reports/live-summary${query}`);
      if (!res.ok) throw new Error(await responseError(res));
      setSummary((await res.json()) as LiveSummary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Unable to load live summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [projectId]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
      const res = await fetch(`/api/reports${query}`);
      if (!res.ok) throw new Error(await responseError(res));
      const body = (await res.json()) as { reports: TestReport[] };
      setReports(Array.isArray(body.reports) ? body.reports : []);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : "Unable to load saved reports");
    } finally {
      setReportsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const saveReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!summary || !reportName.trim()) return;
    setSaving(true);
    setSaveState("idle");
    setSaveError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectId || undefined, name: reportName.trim(), summary }),
      });
      if (!res.ok) throw new Error(await responseError(res));
      setSaveState("ok");
      setReportName("");
      void loadReports();
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("err");
      setSaveError(err instanceof Error ? err.message : "Unable to save report");
      setTimeout(() => setSaveState("idle"), 4000);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = summary?.total;
  const queueCounts = summary?.queue.counts ?? {};

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Live Summary</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadSummary()}
            disabled={summaryLoading}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`size-4 ${summaryLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {summaryError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {summaryError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Runs Sampled</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{summary ? fmtInt(summary.runsSampled) : "—"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Duration</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{total ? fmtDurationMs(total.avgMs) : "—"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Error Rate</p>
            <p
              className={`mt-2 text-2xl font-bold tracking-tight ${
                total && total.errorRatePct > 0 ? "text-rose-600 dark:text-rose-400" : ""
              }`}
            >
              {total ? fmtPct(total.errorRatePct) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Queue Jobs</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{summary ? fmtInt(summary.queue.total) : "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUEUE_STATUS_LABELS.map(([key, label]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
            >
              {label}: {fmtInt(queueCounts[key] ?? 0)}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Script</th>
                <th className="px-4 py-3 font-medium">Samples</th>
                <th className="px-4 py-3 font-medium">Avg</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium">Max</th>
                <th className="px-4 py-3 font-medium">P95</th>
                <th className="px-4 py-3 font-medium">Errors</th>
                <th className="px-4 py-3 font-medium">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(summary?.rows ?? []).map((row) => (
                <tr key={row.api} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.api}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtInt(row.samples)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtDurationMs(row.avgMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtDurationMs(row.minMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtDurationMs(row.maxMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtDurationMs(row.p95Ms)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{fmtInt(row.errorSample)}</td>
                  <td
                    className={`px-4 py-3 font-mono text-xs ${
                      row.errorRatePct > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {fmtPct(row.errorRatePct)}
                  </td>
                </tr>
              ))}
              {!summaryLoading && (summary?.rows.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No run history available yet.
                  </td>
                </tr>
              )}
              {summaryLoading && !summary && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
            {summary && summary.rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-800 dark:bg-zinc-900/60">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtInt(summary.total.samples)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDurationMs(summary.total.avgMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDurationMs(summary.total.minMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDurationMs(summary.total.maxMs)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDurationMs(summary.total.p95Ms)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtInt(summary.total.errorSample)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtPct(summary.total.errorRatePct)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <form
          onSubmit={saveReport}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <input
            required
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="Report name, e.g. Nightly Regression — Aug 8"
            className="min-w-64 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={saving || !summary || !reportName.trim()}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              saveState === "ok" ? "bg-emerald-600" : saveState === "err" ? "bg-rose-600" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {saving ? "Saving…" : saveState === "ok" ? "Saved" : saveState === "err" ? "Failed" : "Save as Report"}
          </button>
          {saveError && <p className="w-full text-sm text-rose-600 dark:text-rose-400">{saveError}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Saved Reports</h2>
        </div>

        {reportsError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {reportsError}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {reports.length === 0 && !reportsLoading ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No saved reports yet. Use &ldquo;Save as Report&rdquo; above to persist the current live summary.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {reports.map((report) => {
                const isOpen = expanded.has(report.id);
                return (
                  <li key={report.id} className="bg-white dark:bg-zinc-950">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(report.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
                        )}
                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{report.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {JSON.stringify(report.summary, null, 2)}
                        </pre>
                      </div>
                    )}
                  </li>
                );
              })}
              {reportsLoading && reports.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
