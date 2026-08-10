import { getDb } from "./db";
import { unwrap } from "./errors";
import { TRADING_HOURS_PLATFORM_NAME } from "@/app/modules/regression/types";

export interface RegressionPlatform {
  id: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}

interface RegressionPlatformRow {
  id: string;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
}

function toPlatform(row: RegressionPlatformRow): RegressionPlatform {
  return { id: row.id, name: row.name, config: row.config ?? {}, createdAt: row.created_at };
}

export interface RegressionRun {
  id: string;
  platformId: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  summary: Record<string, unknown>;
  createdAt: string;
}

interface RegressionRunRow {
  id: string;
  platform_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  summary: Record<string, unknown>;
  created_at: string;
}

function toRun(row: RegressionRunRow): RegressionRun {
  return {
    id: row.id,
    platformId: row.platform_id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    summary: row.summary ?? {},
    createdAt: row.created_at,
  };
}

export interface RegressionFailure {
  id: string;
  runId: string | null;
  testName: string;
  classification: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

interface RegressionFailureRow {
  id: string;
  run_id: string | null;
  test_name: string;
  classification: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

function toFailure(row: RegressionFailureRow): RegressionFailure {
  return {
    id: row.id,
    runId: row.run_id,
    testName: row.test_name,
    classification: row.classification,
    details: row.details ?? {},
    createdAt: row.created_at,
  };
}

export interface RegressionSchedule {
  id: string;
  name: string;
  cronExpr: string;
  platformId: string | null;
  enabled: boolean;
  createdAt: string;
}

interface RegressionScheduleRow {
  id: string;
  name: string;
  cron_expr: string;
  platform_id: string | null;
  enabled: boolean;
  created_at: string;
}

function toSchedule(row: RegressionScheduleRow): RegressionSchedule {
  return { id: row.id, name: row.name, cronExpr: row.cron_expr, platformId: row.platform_id, enabled: row.enabled, createdAt: row.created_at };
}

export async function listPlatforms(): Promise<RegressionPlatform[]> {
  const db = await getDb();
  const rows = unwrap("listPlatforms", await db.from("pt_regression_platforms").select("*").order("name"));
  return (rows as RegressionPlatformRow[]).map(toPlatform);
}

export async function createPlatform(name: string, config: Record<string, unknown>): Promise<RegressionPlatform> {
  const db = await getDb();
  const row = unwrap<RegressionPlatformRow>("createPlatform", await db.from("pt_regression_platforms").insert({ name, config }).select("*").single());
  return toPlatform(row as RegressionPlatformRow);
}

export async function updatePlatform(id: string, patch: { name?: string; config?: Record<string, unknown> }): Promise<RegressionPlatform> {
  const db = await getDb();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.config !== undefined) update.config = patch.config;
  const row = unwrap<RegressionPlatformRow>(
    "updatePlatform",
    await db.from("pt_regression_platforms").update(update).eq("id", id).select("*").single(),
  );
  return toPlatform(row as RegressionPlatformRow);
}

// Trading Hours has no dedicated table (out of scope: no new migration). Reference implementation
// treats trading-hours config as global (not per-platform), so it is stored as the `config` jsonb
// of a single sentinel platform row rather than a real "platform" that shows up in run creation.
export async function getTradingHours(): Promise<Record<string, unknown> | null> {
  const platforms = await listPlatforms();
  return platforms.find((p) => p.name === TRADING_HOURS_PLATFORM_NAME)?.config ?? null;
}

export async function saveTradingHours(config: Record<string, unknown>): Promise<RegressionPlatform> {
  const platforms = await listPlatforms();
  const existing = platforms.find((p) => p.name === TRADING_HOURS_PLATFORM_NAME);
  if (existing) return updatePlatform(existing.id, { config });
  return createPlatform(TRADING_HOURS_PLATFORM_NAME, config);
}

export async function listRuns(platformId?: string): Promise<RegressionRun[]> {
  const db = await getDb();
  let query = db.from("pt_regression_runs").select("*").order("created_at", { ascending: false });
  if (platformId) query = query.eq("platform_id", platformId);
  const rows = unwrap("listRuns", await query);
  return (rows as RegressionRunRow[]).map(toRun);
}

export async function createRun(platformId: string, summary?: Record<string, unknown>): Promise<RegressionRun> {
  const db = await getDb();
  const insert: Record<string, unknown> = { platform_id: platformId, started_at: new Date().toISOString() };
  if (summary !== undefined) insert.summary = summary;
  const row = unwrap<RegressionRunRow>("createRun", await db.from("pt_regression_runs").insert(insert).select("*").single());
  return toRun(row as RegressionRunRow);
}

// Merges `patch` into the run's existing summary jsonb without touching status/timestamps —
// used for storing Generate Run / Run Cases Explorer state (e.g. a fetched Qase case list)
// on a run that is not being finished yet.
export async function updateRunSummary(id: string, patch: Record<string, unknown>): Promise<RegressionRun> {
  const db = await getDb();
  const existing = unwrap<RegressionRunRow>("updateRunSummary:read", await db.from("pt_regression_runs").select("*").eq("id", id).single());
  const summary = { ...(existing.summary ?? {}), ...patch };
  const row = unwrap<RegressionRunRow>(
    "updateRunSummary",
    await db.from("pt_regression_runs").update({ summary }).eq("id", id).select("*").single(),
  );
  return toRun(row as RegressionRunRow);
}

export async function finishRun(id: string, patch: { status: string; summary?: Record<string, unknown> }): Promise<RegressionRun> {
  const db = await getDb();
  const update: Record<string, unknown> = { status: patch.status, finished_at: new Date().toISOString() };
  if (patch.summary !== undefined) update.summary = patch.summary;
  const row = unwrap<RegressionRunRow>("finishRun", await db.from("pt_regression_runs").update(update).eq("id", id).select("*").single());
  return toRun(row as RegressionRunRow);
}

export async function listFailures(runId: string): Promise<RegressionFailure[]> {
  const db = await getDb();
  const rows = unwrap(
    "listFailures",
    await db.from("pt_regression_failures").select("*").eq("run_id", runId).order("created_at", { ascending: false }),
  );
  return (rows as RegressionFailureRow[]).map(toFailure);
}

export async function recordFailure(runId: string, testName: string, classification: string | null, details: Record<string, unknown>): Promise<RegressionFailure> {
  const db = await getDb();
  const row = unwrap<RegressionFailureRow>(
    "recordFailure",
    await db
      .from("pt_regression_failures")
      .insert({ run_id: runId, test_name: testName, classification, details })
      .select("*")
      .single(),
  );
  return toFailure(row as RegressionFailureRow);
}

export async function listRegressionSchedules(): Promise<RegressionSchedule[]> {
  const db = await getDb();
  const rows = unwrap("listRegressionSchedules", await db.from("pt_regression_schedules").select("*").order("created_at", { ascending: false }));
  return (rows as RegressionScheduleRow[]).map(toSchedule);
}

export async function createRegressionSchedule(input: { name: string; cronExpr: string; platformId?: string; enabled?: boolean }): Promise<RegressionSchedule> {
  const db = await getDb();
  const row = unwrap<RegressionScheduleRow>(
    "createRegressionSchedule",
    await db
      .from("pt_regression_schedules")
      .insert({ name: input.name, cron_expr: input.cronExpr, platform_id: input.platformId ?? null, enabled: input.enabled ?? true })
      .select("*")
      .single(),
  );
  return toSchedule(row as RegressionScheduleRow);
}

export async function deleteRegressionSchedule(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("pt_regression_schedules").delete().eq("id", id);
  if (error) throw error;
}
