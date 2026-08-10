import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listFailures, recordFailure } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const failures = await listFailures(id);
    return NextResponse.json({ failures });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const testName = typeof body?.testName === "string" ? body.testName.trim() : "";
  if (!testName) return NextResponse.json({ error: "testName is required" }, { status: 400 });

  const classification = typeof body?.classification === "string" && body.classification ? body.classification : null;
  const details = body?.details && typeof body.details === "object" ? (body.details as Record<string, unknown>) : {};

  try {
    const failure = await recordFailure(id, testName, classification, details);
    return NextResponse.json({ failure });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
