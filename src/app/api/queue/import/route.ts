import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RunHistoryTab.tsx's ImportModal treats any response.ok as success (it never
  // inspects a `message` field) and closes the modal with a false "Imported"
  // notice. Report this as a real error so the UI surfaces the actual reason
  // instead of a false success.
  return NextResponse.json({ error: "Import is not available in this environment." }, { status: 501 });
}
