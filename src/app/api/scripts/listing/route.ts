import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listScripts } from "@/server/db/repositories/script-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    const scripts = await listScripts(projectId);
    const repositories = [{ name: "default", scripts: scripts.map((s) => s.path) }];
    // envModes/accModes are static defaults; no external source configured in this environment.
    return NextResponse.json({
      repositories,
      envModes: ["INT", "STG", "PRD", "PROD"],
      accModes: ["QA", "UAT"],
    });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
