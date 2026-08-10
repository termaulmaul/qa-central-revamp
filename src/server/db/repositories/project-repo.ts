import { getDb } from "./db";
import { unwrap } from "./errors";

export interface Project {
  id: string;
  name: string;
  baseUrl: string | null;
  environment: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ProjectRow {
  id: string;
  name: string;
  base_url: string | null;
  environment: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.base_url,
    environment: row.environment,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = unwrap("listProjects", await db.from("pt_projects").select("*").order("name"));
  return (rows as ProjectRow[]).map(toProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const { data, error } = await db.from("pt_projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProject(data as ProjectRow) : null;
}

export async function createProject(input: { name: string; baseUrl?: string; environment?: string; metadata?: Record<string, unknown> }): Promise<Project> {
  const db = await getDb();
  const row = unwrap<ProjectRow>(
    "createProject",
    await db
      .from("pt_projects")
      .insert({ name: input.name, base_url: input.baseUrl ?? null, environment: input.environment ?? null, metadata: input.metadata ?? {} })
      .select("*")
      .single(),
  );
  return toProject(row as ProjectRow);
}

export async function updateProject(id: string, input: Partial<{ name: string; baseUrl: string | null; environment: string | null; metadata: Record<string, unknown> }>): Promise<Project> {
  const db = await getDb();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.baseUrl !== undefined) patch.base_url = input.baseUrl;
  if (input.environment !== undefined) patch.environment = input.environment;
  if (input.metadata !== undefined) patch.metadata = input.metadata;
  const row = unwrap<ProjectRow>("updateProject", await db.from("pt_projects").update(patch).eq("id", id).select("*").single());
  return toProject(row as ProjectRow);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("pt_projects").delete().eq("id", id);
  if (error) throw error;
}
