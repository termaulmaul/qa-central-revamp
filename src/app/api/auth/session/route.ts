import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function GET() {
  const profile = await getSessionProfile();
  return NextResponse.json({ profile });
}
