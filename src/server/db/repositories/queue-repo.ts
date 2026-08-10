import { getDb } from "./db";
import { unwrap } from "./errors";

export type QueueJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface QueueJob {
  id: string;
  projectId: string | null;
  script: string;
  status: QueueJobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

interface QueueJobRow {
  id: string;
  project_id: string | null;
  script: string;
  status: QueueJobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

function toJob(row: QueueJobRow): QueueJob {
  return {
    id: row.id,
    projectId: row.project_id,
    script: row.script,
    status: row.status,
    payload: row.payload ?? {},
    result: row.result,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function listQueue(projectId?: string): Promise<QueueJob[]> {
  const db = await getDb();
  let query = db.from("pt_queue_jobs").select("*").order("created_at", { ascending: false }).limit(200);
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listQueue", await query);
  return (rows as QueueJobRow[]).map(toJob);
}

const TERMINAL_STATUSES: QueueJobStatus[] = ["succeeded", "failed", "cancelled"];

// Backs the Run History tab: every job that has reached a terminal state,
// oldest first (callers sort/paginate as needed). Unlike listQueue (capped at
// 200, used for the live scheduler view), this has a higher cap since it's the
// full history backing pagination.
export async function listTerminalJobs(projectId?: string): Promise<QueueJob[]> {
  const db = await getDb();
  let query = db
    .from("pt_queue_jobs")
    .select("*")
    .in("status", TERMINAL_STATUSES)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listTerminalJobs", await query);
  return (rows as QueueJobRow[]).map(toJob);
}

export async function enqueueJob(input: { projectId?: string; script: string; payload?: Record<string, unknown> }): Promise<QueueJob> {
  const db = await getDb();
  const row = unwrap<QueueJobRow>(
    "enqueueJob",
    await db
      .from("pt_queue_jobs")
      .insert({ project_id: input.projectId ?? null, script: input.script, payload: input.payload ?? {}, status: "queued" })
      .select("*")
      .single(),
  );
  return toJob(row as QueueJobRow);
}

export async function updateJobStatus(id: string, status: QueueJobStatus, patch?: { result?: Record<string, unknown>; startedAt?: string; finishedAt?: string }): Promise<QueueJob> {
  const db = await getDb();
  const update: Record<string, unknown> = { status };
  if (patch?.result !== undefined) update.result = patch.result;
  if (patch?.startedAt !== undefined) update.started_at = patch.startedAt;
  if (patch?.finishedAt !== undefined) update.finished_at = patch.finishedAt;
  const row = unwrap<QueueJobRow>("updateJobStatus", await db.from("pt_queue_jobs").update(update).eq("id", id).select("*").single());
  return toJob(row as QueueJobRow);
}
