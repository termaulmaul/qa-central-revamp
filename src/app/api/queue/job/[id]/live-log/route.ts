import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function GET(_request: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Live log streaming needs a live running process, which is out of scope here;
  // stubbed. PerformanceQueueTab.tsx reads { text, offset, done, waiting } — the
  // previous stub returned { lines, done, message }, none of which match, so
  // `body.text`/`body.offset`/`body.waiting` all came back undefined.
  return NextResponse.json({ text: "", offset: 0, done: true, waiting: false });
}
