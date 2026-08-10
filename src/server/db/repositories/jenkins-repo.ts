import { getDb } from "./db";
import { unwrap } from "./errors";

export interface JenkinsJob {
  id: string;
  jobName: string;
  status: string | null;
  lastBuild: Record<string, unknown>;
  updatedAt: string;
}

interface JenkinsJobRow {
  id: string;
  job_name: string;
  status: string | null;
  last_build: Record<string, unknown>;
  updated_at: string;
}

function toJenkinsJob(row: JenkinsJobRow): JenkinsJob {
  return { id: row.id, jobName: row.job_name, status: row.status, lastBuild: row.last_build ?? {}, updatedAt: row.updated_at };
}

export async function listJenkinsJobs(): Promise<JenkinsJob[]> {
  const db = await getDb();
  const rows = unwrap("listJenkinsJobs", await db.from("pt_jenkins_jobs_cache").select("*").order("job_name"));
  return (rows as JenkinsJobRow[]).map(toJenkinsJob);
}

export async function upsertJenkinsJob(jobName: string, status: string | null, lastBuild: Record<string, unknown>): Promise<JenkinsJob> {
  const db = await getDb();
  const row = unwrap<JenkinsJobRow>(
    "upsertJenkinsJob",
    await db
      .from("pt_jenkins_jobs_cache")
      .upsert({ job_name: jobName, status, last_build: lastBuild, updated_at: new Date().toISOString() }, { onConflict: "job_name" })
      .select("*")
      .single(),
  );
  return toJenkinsJob(row as JenkinsJobRow);
}
