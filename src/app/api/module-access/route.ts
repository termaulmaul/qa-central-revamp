import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listModuleAccess, setModuleAccess } from "@/server/db/repositories/module-access-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rules = await listModuleAccess();
    return NextResponse.json({ rules });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "god" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const roleCode = body?.roleCode;
  const moduleId = body?.moduleId;
  const allowed = body?.allowed;
  if (typeof roleCode !== "string" || typeof moduleId !== "string" || typeof allowed !== "boolean") {
    return NextResponse.json({ error: "roleCode, moduleId, and allowed are required" }, { status: 400 });
  }

  try {
    const rule = await setModuleAccess(roleCode, moduleId, allowed);
    return NextResponse.json({ rule });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
