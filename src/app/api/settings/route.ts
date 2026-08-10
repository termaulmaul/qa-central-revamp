import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getGlobalSettingsProjectId, getSetting, upsertSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Deployment-wide thresholds + the local SCRIPT_REPO_PATH, stored together
// under pt_settings key "thresholds" against the sentinel global-settings
// project. Two independent forms on the client save disjoint subsets of
// this same record.
const DEFAULT_THRESHOLDS = {
  THRESHOLD_AVG_MS: 200,
  THRESHOLD_ERR_PCT: 0.1,
  THRESHOLD_MIN_RPS: 381,
};

const THRESHOLD_KEYS = ["THRESHOLD_AVG_MS", "THRESHOLD_ERR_PCT", "THRESHOLD_MIN_RPS"] as const;

function buildSettingsView(stored: Record<string, unknown>) {
  const settings: Record<string, unknown> = {};
  for (const key of THRESHOLD_KEYS) {
    settings[key] = typeof stored[key] === "number" && Number.isFinite(stored[key] as number)
      ? stored[key]
      : DEFAULT_THRESHOLDS[key];
  }
  if (typeof stored.SCRIPT_REPO_PATH === "string") {
    settings.SCRIPT_REPO_PATH = stored.SCRIPT_REPO_PATH;
  }
  return settings;
}

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = await getGlobalSettingsProjectId();
    const stored = (await getSetting(projectId, "thresholds")) ?? {};
    return NextResponse.json({ settings: buildSettingsView(stored) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const projectId = await getGlobalSettingsProjectId();
    const stored = (await getSetting(projectId, "thresholds")) ?? {};
    const next: Record<string, unknown> = { ...stored };

    for (const key of THRESHOLD_KEYS) {
      if (key in body) {
        const value = body[key];
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return NextResponse.json({ error: `${key} must be a number` }, { status: 400 });
        }
        next[key] = value;
      }
    }
    if ("SCRIPT_REPO_PATH" in body) {
      const value = body.SCRIPT_REPO_PATH;
      if (typeof value !== "string") {
        return NextResponse.json({ error: "SCRIPT_REPO_PATH must be a string" }, { status: 400 });
      }
      next.SCRIPT_REPO_PATH = value;
    }

    await upsertSetting(projectId, "thresholds", next);
    return NextResponse.json({ settings: buildSettingsView(next) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
