import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listRuns } from "@/server/db/repositories/run-history-repo";
import { listQueue, type QueueJobStatus } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { aggregateTotal, type ApiMetricRow } from "@/app/modules/performance/utils/report-metrics";

// Aggregates recent pt_run_history rows (grouped by script) into the same
// ApiMetricRow[] + TOTAL shape report-metrics.ts already defines for the
// Performance module's HTML-report parsing, then reuses aggregateTotal()
// directly instead of re-deriving the weighted-average/error-rate math here.

const QUEUE_STATUSES: QueueJobStatus[] = ["queued", "running", "succeeded", "failed", "cancelled"];

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function classifyVerdict(verdict: string | null): "pass" | "fail" | "other" {
  if (!verdict) return "other";
  const v = verdict.toLowerCase();
  if (v.includes("fail")) return "fail";
  if (v.includes("pass") || v.includes("succ")) return "pass";
  return "other";
}

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    const [runs, queue] = await Promise.all([listRuns(projectId), listQueue(projectId)]);

    const byScript = new Map<string, { durations: number[]; pass: number; fail: number; other: number }>();
    for (const run of runs) {
      const bucket = byScript.get(run.script) ?? { durations: [], pass: 0, fail: 0, other: 0 };
      if (run.finishedAt) {
        const ms = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
        if (Number.isFinite(ms) && ms >= 0) bucket.durations.push(ms);
      }
      const verdict = classifyVerdict(run.verdict);
      bucket[verdict] += 1;
      byScript.set(run.script, bucket);
    }

    const rows: ApiMetricRow[] = Array.from(byScript.entries())
      .map(([script, bucket]) => {
        const sorted = [...bucket.durations].sort((a, b) => a - b);
        const samples = bucket.pass + bucket.fail + bucket.other;
        const avgMs = sorted.length ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length : 0;
        return {
          api: script,
          samples,
          avgMs,
          maxMs: sorted.length ? sorted[sorted.length - 1] : 0,
          minMs: sorted.length ? sorted[0] : 0,
          p95Ms: percentile(sorted, 95),
          errorRatePct: samples > 0 ? (bucket.fail / samples) * 100 : 0,
          rps: 0,
          errorSample: bucket.fail,
        };
      })
      .sort((a, b) => b.samples - a.samples);

    const total = aggregateTotal(rows);

    const queueCounts = QUEUE_STATUSES.reduce<Record<QueueJobStatus, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, { queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0 });
    for (const job of queue) queueCounts[job.status] += 1;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      projectId: projectId ?? null,
      runsSampled: runs.length,
      rows,
      total,
      queue: { counts: queueCounts, total: queue.length },
    });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
