import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listJenkinsJobs, upsertJenkinsJob } from "@/server/db/repositories/jenkins-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// No live Jenkins server is configured in this environment (no JENKINS_URL/JENKINS_USER/JENKINS_TOKEN),
// so this endpoint only reads/writes the local cache populated manually via the Settings tab.

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const jobs = await listJenkinsJobs();
    return NextResponse.json({ jobs });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { jobName, status, lastBuild } = body ?? {};
  if (!jobName || typeof jobName !== "string") {
    return NextResponse.json({ error: "jobName is required" }, { status: 400 });
  }

  try {
    const job = await upsertJenkinsJob(jobName, status ?? null, lastBuild ?? {});
    return NextResponse.json({ job });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
