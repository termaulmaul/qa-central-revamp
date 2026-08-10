"use client";

import { RefreshCw } from "lucide-react";
import {
  EmptyRow,
  ErrorBanner,
  MetricCard,
  StateBadge,
  formatDateTime,
  ghostButtonClass,
  panelClass,
  tdClass,
  thClass,
  useApiAutomationQueue,
} from "../api-automation-shared";

export function DashboardView() {
  const { jobs, loading, error, reload } = useApiAutomationQueue();

  const running = jobs.filter((job) => job.state === "running").length;
  const queued = jobs.filter((job) => job.state === "queued").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="In flight" value={String(jobs.length)} caption="api-automation-tagged jobs" />
        <MetricCard label="Running" value={String(running)} caption="executing now" />
        <MetricCard label="Queued" value={String(queued)} caption="waiting for a runner" />
      </div>

      <ErrorBanner message={error} />

      <section className={panelClass}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">API automation jobs</h2>
          <button type="button" className={ghostButtonClass} onClick={() => void reload()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>Script</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>{job.script ?? "—"}</td>
                  <td className={tdClass}>
                    <StateBadge state={job.state} />
                  </td>
                  <td className={`${tdClass} text-zinc-500 dark:text-zinc-400`}>{formatDateTime(job.createdAt)}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <EmptyRow colSpan={3}>
                  {loading ? "Loading…" : "No API automation jobs queued yet — queue one from the Generate or Run page."}
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
