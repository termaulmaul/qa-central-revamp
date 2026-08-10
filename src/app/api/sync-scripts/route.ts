import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // No external script repository configured in this environment (reference used
  // PERFORMANCE_SCRIPT_REPO_PATH on-prem, out of scope here); this is an intentional stub.
  return NextResponse.json({
    message: "No external script repository configured in this environment; scripts are managed manually.",
  });
}
