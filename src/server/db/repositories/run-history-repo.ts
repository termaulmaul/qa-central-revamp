import { getDb } from "./db";
import { unwrap } from "./errors";

export interface RunHistoryEntry {
  id: string;
  projectId: string | null;
  script: string;
  startedAt: string;
  finishedAt: string | null;
  verdict: string | null;
  metrics: Record<string, unknown>;
}

interface RunHistoryRow {
  id: string;
  project_id: string | null;
  script: string;
  started_at: string;
  finished_at: string | null;
  verdict: string | null;
  metrics: Record<string, unknown>;
}

function toRun(row: RunHistoryRow): RunHistoryEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    script: row.script,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    verdict: row.verdict,
    metrics: row.metrics ?? {},
  };
}

export async function listRuns(projectId?: string, limit = 200): Promise<RunHistoryEntry[]> {
  const db = await getDb();
  let query = db.from("pt_run_history").select("*").order("started_at", { ascending: false }).limit(limit);
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listRuns", await query);
  return (rows as RunHistoryRow[]).map(toRun);
}

export async function createRun(input: { projectId?: string; script: string }): Promise<RunHistoryEntry> {
  const db = await getDb();
  const row = unwrap<RunHistoryRow>(
    "createRun",
    await db
      .from("pt_run_history")
      .insert({ project_id: input.projectId ?? null, script: input.script })
      .select("*")
      .single(),
  );
  return toRun(row as RunHistoryRow);
}

export async function finishRun(id: string, patch: { verdict: string; metrics?: Record<string, unknown> }): Promise<RunHistoryEntry> {
  const db = await getDb();
  const update: Record<string, unknown> = { finished_at: new Date().toISOString(), verdict: patch.verdict };
  if (patch.metrics !== undefined) update.metrics = patch.metrics;
  const row = unwrap<RunHistoryRow>("finishRun", await db.from("pt_run_history").update(update).eq("id", id).select("*").single());
  return toRun(row as RunHistoryRow);
}
