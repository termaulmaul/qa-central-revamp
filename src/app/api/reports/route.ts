import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createReport, listReports } from "@/server/db/repositories/reports-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    const reports = await listReports(projectId);
    return NextResponse.json({ reports });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { projectId, name, summary } = body ?? {};
  if (!name || typeof name !== "string") return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const report = await createReport({ projectId: projectId || undefined, name, summary });
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
