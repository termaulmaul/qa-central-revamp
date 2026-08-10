import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createProject, listProjects } from "@/server/db/repositories/project-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { GLOBAL_SETTINGS_PROJECT_NAME } from "@/server/db/repositories/settings-repo";
import { metadataPatchFromForm, toProjectView } from "./_shared";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ProjectsTab.tsx's own picker needs every project it created regardless of
  // status (it renders the Status column itself), but every OTHER caller
  // (ExecuteTestTab, SettingsTab, RunHistoryTab, test-reports) calls this with
  // no query param and expects only the selectable/active set.
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";

  try {
    // Exclude the sentinel row used to store deployment-wide settings — it
    // must never show up in project pickers (Runtime Defaults, Execute
    // Test, Projects tab).
    const projects = (await listProjects())
      .filter((project) => project.name !== GLOBAL_SETTINGS_PROJECT_NAME)
      .map(toProjectView)
      .filter((project) => includeArchived || project.status === "active");
    return NextResponse.json({ projects });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // ProjectsTab.tsx's form sends { name, version, owner, team, services,
  // description } — the previous handler only read { name, baseUrl,
  // environment } (fields the form never sends), so every submitted
  // version/owner/team/services/description was silently dropped.
  const { name, baseUrl, environment } = body ?? {};
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const project = await createProject({
      name,
      baseUrl,
      environment,
      metadata: metadataPatchFromForm({}, body ?? {}),
    });
    // ProjectsTab.tsx reads the created project directly (`await response.json() as
    // Project`, then `project.id`) — not wrapped in a `{ project }` envelope, which
    // is what the previous handler returned (so `project.id` was always undefined
    // and every "Add Project" submit reset the active project to null).
    return NextResponse.json(toProjectView(project));
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
