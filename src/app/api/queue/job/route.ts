import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { enqueueJob, listQueue } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // The client (ExecuteTestTab.tsx) sends target/config as top-level siblings,
  // not nested under a `payload` key — both are folded into the payload jsonb
  // column so no migration is needed.
  const { projectId, script, target, config } = body ?? {};
  if (!script) return NextResponse.json({ error: "script is required" }, { status: 400 });

  try {
    const job = await enqueueJob({ projectId, script, payload: { target, config } });
    // 1-based position within the queue for this project (queued jobs only).
    const jobs = await listQueue(projectId);
    const queued = jobs.filter((j) => j.status === "queued").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const position = queued.findIndex((j) => j.id === job.id) + 1;
    return NextResponse.json({ jobId: job.id, position: position > 0 ? position : queued.length });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
