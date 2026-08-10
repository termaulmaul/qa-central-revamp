import { getGlobalSettingsProjectId, getSetting } from "@/server/db/repositories/settings-repo";
import type { Webhook } from "@/server/db/repositories/webhook-repo";

// Shape expected by WebhooksTab.tsx. `pt_webhooks` (webhook-repo.ts) models a
// generic { url, events[], secret } subscription — a different domain than
// the tab's fixed-channel "notification alias" concept (channel + a named
// server-side config ref like TEAMS_WEBHOOK, no client-visible secret). No
// migration is available here, so the existing generic columns are
// re-purposed: `url` carries the targetRef name, `events[0]` carries the
// channel.
export type WebhookChannel = "teams" | "discord" | "telegram" | "brrr";
const CHANNELS: readonly WebhookChannel[] = ["teams", "discord", "telegram", "brrr"];

export interface WebhookEntry {
  id: string;
  projectId: string;
  channel: WebhookChannel;
  targetRef: string;
  enabled: boolean;
  configured: boolean;
  createdAt: string;
  updatedAt: string;
}

export function parseChannel(value: unknown): WebhookChannel {
  return typeof value === "string" && (CHANNELS as readonly string[]).includes(value) ? (value as WebhookChannel) : "teams";
}

// Mirrors /api/settings/app-config's notify.<ref>.configured: a targetRef is
// "configured" when it has an actual value stored in Settings (never an env
// var — this app has no such fallback).
export async function isTargetConfigured(targetRef: string): Promise<boolean> {
  const projectId = await getGlobalSettingsProjectId();
  const notify = await getSetting(projectId, "app-config-notify");
  const value = (notify as Record<string, unknown> | null)?.[targetRef];
  return typeof value === "string" && value.length > 0;
}

export async function toWebhookEntry(webhook: Webhook): Promise<WebhookEntry> {
  const targetRef = webhook.url;
  return {
    id: webhook.id,
    projectId: webhook.projectId ?? "",
    channel: parseChannel(webhook.events[0]),
    targetRef,
    enabled: webhook.enabled,
    configured: await isTargetConfigured(targetRef),
    createdAt: webhook.createdAt,
    // pt_webhooks has no updated_at column; createdAt is the closest available.
    updatedAt: webhook.createdAt,
  };
}
