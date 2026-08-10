import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Flows are a different concept than endpoints; no table for them yet.
  // ApiCatalogTab.tsx expects a raw Flow[] array (it does
  // `Array.isArray(body) ? body.filter(...) : []`), not a { flows } envelope.
  return NextResponse.json([]);
}
