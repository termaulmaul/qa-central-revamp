"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  EmptyRow,
  ErrorBanner,
  MetricCard,
  PillGroup,
  StateBadge,
  formatDateTime,
  formatDuration,
  ghostButtonClass,
  monoClass,
  panelClass,
  tdClass,
  thClass,
  useApiAutomationHistory,
} from "../api-automation-shared";

const STATE_FILTERS = [
  { value: "all", label: "All" },
  { value: "succeeded", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type StateFilter = (typeof STATE_FILTERS)[number]["value"];

export function HistoryView() {
  const { jobs, loading, error, reload } = useApiAutomationHistory();
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  const filtered = useMemo(
    () => (stateFilter === "all" ? jobs : jobs.filter((job) => job.state === stateFilter)),
    [jobs, stateFilter],
  );

  const passed = jobs.filter((job) => job.state === "succeeded").length;
  const failed = jobs.filter((job) => job.state === "failed").length;
  const passRate = jobs.length ? Math.round((passed / jobs.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Terminal runs" value={String(jobs.length)} caption="api-automation-tagged" />
        <MetricCard label="Passed" value={String(passed)} caption="exited successfully" />
        <MetricCard label="Failed" value={String(failed)} caption="non-zero exit or error" />
        <MetricCard label="Pass rate" value={`${passRate}%`} caption="across all recorded runs" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillGroup label="Status" options={STATE_FILTERS} value={stateFilter} onChange={setStateFilter} />
        <button type="button" className={ghostButtonClass} onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />

      <section className={`overflow-hidden ${panelClass}`}>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Completed runs</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Terminal jobs from the shared run queue (<code className={monoClass}>GET /api/queue/history</code>), filtered to
            this module&apos;s <code className={monoClass}>config.kind === &quot;api-automation&quot;</code> tag.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>Run</th>
                <th className={thClass}>Script</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Finished</th>
                <th className={thClass}>Duration</th>
                <th className={thClass}>Exit</th>
                <th className={thClass}>Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td className={`${tdClass} ${monoClass}`}>#{job.runNo}</td>
                  <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>{job.script ?? "—"}</td>
                  <td className={tdClass}>
                    <StateBadge state={job.state} />
                  </td>
                  <td className={`${tdClass} text-zinc-500 dark:text-zinc-400`}>{formatDateTime(job.finishedAt)}</td>
                  <td className={`${tdClass} ${monoClass}`}>{formatDuration(job.durationMs)}</td>
                  <td className={`${tdClass} ${monoClass}`}>{job.exitCode ?? "—"}</td>
                  <td className={`${tdClass} text-zinc-500 dark:text-zinc-400`}>{job.failureReason ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <EmptyRow colSpan={7}>
                  {loading
                    ? "Loading…"
                    : jobs.length === 0
                      ? "No API automation run has reached a terminal state yet."
                      : "No runs match this status filter."}
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
