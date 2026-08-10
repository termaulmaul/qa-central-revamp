import { listQueue, type QueueJob as RepoQueueJob } from "@/server/db/repositories/queue-repo";

// Shape expected by PerformanceQueueTab.tsx's QueueSnapshot / QueueJob, shared
// between GET /api/queue (poll) and GET /api/queue/events (SSE push) so both
// paths build the exact same JSON.
function toSnapshotJob(row: RepoQueueJob) {
  const payload = (row.payload ?? {}) as { target?: string | null; config?: unknown };
  return {
    id: row.id,
    // Our status enum ('queued'|'running'|'succeeded'|'failed'|'cancelled') is a
    // subset of the UI's QueueJobState (which also allows 'claimed'); we simply
    // never emit 'claimed'.
    state: row.status,
    script: row.script,
    target: payload.target ?? null,
    config: (payload.config ?? null) as never,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    // This simplified environment has no distinct claim-vs-execution-start
    // moment, so testStartedAt mirrors startedAt.
    testStartedAt: row.startedAt,
  };
}

export async function buildQueueSnapshot(projectId?: string) {
  const rows = await listQueue(projectId);
  const running = rows.filter((row) => row.status === "running");
  // At most one job should ever be running; if more than one somehow is, pick
  // the most recently started.
  const currentRow = running.length
    ? running.reduce((latest, row) => ((row.startedAt ?? "") > (latest.startedAt ?? "") ? row : latest))
    : null;
  const queuedRows = rows
    .filter((row) => row.status === "queued")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const current = currentRow ? toSnapshotJob(currentRow) : null;
  const queue = queuedRows.map(toSnapshotJob);

  return {
    state: current ? "running" as const : "idle" as const,
    current,
    queue,
    counts: { waiting: queue.length, running: current ? 1 : 0 },
    // No cooldown concept exists in this simplified environment.
    cooldownUntil: null as string | null,
  };
}
