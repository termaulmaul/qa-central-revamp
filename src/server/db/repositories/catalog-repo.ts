import { getDb } from "./db";
import { unwrap } from "./errors";

export interface CatalogEntry {
  id: string;
  projectId: string | null;
  method: string;
  path: string;
  tags: string[];
  spec: Record<string, unknown>;
  updatedAt: string;
}

interface CatalogRow {
  id: string;
  project_id: string | null;
  method: string;
  path: string;
  tags: string[];
  spec: Record<string, unknown>;
  updated_at: string;
}

function toCatalogEntry(row: CatalogRow): CatalogEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    method: row.method,
    path: row.path,
    tags: row.tags ?? [],
    spec: row.spec ?? {},
    updatedAt: row.updated_at,
  };
}

export async function listCatalog(projectId?: string): Promise<CatalogEntry[]> {
  const db = await getDb();
  let query = db.from("pt_api_catalog").select("*").order("path");
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listCatalog", await query);
  return (rows as CatalogRow[]).map(toCatalogEntry);
}

// Insert a single endpoint, deduping on (project_id, method, path). Distinct
// from replaceProjectCatalog (a full wipe-and-replace of a project's whole
// catalog) — ApiCatalogTab.tsx's "Add Endpoint" form adds exactly one entry
// and must never touch the rest of the catalog.
export async function addCatalogEntry(input: {
  projectId: string;
  method: string;
  path: string;
  tags?: string[];
  spec?: Record<string, unknown>;
}): Promise<{ entry: CatalogEntry; duplicate: boolean }> {
  const db = await getDb();
  const existingRows = unwrap(
    "addCatalogEntry:check",
    await db
      .from("pt_api_catalog")
      .select("*")
      .eq("project_id", input.projectId)
      .eq("method", input.method)
      .eq("path", input.path),
  );
  if (Array.isArray(existingRows) && existingRows.length > 0) {
    return { entry: toCatalogEntry((existingRows as CatalogRow[])[0]), duplicate: true };
  }
  const row = unwrap<CatalogRow>(
    "addCatalogEntry",
    await db
      .from("pt_api_catalog")
      .insert({ project_id: input.projectId, method: input.method, path: input.path, tags: input.tags ?? [], spec: input.spec ?? {} })
      .select("*")
      .single(),
  );
  return { entry: toCatalogEntry(row as CatalogRow), duplicate: false };
}

export async function replaceProjectCatalog(
  projectId: string,
  entries: Array<{ method: string; path: string; tags?: string[]; spec?: Record<string, unknown> }>,
): Promise<CatalogEntry[]> {
  const db = await getDb();
  const { error: deleteError } = await db.from("pt_api_catalog").delete().eq("project_id", projectId);
  if (deleteError) throw deleteError;
  if (entries.length === 0) return [];
  const rows = unwrap(
    "replaceProjectCatalog",
    await db
      .from("pt_api_catalog")
      .insert(entries.map((e) => ({ project_id: projectId, method: e.method, path: e.path, tags: e.tags ?? [], spec: e.spec ?? {} })))
      .select("*"),
  );
  return (rows as CatalogRow[]).map(toCatalogEntry);
}
