import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getTradingHours, saveTradingHours } from "@/server/db/repositories/regression-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = await getTradingHours();
    return NextResponse.json({ config });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function PUT(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const config = body?.config && typeof body.config === "object" ? (body.config as Record<string, unknown>) : null;
  if (!config) return NextResponse.json({ error: "config is required" }, { status: 400 });

  try {
    const platform = await saveTradingHours(config);
    return NextResponse.json({ config: platform.config });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
