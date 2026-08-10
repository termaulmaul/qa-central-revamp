import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getRuntimeDefaults, upsertSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  try {
    const defaults = await getRuntimeDefaults(projectId);
    return NextResponse.json({ defaults });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { projectId, ...defaults } = body ?? {};
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  try {
    await upsertSetting(projectId, "runtime-defaults", defaults);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
