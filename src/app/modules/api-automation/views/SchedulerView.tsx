"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  EmptyRow,
  EnvironmentGapNotice,
  ErrorBanner,
  MetricCard,
  StateBadge,
  getJson,
  ghostButtonClass,
  monoClass,
  panelClass,
  tdClass,
  thClass,
} from "../api-automation-shared";

interface CronEntry {
  raw: string;
  enabled: boolean;
  schedule: string;
  command: string;
  isPT: boolean;
  lastRun?: string | null;
}

export function SchedulerView() {
  const [entries, setEntries] = useState<CronEntry[]>([]);
  const [repoBase, setRepoBase] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // GET /api/remote-cron is the same route the Performance module's cron tab
      // reads; in this environment it is an honest stub that returns an empty
      // `entries` list because the real crontab lives on the ONPREM VM reached
      // over SSH. A non-empty list renders normally if that link ever exists.
      const body = await getJson<{ entries?: CronEntry[]; repoBase?: string }>("/api/remote-cron");
      setEntries(Array.isArray(body.entries) ? body.entries : []);
      setRepoBase(body.repoBase ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read the remote crontab");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const enabled = entries.filter((entry) => entry.enabled).length;
  // With no live SSH link there is nothing to write, so creating/editing entries
  // is not offered at all rather than surfacing a button that always 501s.
  const schedulerUnavailable = !loading && !error && entries.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Schedules" value={String(entries.length)} caption="crontab entries" />
        <MetricCard label="Enabled" value={String(enabled)} caption="not commented out" />
        <MetricCard label="Repo base" value={repoBase || "—"} caption="runner working directory" />
      </div>

      <ErrorBanner message={error} />

      {schedulerUnavailable && (
        <EnvironmentGapNotice title="Requires the on-prem scheduler">
          Scheduled API automation runs are cron entries on the ONPREM runner VM, managed over SSH by{" "}
          <code className={monoClass}>/api/remote-cron</code>. That SSH link does not exist in this environment, so the route
          answers with an empty crontab and every write returns 501 — nothing is scheduled here, and no schedule can be
          created. Connect the on-prem runner to populate this page.
        </EnvironmentGapNotice>
      )}

      <section className={`overflow-hidden ${panelClass}`}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Remote crontab</h2>
          <button type="button" className={ghostButtonClass} onClick={() => void reload()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>State</th>
                <th className={thClass}>Schedule</th>
                <th className={thClass}>Command</th>
                <th className={thClass}>Last run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry) => (
                <tr key={entry.raw}>
                  <td className={tdClass}>
                    <StateBadge state={entry.enabled ? "running" : "cancelled"} />
                  </td>
                  <td className={`${tdClass} ${monoClass}`}>{entry.schedule}</td>
                  <td className={`${tdClass} ${monoClass} max-w-md truncate`} title={entry.command}>
                    {entry.command}
                  </td>
                  <td className={`${tdClass} text-zinc-500 dark:text-zinc-400`}>{entry.lastRun ?? "—"}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <EmptyRow colSpan={4}>{loading ? "Loading…" : "No schedules reported by the runner."}</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
