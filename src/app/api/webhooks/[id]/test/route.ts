import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST(_request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // WebhooksTab.tsx's Test button is reachable whenever a webhook is enabled +
  // configured, and treats any response.ok as success (it never reads
  // `message`), so this previously reported a fake "delivered" outcome for a
  // send that never happened. Report it as a real error instead, matching the
  // same fix applied to /api/queue/import and the catalog flow stubs.
  return NextResponse.json({ error: "Test delivery is not available in this environment." }, { status: 501 });
}
