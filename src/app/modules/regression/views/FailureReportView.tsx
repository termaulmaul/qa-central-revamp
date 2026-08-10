"use client";

import { FailureReportTab } from "../tabs/FailureReportTab";
import { useRegressionRuns, useRunIdParam } from "../regression-shared";

export function FailureReportView() {
  const { runs } = useRegressionRuns();
  const { runId, setRunId } = useRunIdParam();
  return <FailureReportTab runs={runs} selectedRunId={runId} onSelectRun={setRunId} />;
}
