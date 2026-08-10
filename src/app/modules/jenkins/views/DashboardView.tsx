"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  cardClass, ErrorBanner, inputClass, noteClass, responseError, statusBadge,
  STATUS_OPTIONS, useJenkinsJobs, type JenkinsJob,
} from "../jenkins-shared";

export function DashboardView() {
  const { jobs, loading, error, reload } = useJenkinsJobs();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cached job status. This environment has no live Jenkins connection, so jobs are registered below instead of
          polled — the same data a Jenkins webhook would otherwise write.
        </p>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className={`overflow-hidden ${cardClass}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last build</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {jobs.map((job) => {
              const badge = statusBadge(job.status);
              const number = job.lastBuild?.number;
              const url = job.lastBuild?.url;
              return (
                <tr key={job.id} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{job.jobName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                      <badge.Icon className={`size-3.5 ${badge.label === "Building" ? "animate-spin" : ""}`} aria-hidden="true" />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {number !== undefined && number !== null && number !== "" ? (
                      typeof url === "string" && url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                          #{String(number)} <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        `#${String(number)}`
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{new Date(job.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {loading ? "Loading…" : "No jobs registered yet — add one below."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RegisterJobForm jobs={jobs} onSaved={reload} />
    </div>
  );
}

function RegisterJobForm({ jobs, onSaved }: { jobs: JenkinsJob[]; onSaved: () => void }) {
  const [jobName, setJobName] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("unknown");
  const [buildNumber, setBuildNumber] = useState("");
  const [buildUrl, setBuildUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  const resetForm = () => {
    setJobName("");
    setStatus("unknown");
    setBuildNumber("");
    setBuildUrl("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobName.trim()) return;
    setSaving(true);
    setSaveState("idle");
    setError("");
    try {
      const lastBuild: Record<string, unknown> = {};
      if (buildNumber.trim()) lastBuild.number = buildNumber.trim();
      if (buildUrl.trim()) lastBuild.url = buildUrl.trim();

      const res = await fetch("/api/jenkins/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName: jobName.trim(), status, lastBuild }),
      });
      if (!res.ok) throw new Error(await responseError(res));
      setSaveState("ok");
      resetForm();
      onSaved();
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("err");
      setError(err instanceof Error ? err.message : "Unable to save job");
      setTimeout(() => setSaveState("idle"), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={cardClass}>
      <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        Register / Update Job
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Job name</span>
          <input required type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. qa-central-nightly" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])} className={inputClass}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Build number</span>
          <input type="text" value={buildNumber} onChange={(e) => setBuildNumber(e.target.value)} placeholder="e.g. 128" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Build URL</span>
          <input type="url" value={buildUrl} onChange={(e) => setBuildUrl(e.target.value)} placeholder="https://jenkins.example.com/job/.../128/" className={inputClass} />
        </label>
      </div>

      {error && <div className="mx-4 mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          type="submit"
          disabled={saving || !jobName.trim()}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
            saveState === "ok" ? "bg-emerald-600" : saveState === "err" ? "bg-rose-600" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {saving ? "Saving…" : saveState === "ok" ? "Saved" : saveState === "err" ? "Failed" : "Save Job"}
        </button>
        <button type="button" onClick={resetForm} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          Reset
        </button>
        <p className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
          {jobs.length} job{jobs.length === 1 ? "" : "s"} registered · saving an existing name updates it
        </p>
      </div>
    </form>
  );
}

export { noteClass };
