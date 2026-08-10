import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listTerminalJobs } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { toHistoryJob, type TerminalQueueJobState } from "./_shared";

// Backs RunHistoryTab.tsx's initial load() — this route (and history/options,
// and /api/queue/events) did not exist at all (404), so the tab could never
// show any completed/failed/cancelled jobs regardless of the rest of the
// queue-shape fixes.
export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const projectId = params.get("projectId") ?? undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(params.get("pageSize")) || 25));
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const status = (params.get("status") || "") as TerminalQueueJobState | "";
  const requester = params.get("requester") || "";
  const bp = params.get("bp") || "";

  try {
    // Ascending by createdAt, so run numbers accumulate in real chronological order.
    const rows = await listTerminalJobs(projectId);
    const runNoByScript = new Map<string, number>();
    const jobs = rows.map((row) => {
      const nextRunNo = (runNoByScript.get(row.script) ?? 0) + 1;
      runNoByScript.set(row.script, nextRunNo);
      return toHistoryJob(row, nextRunNo);
    });

    const fromMs = from ? Date.parse(`${from}T00:00:00`) : NaN;
    const toMs = to ? Date.parse(`${to}T23:59:59.999`) : NaN;

    const filtered = jobs.filter((job) => {
      if (status && job.state !== status) return false;
      if (requester && job.requester !== requester) return false;
      if (bp && job.bp !== bp) return false;
      if (Number.isFinite(fromMs) || Number.isFinite(toMs)) {
        const finished = job.finishedAt ? Date.parse(job.finishedAt) : NaN;
        if (!Number.isFinite(finished)) return false;
        if (Number.isFinite(fromMs) && finished < fromMs) return false;
        if (Number.isFinite(toMs) && finished > toMs) return false;
      }
      return true;
    });

    // Newest first.
    filtered.sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageJobs = filtered.slice(start, start + pageSize);

    return NextResponse.json({ jobs: pageJobs, page: safePage, pageSize, total, totalPages });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
