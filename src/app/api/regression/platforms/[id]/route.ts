import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { updatePlatform } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const config = body?.config && typeof body.config === "object" ? (body.config as Record<string, unknown>) : undefined;
  if (name === undefined && config === undefined) {
    return NextResponse.json({ error: "name or config is required" }, { status: 400 });
  }

  try {
    const platform = await updatePlatform(id, { name, config });
    return NextResponse.json({ platform });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
