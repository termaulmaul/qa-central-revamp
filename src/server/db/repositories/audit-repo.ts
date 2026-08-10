import { getDb } from "./db";
import { unwrap } from "./errors";

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return { id: row.id, actor: row.actor, action: row.action, target: row.target, details: row.details ?? {}, createdAt: row.created_at };
}

export async function listAuditLog(limit = 200): Promise<AuditLogEntry[]> {
  const db = await getDb();
  const rows = unwrap(
    "listAuditLog",
    await db.from("pt_audit_log").select("*").order("created_at", { ascending: false }).limit(limit),
  );
  return (rows as AuditLogRow[]).map(toAuditLogEntry);
}

export async function recordAudit(actor: string, action: string, target?: string, details?: Record<string, unknown>): Promise<AuditLogEntry> {
  const db = await getDb();
  const row = unwrap<AuditLogRow>(
    "recordAudit",
    await db
      .from("pt_audit_log")
      .insert({ actor, action, target: target ?? null, details: details ?? {} })
      .select("*")
      .single(),
  );
  return toAuditLogEntry(row as AuditLogRow);
}
