import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listTerminalJobs } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { toHistoryJob } from "../_shared";

// Backs RunHistoryTab.tsx's filter dropdowns. Did not exist at all (404); the
// tab degrades this gracefully to empty dropdowns on failure, but the table
// itself never loaded either since /api/queue/history was also missing.
export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    const rows = await listTerminalJobs(projectId);
    const runNoByScript = new Map<string, number>();
    const jobs = rows.map((row) => {
      const nextRunNo = (runNoByScript.get(row.script) ?? 0) + 1;
      runNoByScript.set(row.script, nextRunNo);
      return toHistoryJob(row, nextRunNo);
    });
    const requesters = [...new Set(jobs.map((job) => job.requester).filter((value): value is string => Boolean(value)))].sort();
    const bps = [...new Set(jobs.map((job) => job.bp))].sort();
    return NextResponse.json({ requesters, bps });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
