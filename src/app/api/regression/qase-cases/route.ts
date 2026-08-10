import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { QaseCasesAPI } from "@/app/modules/performance/utils/qase-ai/cases";
import { QaseSuitesAPI } from "@/app/modules/performance/utils/qase-ai/suites";

// Real, on-demand Qase case fetch (no background poller — same pattern as
// /api/api-automation/knowledge). User supplies their own Qase token client-side
// (stored in localStorage, never persisted server-side); this route calls api.qase.io
// directly and returns a flat case list for Generate Run / Run Cases Explorer to store
// on a run's summary jsonb.
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, projectCode } = (await request.json().catch(() => ({}))) as { token?: string; projectCode?: string };
  if (!token || !projectCode) {
    return NextResponse.json({ error: "token and projectCode are required" }, { status: 400 });
  }

  try {
    const suitesApi = new QaseSuitesAPI(token);
    const casesApi = new QaseCasesAPI(token);
    const [suites, cases] = await Promise.all([suitesApi.getByProject(projectCode), casesApi.getByProject(projectCode)]);
    const suiteTitleById = new Map(suites.map((s) => [s.id, s.title]));

    const result = cases.map((c) => ({
      id: String(c.id),
      title: c.title,
      suiteTitle: c.suite_id != null ? (suiteTitleById.get(c.suite_id) ?? undefined) : undefined,
      automation: c.automation,
      status: c.status,
    }));

    return NextResponse.json({ cases: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Qase case fetch failed" }, { status: 500 });
  }
}
