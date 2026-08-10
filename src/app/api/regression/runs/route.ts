import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createRun, listRuns } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const platformId = request.nextUrl.searchParams.get("platformId") ?? undefined;

  try {
    const runs = await listRuns(platformId);
    return NextResponse.json({ runs });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const platformId = typeof body?.platformId === "string" ? body.platformId : "";
  if (!platformId) return NextResponse.json({ error: "platformId is required" }, { status: 400 });
  const summary = body?.summary && typeof body.summary === "object" ? (body.summary as Record<string, unknown>) : undefined;

  try {
    // No automatic test executor exists here — the run is created in "scheduled"
    // status (see pt_regression_runs default) and must be finished manually via
    // POST /api/regression/runs/[id]/finish.
    const run = await createRun(platformId, summary);
    return NextResponse.json({ run });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
