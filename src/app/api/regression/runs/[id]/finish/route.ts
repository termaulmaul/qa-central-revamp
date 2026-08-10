import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { finishRun } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

const VALID_STATUSES = new Set(["passed", "failed", "cancelled"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: `status must be one of: ${[...VALID_STATUSES].join(", ")}` }, { status: 400 });
  }
  const summary = body?.summary && typeof body.summary === "object" ? (body.summary as Record<string, unknown>) : undefined;

  try {
    const run = await finishRun(id, { status, summary });
    return NextResponse.json({ run });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
