"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Plus, RefreshCw } from "lucide-react";
import type { RegressionPlatform, RegressionRun } from "../types";
import { isSelectablePlatform } from "../types";
import { Card, EmptyState, ErrorBanner, formatDateTime, ghostButtonClass, Pill, primaryButtonClass, statusTone } from "../ui";
import { GenerateRunModal } from "./GenerateRunModal";

interface TestRunsTabProps {
  platforms: RegressionPlatform[];
  runs: RegressionRun[];
  platformsLoading: boolean;
  runsLoading: boolean;
  runsError: string;
  onReload: () => Promise<void>;
  onViewRun: (runId: string) => void;
}

const ACTIVE_STATUSES = new Set(["scheduled", "running"]);

export function TestRunsTab({ platforms, runs, platformsLoading, runsLoading, runsError, onReload, onViewRun }: TestRunsTabProps) {
  const selectablePlatforms = useMemo(() => platforms.filter(isSelectablePlatform), [platforms]);
  const [activePlatformId, setActivePlatformId] = useState("");
  const [generatingFor, setGeneratingFor] = useState<RegressionPlatform | null>(null);

  const currentPlatformId = activePlatformId || selectablePlatforms[0]?.id || "";

  const runsByPlatform = useMemo(() => {
    const map = new Map<string, RegressionRun[]>();
    for (const run of runs) {
      if (!run.platformId) continue;
      if (!map.has(run.platformId)) map.set(run.platformId, []);
      map.get(run.platformId)!.push(run);
    }
    return map;
  }, [runs]);

  const currentRuns = runsByPlatform.get(currentPlatformId) ?? [];
  const activeRuns = currentRuns.filter((r) => ACTIVE_STATUSES.has(r.status));
  const historyRuns = currentRuns.filter((r) => !ACTIVE_STATUSES.has(r.status));
  const currentPlatform = selectablePlatforms.find((p) => p.id === currentPlatformId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Test Runs</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pick a platform to see its active run and run history.</p>
        </div>
        <button type="button" className={ghostButtonClass} onClick={() => void onReload()} disabled={runsLoading}>
          <RefreshCw className="size-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {runsError && <ErrorBanner message={runsError} />}

      {selectablePlatforms.length === 0 && !platformsLoading ? (
        <Card>
          <EmptyState>No platforms configured yet. Add one in Platform Config first.</EmptyState>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
            {selectablePlatforms.map((platform) => {
              const active = currentPlatformId === platform.id;
              const hasActive = (runsByPlatform.get(platform.id) ?? []).some((r) => ACTIVE_STATUSES.has(r.status));
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setActivePlatformId(platform.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {platform.name}
                  {hasActive && <span className="size-1.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>

          {currentPlatform && (
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{currentPlatform.name}</h3>
                <button type="button" className={primaryButtonClass} onClick={() => setGeneratingFor(currentPlatform)}>
                  <Plus className="size-4" aria-hidden="true" /> Generate Run
                </button>
              </div>

              {activeRuns.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {activeRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill tone={statusTone(run.status)}>{run.status}</Pill>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {typeof run.summary.name === "string" && run.summary.name ? run.summary.name : run.id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Started {formatDateTime(run.startedAt)}</p>
                      </div>
                      <button type="button" className={primaryButtonClass} onClick={() => onViewRun(run.id)}>
                        Detail <ArrowRight className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Run history</div>
                {historyRuns.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    No run history for this platform yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {historyRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill tone={statusTone(run.status)}>{run.status}</Pill>
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {typeof run.summary.name === "string" && run.summary.name ? run.summary.name : run.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Started {formatDateTime(run.startedAt)} · Finished {formatDateTime(run.finishedAt)}
                          </p>
                        </div>
                        <button type="button" className={ghostButtonClass} onClick={() => onViewRun(run.id)}>
                          Detail <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {generatingFor && (
        <GenerateRunModal
          platform={generatingFor}
          onClose={() => setGeneratingFor(null)}
          onCreated={onReload}
        />
      )}
    </div>
  );
}
