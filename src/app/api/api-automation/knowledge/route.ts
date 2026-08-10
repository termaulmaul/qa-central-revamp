import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { QaseAIClient } from "@/app/modules/performance/utils/qase-ai/client";
import { QaseProjectsAPI } from "@/app/modules/performance/utils/qase-ai/projects";
import { QaseSuitesAPI } from "@/app/modules/performance/utils/qase-ai/suites";
import { QaseCasesAPI } from "@/app/modules/performance/utils/qase-ai/cases";

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, projectCode } = (await request.json()) as { token?: string; projectCode?: string };
  if (!token || !projectCode) {
    return NextResponse.json({ error: "token and projectCode are required" }, { status: 400 });
  }

  try {
    const client = new QaseAIClient(new QaseProjectsAPI(token), new QaseSuitesAPI(token), new QaseCasesAPI(token));
    const projects = await client.getProjects();
    const project = projects.find((p) => p.code === projectCode);
    if (!project) return NextResponse.json({ error: `Project ${projectCode} not found` }, { status: 404 });

    const suites = await client.getSuites(projectCode);
    const cases = await client.getCases(projectCode);
    await client.updateKnowledge(project, suites, cases);
    const recommendations = await client.generateRecommendations(projectCode);
    const coverage = await client.analyzeCoverage(projectCode);

    return NextResponse.json({ project, suiteCount: suites.length, caseCount: cases.length, recommendations, coverage });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Knowledge request failed" }, { status: 500 });
  }
}
