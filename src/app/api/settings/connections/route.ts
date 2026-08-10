import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getGlobalSettingsProjectId, getSetting, upsertSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Deployment-wide operational setting: the public base URL this app is
// reachable at, used for remote callback URLs (e.g. Jenkins webhooks).
// Stored under pt_settings key "connections" against the sentinel
// global-settings project. Any authenticated user can view/edit it, same as
// the other Configuration tabs.

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = await getGlobalSettingsProjectId();
    const stored = await getSetting(projectId, "connections");
    const dashboardPublicUrl = typeof stored?.dashboardPublicUrl === "string" ? stored.dashboardPublicUrl : "";
    return NextResponse.json({ dashboardPublicUrl });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { dashboardPublicUrl?: unknown } | null;
  if (!body || typeof body.dashboardPublicUrl !== "string") {
    return NextResponse.json({ error: "dashboardPublicUrl must be a string" }, { status: 400 });
  }

  try {
    const projectId = await getGlobalSettingsProjectId();
    await upsertSetting(projectId, "connections", { dashboardPublicUrl: body.dashboardPublicUrl });
    return NextResponse.json({ dashboardPublicUrl: body.dashboardPublicUrl });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
