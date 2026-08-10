import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getGlobalSettingsProjectId, getSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Five deployment-wide app-config cards, each stored under its own
// pt_settings key ("app-config-<card>") against the sentinel global-settings
// project. GET (here) and POST /app-config/[card] (sibling route) share the
// storage keys, defaults, and view-building logic below so both always
// return the identical AppConfigView shape SettingsTab.tsx expects.

export const NOTIFY_REF_LIST = ["TEAMS_WEBHOOK", "NOTIFY_TEAMS", "DISCORD_WEBHOOK", "TELEGRAM_WEBHOOK", "BRRR_WEBHOOK"] as const;
export type NotifyRefName = typeof NOTIFY_REF_LIST[number];

export type ConfigSource = "settings" | "env" | "default" | "none";

// No env fallback exists in this app, so source is only ever 'settings' (a
// value is stored) or 'none' — never 'env'/'default'.
const QUEUE_DEFAULTS = { queuePollMs: 2000, queueLeaseSeconds: 60, cronEnabled: false, cronPollMs: 5000, cronBatchSize: 10 };
const AUTH_DEFAULTS = { sessionHours: 12, rateLimitWindowSeconds: 60, rateLimitMax: 10, passwordExpiryWarningDays: 14 };
const DEFAULT_QASE_BASE_URL = "https://api.qase.io/v1";

function numKey(record: Record<string, unknown> | null | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function boolKey(record: Record<string, unknown> | null | undefined, key: string): boolean | undefined {
  const value = record?.[key];
  return typeof value === "boolean" ? value : undefined;
}
function strKey(record: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

export async function buildAppConfigView(projectId: string) {
  const [onprem, notify, queue, auth, qase] = await Promise.all([
    getSetting(projectId, "app-config-onprem"),
    getSetting(projectId, "app-config-notify"),
    getSetting(projectId, "app-config-queue"),
    getSetting(projectId, "app-config-auth"),
    getSetting(projectId, "app-config-qase"),
  ]);

  const notifyView = Object.fromEntries(NOTIFY_REF_LIST.map((ref) => {
    const configured = typeof strKey(notify, ref) === "string" && (strKey(notify, ref) as string).length > 0;
    return [ref, { configured, source: (configured ? "settings" : "none") as ConfigSource }];
  })) as Record<NotifyRefName, { configured: boolean; source: ConfigSource }>;

  const rawBaseUrl = strKey(qase, "baseUrl") ?? "";
  const apiToken = strKey(qase, "apiToken") ?? "";

  return {
    onprem: {
      host1: strKey(onprem, "host1") ?? "",
      host2: strKey(onprem, "host2") ?? "",
      user: strKey(onprem, "user") ?? "",
      user2: strKey(onprem, "user2") ?? "",
      passwordSet: (strKey(onprem, "password") ?? "").length > 0,
      testPasswordSet: (strKey(onprem, "testPassword") ?? "").length > 0,
      testPinSet: (strKey(onprem, "testPin") ?? "").length > 0,
      source: (onprem ? "settings" : "none") as ConfigSource,
    },
    notify: notifyView,
    queue: {
      stored: {
        queuePollMs: numKey(queue, "queuePollMs"),
        queueLeaseSeconds: numKey(queue, "queueLeaseSeconds"),
        cronEnabled: boolKey(queue, "cronEnabled"),
        cronPollMs: numKey(queue, "cronPollMs"),
        cronBatchSize: numKey(queue, "cronBatchSize"),
      },
      effective: {
        queuePollMs: numKey(queue, "queuePollMs") ?? QUEUE_DEFAULTS.queuePollMs,
        queueLeaseSeconds: numKey(queue, "queueLeaseSeconds") ?? QUEUE_DEFAULTS.queueLeaseSeconds,
        cronEnabled: boolKey(queue, "cronEnabled") ?? QUEUE_DEFAULTS.cronEnabled,
        cronPollMs: numKey(queue, "cronPollMs") ?? QUEUE_DEFAULTS.cronPollMs,
        cronBatchSize: numKey(queue, "cronBatchSize") ?? QUEUE_DEFAULTS.cronBatchSize,
      },
    },
    auth: {
      stored: {
        sessionHours: numKey(auth, "sessionHours"),
        rateLimitWindowSeconds: numKey(auth, "rateLimitWindowSeconds"),
        rateLimitMax: numKey(auth, "rateLimitMax"),
        passwordExpiryWarningDays: numKey(auth, "passwordExpiryWarningDays"),
      },
      effective: {
        sessionHours: numKey(auth, "sessionHours") ?? AUTH_DEFAULTS.sessionHours,
        rateLimitWindowSeconds: numKey(auth, "rateLimitWindowSeconds") ?? AUTH_DEFAULTS.rateLimitWindowSeconds,
        rateLimitMax: numKey(auth, "rateLimitMax") ?? AUTH_DEFAULTS.rateLimitMax,
        passwordExpiryWarningDays: numKey(auth, "passwordExpiryWarningDays") ?? AUTH_DEFAULTS.passwordExpiryWarningDays,
      },
    },
    qase: {
      baseUrl: rawBaseUrl.length > 0 ? rawBaseUrl : DEFAULT_QASE_BASE_URL,
      baseUrlStored: rawBaseUrl.length > 0,
      apiTokenSet: apiToken.length > 0,
      source: (qase ? "settings" : "none") as ConfigSource,
    },
  };
}

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = await getGlobalSettingsProjectId();
    const appConfig = await buildAppConfigView(projectId);
    return NextResponse.json({ appConfig });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
