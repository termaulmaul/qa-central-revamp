import { getDb } from "./db";
import { unwrap } from "./errors";

export interface TestReport {
  id: string;
  projectId: string | null;
  name: string;
  summary: Record<string, unknown>;
  createdAt: string;
}

interface TestReportRow {
  id: string;
  project_id: string | null;
  name: string;
  summary: Record<string, unknown>;
  created_at: string;
}

function toReport(row: TestReportRow): TestReport {
  return { id: row.id, projectId: row.project_id, name: row.name, summary: row.summary ?? {}, createdAt: row.created_at };
}

export async function listReports(projectId?: string): Promise<TestReport[]> {
  const db = await getDb();
  let query = db.from("pt_test_reports").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const rows = unwrap("listReports", await query);
  return (rows as TestReportRow[]).map(toReport);
}

export async function createReport(input: { projectId?: string; name: string; summary?: Record<string, unknown> }): Promise<TestReport> {
  const db = await getDb();
  const row = unwrap<TestReportRow>(
    "createReport",
    await db
      .from("pt_test_reports")
      .insert({ project_id: input.projectId ?? null, name: input.name, summary: input.summary ?? {} })
      .select("*")
      .single(),
  );
  return toReport(row as TestReportRow);
}
