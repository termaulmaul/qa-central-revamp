"use client";

import { Clock } from "lucide-react";
import { cardClass, ErrorBanner, noteClass, useJenkinsJobs } from "../jenkins-shared";

export function SchedulesView() {
  const { jobs, loading, error } = useJenkinsJobs();

  return (
    <div className="flex flex-col gap-6">
      <div className={noteClass}>
        The reference reads each job&apos;s build triggers straight from the Jenkins API. This environment has no Jenkins
        server configured, so cron specs can&apos;t be resolved — the registered jobs below are shown without their
        schedules. Configure a Jenkins connection to populate this page.
      </div>

      <ErrorBanner message={error} />

      <div className={`overflow-hidden ${cardClass}`}>
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
          Registered Jobs
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Schedule</th>
              <th className="px-4 py-3 font-medium">Next run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {jobs.map((job) => (
              <tr key={job.id} className="bg-white dark:bg-zinc-950">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{job.jobName}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">Requires Jenkins connection</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">—</td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {loading ? "Loading…" : "No jobs registered yet — add one on the Dashboard page."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Clock className="size-3.5" aria-hidden="true" />
        Schedules are read-only in the reference too — they are configured in Jenkins itself, not here.
      </div>
    </div>
  );
}
