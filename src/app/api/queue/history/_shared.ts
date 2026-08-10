import type { QueueJob as RepoQueueJob } from "@/server/db/repositories/queue-repo";

// Shapes expected by RunHistoryTab.tsx.
export type TerminalQueueJobState = "succeeded" | "failed" | "cancelled";
export type QueueArtifactKind = "stdout" | "stderr" | "result" | "report";

export interface HistoryJob {
  id: string;
  state: TerminalQueueJobState;
  source: string | null;
  script: string | null;
  target: string | null;
  config: { env: string; runby: string; platform: string; vus: number; duration: string; scenario: string } | null;
  bp: string;
  requester: string | null;
  notes: string;
  failureReason: string | null;
  runNo: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  artifacts: Record<QueueArtifactKind, boolean>;
  hasUtilization: boolean;
}

// script/config -> BP scenario label, mirroring PerformanceQueueTab.tsx's
// scenarioLabel: prefer the persisted runtime config.scenario, fall back to a
// BP token parsed from the script path, else 'All'.
function computeBp(script: string | null, config: unknown): string {
  const cfg = config as { scenario?: unknown } | null;
  const scenario = typeof cfg?.scenario === "string" ? cfg.scenario.trim() : "";
  if (scenario && scenario.toLowerCase() !== "all") return scenario;
  const bp = script?.match(/(?:^|[/_-])(BP\d+)/i)?.[1]?.toUpperCase();
  return bp || "All";
}

export function toHistoryJob(row: RepoQueueJob, runNo: number): HistoryJob {
  const payload = (row.payload ?? {}) as { target?: string | null; config?: unknown };
  const result = (row.result ?? {}) as { notes?: unknown; failureReason?: unknown; exitCode?: unknown };
  const state = row.status as TerminalQueueJobState;
  const durationMs = row.startedAt && row.finishedAt ? Date.parse(row.finishedAt) - Date.parse(row.startedAt) : NaN;

  return {
    id: row.id,
    state,
    // No import path creates real rows in this environment (see
    // POST /api/queue/import, a documented stub), so `source` is always the
    // dashboard-executed value.
    source: null,
    script: row.script,
    target: payload.target ?? null,
    config: (payload.config ?? null) as HistoryJob["config"],
    bp: computeBp(row.script, payload.config),
    // Requester isn't captured at enqueue time; the UI falls back to the
    // current session user when this is null.
    requester: null,
    notes: typeof result.notes === "string" ? result.notes : "",
    failureReason:
      state === "cancelled"
        ? "cancelled by user"
        : state === "failed"
          ? (typeof result.failureReason === "string" ? result.failureReason : "Unknown failure")
          : null,
    runNo,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    durationMs: Number.isFinite(durationMs) ? durationMs : null,
    exitCode: typeof result.exitCode === "number" ? result.exitCode : null,
    // No worker in this environment ever persists stdout/stderr/result/report
    // artifacts (see the artifact/[kind] and report stub routes), so none exist.
    artifacts: { stdout: false, stderr: false, result: false, report: false },
    hasUtilization: false,
  };
}
