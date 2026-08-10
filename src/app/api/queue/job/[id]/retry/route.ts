import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { enqueueJob, listQueue } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const jobs = await listQueue();
    const existing = jobs.find((j) => j.id === id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const job = await enqueueJob({ projectId: existing.projectId ?? undefined, script: existing.script, payload: existing.payload });
    // RunHistoryTab.tsx reads body.jobId (not body.job).
    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
