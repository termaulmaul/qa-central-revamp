import { NextRequest } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { buildQueueSnapshot } from "../_snapshot";

// PerformanceQueueTab.tsx and RunHistoryTab.tsx both subscribe to this stream
// for live queue updates (`event: snapshot`, JSON body = same shape as
// GET /api/queue). Neither route previously existed (404), so both tabs fell
// back to "RECONNECTING"/never refreshed automatically — this pushes a fresh
// snapshot on connect and every 5s after, well under the ~25s watchdog both
// tabs use to detect a stalled stream.
const PUSH_INTERVAL_MS = 5_000;

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return new Response("Unauthorized", { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = async () => {
        if (closed) return;
        try {
          const snapshot = await buildQueueSnapshot(projectId);
          controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
        } catch {
          // Skip a bad tick; the client's watchdog reconnects if pushes stop.
        }
      };

      void send();
      const timer = setInterval(() => void send(), PUSH_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
