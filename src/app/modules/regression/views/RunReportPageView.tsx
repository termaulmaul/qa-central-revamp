"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchFailures } from "../api";
import type { RegressionFailure } from "../types";
import { RunReportView } from "../tabs/RunReportView";
import { Card, EmptyState, ErrorBanner, ghostButtonClass, inputClass } from "../ui";
import { useRegressionPlatforms, useRegressionRuns, useRunIdParam } from "../regression-shared";

/**
 * `reg-report` is its own top-level menu in the reference (pages/regression/RunReport),
 * with a run picker at the top. The revamp only reached the report from Run Detail, so
 * this page promotes it: pick a run (or arrive via `?runId=`) and get the printable view.
 */
export function RunReportPageView() {
  const { platforms } = useRegressionPlatforms();
  const { runs, loading: runsLoading, reload: reloadRuns } = useRegressionRuns();
  const { runId, setRunId } = useRunIdParam();

  const [failures, setFailures] = useState<RegressionFailure[]>([]);
  const [failuresError, setFailuresError] = useState("");

  const run = runs.find((item) => item.id === runId) ?? null;

  const platformName = useMemo(() => {
    const map = new Map(platforms.map((platform) => [platform.id, platform.name]));
    return run?.platformId ? (map.get(run.platformId) ?? "Unassigned") : "Unassigned";
  }, [platforms, run]);

  const loadFailures = useCallback(async () => {
    if (!runId) {
      setFailures([]);
      return;
    }
    setFailuresError("");
    try {
      setFailures(await fetchFailures(runId));
    } catch (cause) {
      setFailuresError(cause instanceof Error ? cause.message : "Unable to load failures");
    }
  }, [runId]);

  useEffect(() => {
    void loadFailures();
  }, [loadFailures]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Run Report</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Print-friendly summary for a single regression run.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className={`${inputClass} w-auto`}
            value={runId ?? ""}
            onChange={(event) => setRunId(event.target.value || null)}
            aria-label="Run"
          >
            <option value="">Select a run…</option>
            {runs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id.slice(0, 8)} · {item.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => {
              void reloadRuns();
              void loadFailures();
            }}
            disabled={runsLoading}
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {failuresError && <ErrorBanner message={failuresError} />}

      {!run ? (
        <Card>
          <EmptyState>{runsLoading ? "Loading runs…" : "Select a run above to render its report."}</EmptyState>
        </Card>
      ) : (
        <RunReportView run={run} platformName={platformName} failures={failures} />
      )}
    </div>
  );
}
