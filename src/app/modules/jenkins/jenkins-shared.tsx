"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, CircleCheck, CircleDashed, CircleX, Loader2 } from "lucide-react";

export interface JenkinsJob {
  id: string;
  jobName: string;
  status: string | null;
  lastBuild: Record<string, unknown>;
  updatedAt: string;
}

export const STATUS_OPTIONS = ["success", "failure", "unstable", "building", "unknown"] as const;

export const inputClass =
  "rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
export const cardClass = "rounded-xl border border-zinc-200 dark:border-zinc-800";
export const noteClass =
  "rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400";

export function statusBadge(status: string | null) {
  const s = (status ?? "unknown").toLowerCase();
  if (s === "success") {
    return { label: "Success", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300", Icon: CircleCheck };
  }
  if (s === "failure" || s === "failed") {
    return { label: "Failure", cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300", Icon: CircleX };
  }
  if (s === "unstable") {
    return { label: "Unstable", cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300", Icon: CircleAlert };
  }
  if (s === "building" || s === "running") {
    return { label: "Building", cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300", Icon: Loader2 };
  }
  return { label: "Unknown", cls: "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400", Icon: CircleDashed };
}

export async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
}

export function useJenkinsJobs() {
  const [jobs, setJobs] = useState<JenkinsJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jenkins/jobs");
      if (!res.ok) throw new Error(await responseError(res));
      const body = (await res.json()) as { jobs: JenkinsJob[] };
      setJobs(Array.isArray(body.jobs) ? body.jobs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Jenkins jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, loading, error, reload };
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
      {message}
    </div>
  );
}
