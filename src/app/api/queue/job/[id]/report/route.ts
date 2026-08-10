import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function GET(_request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ error: "No artifacts available in this environment." }, { status: 404 });
}
