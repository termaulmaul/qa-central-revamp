import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createRegressionSchedule, listRegressionSchedules } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const schedules = await listRegressionSchedules();
    return NextResponse.json({ schedules });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const cronExpr = typeof body?.cronExpr === "string" ? body.cronExpr.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!cronExpr) return NextResponse.json({ error: "cronExpr is required" }, { status: 400 });

  const platformId = typeof body?.platformId === "string" && body.platformId ? body.platformId : undefined;
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;

  try {
    const schedule = await createRegressionSchedule({ name, cronExpr, platformId, enabled });
    return NextResponse.json({ schedule });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
