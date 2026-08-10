import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST(_request: NextRequest, { params: _params }: { params: Promise<{ project: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // See flows/import/route.ts — same false-success issue, same fix.
  return NextResponse.json({ error: "Flow catalog removal is not available in this environment." }, { status: 501 });
}
