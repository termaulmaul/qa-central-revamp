import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ error: "Catalog scanning is not available in this environment." }, { status: 501 });
}
