"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  EmptyRow,
  EnvironmentGapNotice,
  ErrorBanner,
  MetricCard,
  PillGroup,
  ghostButtonClass,
  monoClass,
  panelClass,
  tdClass,
  thClass,
  useApiAutomationHistory,
  type HistoryQueueJob,
} from "../api-automation-shared";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
] as const;

type Range = (typeof RANGES)[number]["value"];

const CHART_MODES = [
  { value: "jobs", label: "Jobs" },
  { value: "pass", label: "Pass" },
] as const;

type ChartMode = (typeof CHART_MODES)[number]["value"];

interface DailyEntry {
  day: string;
  jobs: number;
  pass: number;
  fail: number;
}

function dayKey(value: string | null): string | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Buckets terminal queue jobs per calendar day, newest range window last. */
function buildDaily(jobs: HistoryQueueJob[], days: number): DailyEntry[] {
  const buckets = new Map<string, DailyEntry>();
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { day: key, jobs: 0, pass: 0, fail: 0 });
  }
  for (const job of jobs) {
    const key = dayKey(job.finishedAt ?? job.createdAt);
    const bucket = key ? buckets.get(key) : undefined;
    if (!bucket) continue;
    bucket.jobs += 1;
    if (job.state === "succeeded") bucket.pass += 1;
    if (job.state === "failed") bucket.fail += 1;
  }
  return [...buckets.values()];
}

function BarChart({ data, valueKey }: { data: DailyEntry[]; valueKey: ChartMode }) {
  const max = Math.max(...data.map((entry) => entry[valueKey]), 1);
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((entry) => {
        const value = entry[valueKey];
        const height = Math.max((value / max) * 100, 2);
        return (
          <div
            key={entry.day}
            className="flex h-full flex-1 flex-col justify-end"
            title={`${entry.day} — ${entry.jobs} jobs, ${entry.pass} pass, ${entry.fail} fail`}
          >
            <div
              className={`w-full rounded-t ${value === 0 ? "bg-zinc-200 dark:bg-zinc-800" : "bg-blue-600/80 dark:bg-blue-500/70"}`}
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsView() {
  const { jobs, loading, error, reload } = useApiAutomationHistory();
  const [range, setRange] = useState<Range>("14");
  const [chartMode, setChartMode] = useState<ChartMode>("jobs");

  const daily = useMemo(() => buildDaily(jobs, Number(range)), [jobs, range]);
  const windowed = useMemo(() => {
    const keys = new Set(daily.map((entry) => entry.day));
    return jobs.filter((job) => {
      const key = dayKey(job.finishedAt ?? job.createdAt);
      return key ? keys.has(key) : false;
    });
  }, [jobs, daily]);

  const pass = windowed.filter((job) => job.state === "succeeded").length;
  const fail = windowed.filter((job) => job.state === "failed").length;
  const successRate = windowed.length ? Math.round((pass / windowed.length) * 100) : 0;

  const durations = windowed.map((job) => job.durationMs).filter((value): value is number => typeof value === "number");
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;

  const monthly = useMemo(() => {
    const buckets = new Map<string, { month: string; jobs: number; pass: number }>();
    for (const job of jobs) {
      const key = dayKey(job.finishedAt ?? job.createdAt)?.slice(0, 7);
      if (!key) continue;
      const bucket = buckets.get(key) ?? { month: key, jobs: 0, pass: 0 };
      bucket.jobs += 1;
      if (job.state === "succeeded") bucket.pass += 1;
      buckets.set(key, bucket);
    }
    return [...buckets.values()].sort((a, b) => b.month.localeCompare(a.month));
  }, [jobs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillGroup label="Range" options={RANGES} value={range} onChange={setRange} />
        <button type="button" className={ghostButtonClass} onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total runs" value={String(windowed.length)} caption={`last ${range} days`} />
        <MetricCard label="Pass" value={String(pass)} caption="succeeded" />
        <MetricCard label="Fail" value={String(fail)} caption="failed" />
        <MetricCard label="Success rate" value={`${successRate}%`} caption="pass ÷ total" />
      </div>

      {/* Ceiling: the reference's cost/token cards come from the AI Factory's own
          LLM spend ledger (/api/factory/api/analytics/cost). Nothing in this app
          records per-generation token usage or spend, so those figures are stated
          as unavailable rather than estimated. Upgrade path: persist usage from
          /api/llm/chat responses and aggregate them here. */}
      <EnvironmentGapNotice title="LLM cost and token metrics are not tracked here">
        The upstream Analytics page reports generation spend (USD/IDR totals, averages, input/output token counts) from the
        AI Factory&apos;s cost ledger. This app records no per-generation token usage or spend, so those figures are omitted
        instead of estimated. Everything below is derived from real terminal jobs in the shared run queue (
        <code className={monoClass}>GET /api/queue/history</code>).
      </EnvironmentGapNotice>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={`${panelClass} p-4`}>
          <h2 className="mb-3 text-sm font-semibold">Run timing</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {[
              ["Runs with a recorded duration", String(durations.length)],
              ["Average duration", durations.length ? `${(avgDuration / 1000).toFixed(1)}s` : "—"],
              ["Fastest", durations.length ? `${(Math.min(...durations) / 1000).toFixed(1)}s` : "—"],
              ["Slowest", durations.length ? `${(Math.max(...durations) / 1000).toFixed(1)}s` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className={monoClass}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${panelClass} p-4`}>
          <h2 className="mb-3 text-sm font-semibold">By month</h2>
          {monthly.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No completed runs recorded yet.</p>
          ) : (
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
              {monthly.map((entry) => {
                const rate = entry.jobs ? Math.round((entry.pass / entry.jobs) * 100) : 0;
                return (
                  <div key={entry.month} className="flex items-center gap-3 text-xs">
                    <span className={`${monoClass} w-16 shrink-0`}>{entry.month}</span>
                    <span className={`${monoClass} w-14 shrink-0`}>{entry.jobs} runs</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(rate, 100)}%` }} />
                    </div>
                    <span
                      className={`w-10 text-right font-medium ${
                        rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {rate}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className={`${panelClass} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Daily ({daily.length} days)</h2>
          <PillGroup label="Series" options={CHART_MODES} value={chartMode} onChange={setChartMode} />
        </div>
        <BarChart data={daily} valueKey={chartMode} />
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {daily.map((entry) => (
            <div key={entry.day} className="min-w-10 flex-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
              {entry.day.slice(5)}
            </div>
          ))}
        </div>
      </section>

      <section className={`overflow-hidden ${panelClass}`}>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Daily breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Runs</th>
                <th className={thClass}>Pass</th>
                <th className={thClass}>Fail</th>
                <th className={thClass}>Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {daily
                .filter((entry) => entry.jobs > 0)
                .map((entry) => {
                  const rate = entry.jobs ? Math.round((entry.pass / entry.jobs) * 100) : 0;
                  return (
                    <tr key={entry.day}>
                      <td className={`${tdClass} ${monoClass}`}>{entry.day}</td>
                      <td className={tdClass}>{entry.jobs}</td>
                      <td className={tdClass}>{entry.pass}</td>
                      <td className={tdClass}>{entry.fail}</td>
                      <td className={tdClass}>
                        <span
                          className={`font-medium ${
                            rate >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : rate >= 60
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {daily.every((entry) => entry.jobs === 0) && (
                <EmptyRow colSpan={5}>
                  {loading ? "Loading…" : `No API automation run completed in the last ${range} days.`}
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
