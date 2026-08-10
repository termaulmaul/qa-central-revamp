import { getDb } from "./db";
import { unwrap } from "./errors";

export interface Schedule {
  id: string;
  projectId: string | null;
  name: string;
  cronExpr: string;
  script: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface ScheduleRow {
  id: string;
  project_id: string | null;
  name: string;
  cron_expr: string;
  script: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

function toSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    cronExpr: row.cron_expr,
    script: row.script,
    enabled: row.enabled,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
  };
}

export async function listSchedules(projectId?: string): Promise<Schedule[]> {
  const db = await getDb();
  let query = db.from("pt_cron_schedules").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listSchedules", await query);
  return (rows as ScheduleRow[]).map(toSchedule);
}

export async function createSchedule(input: { projectId?: string; name: string; cronExpr: string; script: string; enabled?: boolean }): Promise<Schedule> {
  const db = await getDb();
  const row = unwrap<ScheduleRow>(
    "createSchedule",
    await db
      .from("pt_cron_schedules")
      .insert({
        project_id: input.projectId ?? null,
        name: input.name,
        cron_expr: input.cronExpr,
        script: input.script,
        enabled: input.enabled ?? true,
      })
      .select("*")
      .single(),
  );
  return toSchedule(row as ScheduleRow);
}

export async function updateSchedule(
  id: string,
  patch: Partial<{ name: string; cronExpr: string; script: string; enabled: boolean; lastRunAt: string | null; nextRunAt: string | null }>,
): Promise<Schedule> {
  const db = await getDb();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.cronExpr !== undefined) update.cron_expr = patch.cronExpr;
  if (patch.script !== undefined) update.script = patch.script;
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.lastRunAt !== undefined) update.last_run_at = patch.lastRunAt;
  if (patch.nextRunAt !== undefined) update.next_run_at = patch.nextRunAt;
  const row = unwrap<ScheduleRow>("updateSchedule", await db.from("pt_cron_schedules").update(update).eq("id", id).select("*").single());
  return toSchedule(row as ScheduleRow);
}

export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("pt_cron_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function setScheduleEnabled(id: string, enabled: boolean): Promise<Schedule> {
  const db = await getDb();
  const row = unwrap<ScheduleRow>("setScheduleEnabled", await db.from("pt_cron_schedules").update({ enabled }).eq("id", id).select("*").single());
  return toSchedule(row as ScheduleRow);
}
