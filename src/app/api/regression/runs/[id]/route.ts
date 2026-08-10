import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { updateRunSummary } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Merges a partial summary into the run without touching status/timestamps — used by
// Generate Run / Run Cases Explorer to store a fetched Qase case list on an in-progress run.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const summary = body?.summary && typeof body.summary === "object" ? (body.summary as Record<string, unknown>) : null;
  if (!summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });

  try {
    const run = await updateRunSummary(id, summary);
    return NextResponse.json({ run });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
