import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

// CronSchedulerTab.tsx manages the live crontab on a real remote ONPREM VM
// (10.184.120.48) over SSH — reading/writing exact crontab lines. That SSH
// connection doesn't exist in this environment (same class of gap as k6
// execution, live-log streaming, and report generation elsewhere in this
// port), so this is a documented stub. The previous implementation called
// into scheduler-repo.ts (a *different*, unrelated "schedules" table/shape:
// { schedules: Schedule[] } with structured name/cronExpr/script fields) —
// nobody else calls this route, and its shape didn't match what
// CronSchedulerTab.tsx reads at all ({ entries: CronEntry[], repoBase }),
// nor did it implement PUT (which the tab uses for every create/edit/
// enable/disable/delete — all of that returned a bare 405 before). This
// returns the *correct* shapes so the tab renders an honest empty state
// instead of a silently-broken 405/wrong-shape one.

export async function GET(_request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ entries: [], repoBase: "" });
}

export async function PUT(_request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "Live crontab management on the ONPREM runner is not available in this environment." },
    { status: 501 },
  );
}
