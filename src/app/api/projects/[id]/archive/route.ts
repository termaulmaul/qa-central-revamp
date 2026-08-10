import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getProject, updateProject } from "@/server/db/repositories/project-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { toProjectView } from "../../_shared";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const restore = Boolean((body as { restore?: unknown } | null)?.restore);

  // No archived column exists on pt_projects; this was previously an
  // unconditional no-op ({ ok: true } always, whatever the actual state), so
  // Archive/Restore appeared to succeed but never changed anything — and since
  // no project ever had a `status` field either (see ../_shared.ts), every
  // project in the picker always evaluated as "not active", silently wiping
  // the app's selected project on every Projects tab load. Fixed by folding
  // `archived` into the existing metadata jsonb column, same as the rest of
  // this tab's fields.
  try {
    const existing = await getProject(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = await updateProject(id, { metadata: { ...existing.metadata, archived: !restore } });
    return NextResponse.json(toProjectView(project));
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
