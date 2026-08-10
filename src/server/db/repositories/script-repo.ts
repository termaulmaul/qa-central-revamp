import { getDb } from "./db";
import { unwrap } from "./errors";

export interface ScriptEntry {
  id: string;
  projectId: string | null;
  name: string;
  path: string;
  tags: string[];
  updatedAt: string;
}

interface ScriptRow {
  id: string;
  project_id: string | null;
  name: string;
  path: string;
  tags: string[];
  updated_at: string;
}

function toScript(row: ScriptRow): ScriptEntry {
  return { id: row.id, projectId: row.project_id, name: row.name, path: row.path, tags: row.tags ?? [], updatedAt: row.updated_at };
}

export async function listScripts(projectId?: string): Promise<ScriptEntry[]> {
  const db = await getDb();
  let query = db.from("pt_scripts").select("*").order("name");
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listScripts", await query);
  return (rows as ScriptRow[]).map(toScript);
}

export async function replaceProjectScripts(projectId: string, scripts: Array<{ name: string; path: string; tags?: string[] }>): Promise<ScriptEntry[]> {
  const db = await getDb();
  const { error: deleteError } = await db.from("pt_scripts").delete().eq("project_id", projectId);
  if (deleteError) throw deleteError;
  if (scripts.length === 0) return [];
  const rows = unwrap(
    "replaceProjectScripts",
    await db
      .from("pt_scripts")
      .insert(scripts.map((s) => ({ project_id: projectId, name: s.name, path: s.path, tags: s.tags ?? [] })))
      .select("*"),
  );
  return (rows as ScriptRow[]).map(toScript);
}
