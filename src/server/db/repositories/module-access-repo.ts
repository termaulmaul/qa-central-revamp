import { getDb } from "./db";
import { unwrap } from "./errors";

export interface ModuleAccess {
  id: string;
  roleCode: string;
  moduleId: string;
  allowed: boolean;
}

interface ModuleAccessRow {
  id: string;
  role_code: string;
  module_id: string;
  allowed: boolean;
}

function toModuleAccess(row: ModuleAccessRow): ModuleAccess {
  return { id: row.id, roleCode: row.role_code, moduleId: row.module_id, allowed: row.allowed };
}

export async function listModuleAccess(): Promise<ModuleAccess[]> {
  const db = await getDb();
  const rows = unwrap("listModuleAccess", await db.from("pt_module_access").select("*").order("role_code"));
  return (rows as ModuleAccessRow[]).map(toModuleAccess);
}

export async function getAllowedModuleIds(roleCode: string): Promise<string[]> {
  const db = await getDb();
  const rows = unwrap(
    "getAllowedModuleIds",
    await db.from("pt_module_access").select("*").eq("role_code", roleCode).eq("allowed", true),
  );
  return (rows as ModuleAccessRow[]).map((row) => row.module_id);
}

export async function setModuleAccess(roleCode: string, moduleId: string, allowed: boolean): Promise<ModuleAccess> {
  const db = await getDb();
  const row = unwrap<ModuleAccessRow>(
    "setModuleAccess",
    await db
      .from("pt_module_access")
      .upsert({ role_code: roleCode, module_id: moduleId, allowed }, { onConflict: "role_code,module_id" })
      .select("*")
      .single(),
  );
  return toModuleAccess(row as ModuleAccessRow);
}
