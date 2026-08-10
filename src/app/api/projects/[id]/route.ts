import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { deleteProject, getProject, updateProject } from "@/server/db/repositories/project-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { metadataPatchFromForm, toProjectView } from "../_shared";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  // Same { name, version, owner, team, services, description } form shape as
  // POST /api/projects — the previous handler passed the raw body straight to
  // updateProject, which only reads .name/.baseUrl/.environment/.metadata, so
  // every edited version/owner/team/services/description was silently dropped.
  const { name, baseUrl, environment } = body ?? {};

  try {
    const existing = await getProject(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch: Partial<{ name: string; baseUrl: string | null; environment: string | null; metadata: Record<string, unknown> }> = {
      metadata: metadataPatchFromForm(existing.metadata, body ?? {}),
    };
    if (typeof name === "string" && name) patch.name = name;
    if (baseUrl !== undefined) patch.baseUrl = baseUrl;
    if (environment !== undefined) patch.environment = environment;

    const project = await updateProject(id, patch);
    return NextResponse.json(toProjectView(project));
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
