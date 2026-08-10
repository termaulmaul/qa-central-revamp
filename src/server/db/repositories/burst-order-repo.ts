import { getDb } from "./db";
import { unwrap } from "./errors";

export interface BurstOrder {
  id: string;
  name: string;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BurstOrderRow {
  id: string;
  name: string;
  config: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

function toBurstOrder(row: BurstOrderRow): BurstOrder {
  return { id: row.id, name: row.name, config: row.config ?? {}, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function listBurstOrders(): Promise<BurstOrder[]> {
  const db = await getDb();
  const rows = unwrap("listBurstOrders", await db.from("pt_burst_orders").select("*").order("created_at", { ascending: false }));
  return (rows as BurstOrderRow[]).map(toBurstOrder);
}

export async function createBurstOrder(name: string, config: Record<string, unknown>): Promise<BurstOrder> {
  const db = await getDb();
  const row = unwrap<BurstOrderRow>("createBurstOrder", await db.from("pt_burst_orders").insert({ name, config }).select("*").single());
  return toBurstOrder(row as BurstOrderRow);
}

export async function updateBurstOrder(id: string, patch: Partial<{ name: string; config: Record<string, unknown>; status: string }>): Promise<BurstOrder> {
  const db = await getDb();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.config !== undefined) update.config = patch.config;
  if (patch.status !== undefined) update.status = patch.status;
  const row = unwrap<BurstOrderRow>("updateBurstOrder", await db.from("pt_burst_orders").update(update).eq("id", id).select("*").single());
  return toBurstOrder(row as BurstOrderRow);
}
