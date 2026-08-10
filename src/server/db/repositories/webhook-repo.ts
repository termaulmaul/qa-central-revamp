import { getDb } from "./db";
import { unwrap } from "./errors";

export interface Webhook {
  id: string;
  projectId: string | null;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string | null;
  createdAt: string;
}

interface WebhookRow {
  id: string;
  project_id: string | null;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string | null;
  created_at: string;
}

function toWebhook(row: WebhookRow): Webhook {
  return {
    id: row.id,
    projectId: row.project_id,
    url: row.url,
    events: row.events ?? [],
    enabled: row.enabled,
    secret: row.secret,
    createdAt: row.created_at,
  };
}

export async function listWebhooks(projectId?: string): Promise<Webhook[]> {
  const db = await getDb();
  let query = db.from("pt_webhooks").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listWebhooks", await query);
  return (rows as WebhookRow[]).map(toWebhook);
}

export async function createWebhook(input: { projectId?: string; url: string; events?: string[]; enabled?: boolean; secret?: string }): Promise<Webhook> {
  const db = await getDb();
  const row = unwrap<WebhookRow>(
    "createWebhook",
    await db
      .from("pt_webhooks")
      .insert({
        project_id: input.projectId ?? null,
        url: input.url,
        events: input.events ?? [],
        enabled: input.enabled ?? true,
        secret: input.secret ?? null,
      })
      .select("*")
      .single(),
  );
  return toWebhook(row as WebhookRow);
}

export async function updateWebhook(id: string, patch: Partial<{ url: string; events: string[]; enabled: boolean; secret: string | null }>): Promise<Webhook> {
  const db = await getDb();
  const update: Record<string, unknown> = {};
  if (patch.url !== undefined) update.url = patch.url;
  if (patch.events !== undefined) update.events = patch.events;
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.secret !== undefined) update.secret = patch.secret;
  const row = unwrap<WebhookRow>("updateWebhook", await db.from("pt_webhooks").update(update).eq("id", id).select("*").single());
  return toWebhook(row as WebhookRow);
}

export async function deleteWebhook(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("pt_webhooks").delete().eq("id", id);
  if (error) throw error;
}
