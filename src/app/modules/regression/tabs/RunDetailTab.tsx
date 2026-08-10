"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { fetchFailures, finishRunApi } from "../api";
import type { RegressionFailure, RegressionPlatform, RegressionRun, RegressionRunCase, RunFinishStatus } from "../types";
import { RUN_FINISH_STATUSES } from "../types";
import { Card, CardHeader, EmptyState, ErrorBanner, formatDateTime, ghostButtonClass, inputClass, labelClass, Pill, primaryButtonClass, statusTone } from "../ui";
import { RunReportView } from "./RunReportView";

interface RunDetailTabProps {
  runs: RegressionRun[];
  platforms: RegressionPlatform[];
  selectedRunId: string | null;
  onSelectRun: (runId: string | null) => void;
  onReload: () => Promise<void>;
  onOpenFailureReport: (runId: string) => void;
}

export function RunDetailTab({ runs, platforms, selectedRunId, onSelectRun, onReload, onOpenFailureReport }: RunDetailTabProps) {
  const [failures, setFailures] = useState<RegressionFailure[]>([]);
  const [failuresLoading, setFailuresLoading] = useState(false);
  const [failuresError, setFailuresError] = useState("");
  const [showSummaryJson, setShowSummaryJson] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [finishStatus, setFinishStatus] = useState<RunFinishStatus>("passed");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");

  useEffect(() => {
    if (!selectedRunId && runs.length > 0) onSelectRun(runs[0].id);
  }, [runs, selectedRunId, onSelectRun]);

  const run = runs.find((r) => r.id === selectedRunId) ?? null;
  const platformName = useMemo(() => {
    const map = new Map(platforms.map((p) => [p.id, p.name]));
    return run?.platformId ? (map.get(run.platformId) ?? "Unassigned") : "Unassigned";
  }, [platforms, run]);

  const loadFailures = useCallback(async () => {
    if (!selectedRunId) {
      setFailures([]);
      return;
    }
    setFailuresLoading(true);
    setFailuresError("");
    try {
      setFailures(await fetchFailures(selectedRunId));
    } catch (cause) {
      setFailuresError(cause instanceof Error ? cause.message : "Unable to load failures");
    } finally {
      setFailuresLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    void loadFailures();
  }, [loadFailures]);

  const cases: RegressionRunCase[] = run && Array.isArray(run.summary.cases) ? (run.summary.cases as RegressionRunCase[]) : [];

  const finish = async () => {
    if (!run) return;
    setFinishing(true);
    setFinishError("");
    try {
      await finishRunApi(run.id, finishStatus, run.summary);
      await onReload();
    } catch (cause) {
      setFinishError(cause instanceof Error ? cause.message : "Unable to finish run");
    } finally {
      setFinishing(false);
    }
  };

  const canFinish = run?.status === "scheduled" || run?.status === "running";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Run Detail</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Status, summary, and failures for a single run.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className={`${inputClass} w-auto`} value={selectedRunId ?? ""} onChange={(e) => onSelectRun(e.target.value || null)}>
            <option value="">Select a run…</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id.slice(0, 8)} · {r.status}
              </option>
            ))}
          </select>
          <button type="button" className={ghostButtonClass} onClick={() => void onReload()}>
            <RefreshCw className="size-4" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {!run ? (
        <Card>
          <EmptyState>Select a run above to view its detail.</EmptyState>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={typeof run.summary.name === "string" && run.summary.name ? run.summary.name : `Run ${run.id.slice(0, 8)}`}
              meta={platformName}
              action={<Pill tone={statusTone(run.status)}>{run.status}</Pill>}
            />
            <div className="flex flex-col gap-3 p-4">
              <div className="grid grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
                <div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">Created</div>
                  {formatDateTime(run.createdAt)}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">Started</div>
                  {formatDateTime(run.startedAt)}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">Finished</div>
                  {formatDateTime(run.finishedAt)}
                </div>
              </div>

              {typeof run.summary.notes === "string" && run.summary.notes && (
                <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{run.summary.notes}</p>
              )}

              {cases.length > 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {cases.length} case(s) attached — see Run Cases Explorer for the full list.
                </p>
              )}

              <button type="button" className="self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400" onClick={() => setShowSummaryJson((v) => !v)}>
                {showSummaryJson ? "Hide" : "Show"} summary JSON
              </button>
              {showSummaryJson && (
                <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  {JSON.stringify(run.summary, null, 2)}
                </pre>
              )}
            </div>
          </Card>

          {canFinish && (
            <Card>
              <CardHeader title="Finish Run" />
              <div className="flex flex-wrap items-end gap-3 p-4">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Final status</span>
                  <select className={inputClass} value={finishStatus} onChange={(e) => setFinishStatus(e.target.value as RunFinishStatus)} disabled={finishing}>
                    {RUN_FINISH_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={primaryButtonClass} onClick={() => void finish()} disabled={finishing}>
                  <CheckSquare className="size-4" aria-hidden="true" />
                  {finishing ? "Saving…" : "Finish Run"}
                </button>
              </div>
              {finishError && (
                <div className="px-4 pb-4">
                  <ErrorBanner message={finishError} />
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader
              title="Failures"
              meta={`${failures.length} recorded`}
              action={
                <button type="button" className={ghostButtonClass} onClick={() => onOpenFailureReport(run.id)}>
                  <FileText className="size-4" aria-hidden="true" /> Open Failure Report
                </button>
              }
            />
            <div className="p-4">
              {failuresError && <ErrorBanner message={failuresError} />}
              {failuresLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading failures…</p>
              ) : failures.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No failures recorded for this run.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    failures.reduce<Record<string, number>>((acc, f) => {
                      const key = f.classification ?? "unclassified";
                      acc[key] = (acc[key] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([key, count]) => (
                    <Pill key={key} tone="err">
                      {key} · {count}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <button
            type="button"
            className="flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            onClick={() => setShowReport((v) => !v)}
          >
            <ExternalLink className="size-4" aria-hidden="true" /> {showReport ? "Hide" : "Show"} print-friendly Run Report
          </button>
          {showReport && <RunReportView run={run} platformName={platformName} failures={failures} />}
        </>
      )}
    </div>
  );
}
