import { getDb } from "./db";
import { unwrap } from "./errors";
import { createProject } from "./project-repo";

// pt_settings requires a real project_id FK. There is no per-project
// scoping for deployment-wide config (thresholds, Grafana, app-config
// cards, connections), so those are stored against a sentinel "global
// settings" project row instead of adding a nullable column.
export const GLOBAL_SETTINGS_PROJECT_NAME = "__global_settings__";

export interface SettingEntry {
  projectId: string | null;
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

interface SettingRow {
  project_id: string | null;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

function toSetting(row: SettingRow): SettingEntry {
  return { projectId: row.project_id, key: row.key, value: row.value ?? {}, updatedAt: row.updated_at };
}

export async function getRuntimeDefaults(projectId: string): Promise<Record<string, unknown>> {
  const db = await getDb();
  const { data, error } = await db
    .from("pt_settings")
    .select("*")
    .eq("project_id", projectId)
    .eq("key", "runtime-defaults")
    .maybeSingle();
  if (error) throw error;
  return data ? toSetting(data as SettingRow).value : {};
}

export async function upsertSetting(projectId: string, key: string, value: Record<string, unknown>): Promise<SettingEntry> {
  const db = await getDb();
  const row = unwrap<SettingRow>(
    "upsertSetting",
    await db
      .from("pt_settings")
      .upsert({ project_id: projectId, key, value, updated_at: new Date().toISOString() }, { onConflict: "project_id,key" })
      .select("*")
      .single(),
  );
  return toSetting(row as SettingRow);
}

export async function listSettings(projectId: string): Promise<SettingEntry[]> {
  const db = await getDb();
  const rows = unwrap("listSettings", await db.from("pt_settings").select("*").eq("project_id", projectId));
  return (rows as SettingRow[]).map(toSetting);
}

// General-purpose single-key read, alongside the runtime-defaults-specific
// getRuntimeDefaults above. Returns null when nothing has been saved yet.
export async function getSetting(projectId: string, key: string): Promise<Record<string, unknown> | null> {
  const db = await getDb();
  const row = unwrap<SettingRow | null>(
    "getSetting",
    await db.from("pt_settings").select("*").eq("project_id", projectId).eq("key", key).maybeSingle(),
  );
  return row ? toSetting(row).value : null;
}

// Resolves (creating on first use) the sentinel project id that deployment-
// wide settings are stored under. Cheap: one indexed select, insert only on
// a genuine miss.
export async function getGlobalSettingsProjectId(): Promise<string> {
  const db = await getDb();
  const row = unwrap<{ id: string } | null>(
    "getGlobalSettingsProjectId",
    await db.from("pt_projects").select("id").eq("name", GLOBAL_SETTINGS_PROJECT_NAME).maybeSingle(),
  );
  if (row) return row.id;
  const project = await createProject({ name: GLOBAL_SETTINGS_PROJECT_NAME });
  return project.id;
}
