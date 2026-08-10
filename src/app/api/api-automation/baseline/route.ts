import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

// Backs the api-automation Baseline page. The reference dashboard reads endpoint
// response-time baselines from the AI Factory backend (GET
// /api/factory/api/baseline), which aggregates per-request latency samples
// captured while executing generated specs. Nothing in this app captures those
// samples — the shared run queue records only whole-job duration — so there is
// genuinely nothing to aggregate here. This is a documented stub in the same
// spirit as /api/remote-cron: it returns the *correct* shape with
// `available: false` so the page can state the ceiling honestly instead of
// rendering zeroes as if they were measurements.
//
// Upgrade path: have whatever executes the specs POST per-request samples
// (method, path, env, suite, duration, outcome) into a table, then aggregate
// avg/min/max/p95/pass-rate per (env, method, path) here and flip `available`.

const ENVS = ["qa", "dev"];

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const env = request.nextUrl.searchParams.get("env") ?? ENVS[0];

  return NextResponse.json({
    available: false,
    env,
    envs: ENVS,
    data: [],
    reason: "No per-request latency samples are recorded in this environment.",
  });
}
