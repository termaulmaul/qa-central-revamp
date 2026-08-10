import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listQueue, updateJobStatus } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { notes } = await request.json();

  try {
    const jobs = await listQueue();
    const existing = jobs.find((j) => j.id === id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const job = await updateJobStatus(id, existing.status, { result: { ...(existing.result ?? {}), notes } });
    // RunHistoryTab.tsx reads body.id / body.notes directly (not a wrapped `job`).
    return NextResponse.json({ id: job.id, notes: typeof job.result?.notes === "string" ? job.result.notes : "" });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
