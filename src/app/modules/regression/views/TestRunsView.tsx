"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { RunCasesExplorerTab } from "../tabs/RunCasesExplorerTab";
import { RunDetailTab } from "../tabs/RunDetailTab";
import { TestRunsTab } from "../tabs/TestRunsTab";
import { ghostButtonClass } from "../ui";
import { regressionHref, useRegressionPlatforms, useRegressionRuns, useRunIdParam } from "../regression-shared";

/**
 * Test Runs plus its drill-down. The reference has no menu entry for Run Detail or Run
 * Cases Explorer — you reach them by clicking a run — so they render here whenever
 * `?runId=` is present, and the list renders when it is not.
 */
export function TestRunsView() {
  const router = useRouter();
  const { platforms, loading: platformsLoading } = useRegressionPlatforms();
  const { runs, loading: runsLoading, error: runsError, reload: reloadRuns } = useRegressionRuns();
  const { runId, setRunId } = useRunIdParam();

  if (!runId) {
    return (
      <TestRunsTab
        platforms={platforms}
        runs={runs}
        platformsLoading={platformsLoading}
        runsLoading={runsLoading}
        runsError={runsError}
        onReload={reloadRuns}
        onViewRun={setRunId}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className={`${ghostButtonClass} self-start`} onClick={() => setRunId(null)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to run list
      </button>

      <RunDetailTab
        runs={runs}
        platforms={platforms}
        selectedRunId={runId}
        onSelectRun={setRunId}
        onReload={reloadRuns}
        onOpenFailureReport={(id) => router.push(regressionHref("reg-failure", id))}
      />

      <RunCasesExplorerTab
        runs={runs}
        platforms={platforms}
        selectedRunId={runId}
        onSelectRun={setRunId}
        onReload={reloadRuns}
      />
    </div>
  );
}
