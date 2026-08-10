import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getGlobalSettingsProjectId, getSetting, upsertSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Grafana connection, stored deployment-wide under pt_settings key
// "grafana". No .env fallback exists in this app, so `source` is only ever
// 'settings' (a value is stored) or 'none' (nothing saved yet) — never
// 'env'. The password never leaves the server; only passwordSet travels.
const DEFAULT_TIMEOUT_MS = 8000;

type GrafanaStored = {
  url?: string;
  user?: string;
  password?: string;
  verifySsl?: boolean;
  timeoutMs?: number;
};

function toGrafanaView(stored: Record<string, unknown> | null) {
  const record = (stored ?? {}) as GrafanaStored;
  return {
    url: typeof record.url === "string" ? record.url : "",
    user: typeof record.user === "string" ? record.user : "",
    verifySsl: typeof record.verifySsl === "boolean" ? record.verifySsl : false,
    timeoutMs: typeof record.timeoutMs === "number" && Number.isFinite(record.timeoutMs)
      ? record.timeoutMs
      : DEFAULT_TIMEOUT_MS,
    passwordSet: typeof record.password === "string" && record.password.length > 0,
    source: stored ? ("settings" as const) : ("none" as const),
  };
}

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = await getGlobalSettingsProjectId();
    const stored = await getSetting(projectId, "grafana");
    return NextResponse.json({ grafana: toGrafanaView(stored) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    url?: unknown; user?: unknown; password?: unknown; verifySsl?: unknown; timeoutMs?: unknown;
  } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body.url !== "string" || typeof body.user !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "url, user, and password must be strings" }, { status: 400 });
  }
  if (typeof body.timeoutMs !== "number" || !Number.isInteger(body.timeoutMs) || body.timeoutMs < 500 || body.timeoutMs > 30000) {
    return NextResponse.json({ error: "timeoutMs must be a whole number of milliseconds from 500 through 30000" }, { status: 400 });
  }

  try {
    const projectId = await getGlobalSettingsProjectId();
    const stored = (await getSetting(projectId, "grafana")) as GrafanaStored | null;
    // '' keeps the currently stored password unchanged; there's no
    // explicit-clear case for the Grafana password.
    const password = body.password !== "" ? body.password : (stored?.password ?? "");

    const next: GrafanaStored = {
      url: body.url,
      user: body.user,
      password,
      verifySsl: Boolean(body.verifySsl),
      timeoutMs: body.timeoutMs,
    };

    await upsertSetting(projectId, "grafana", next);
    return NextResponse.json({ grafana: toGrafanaView(next) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
