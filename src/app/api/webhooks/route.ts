import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createWebhook, listWebhooks } from "@/server/db/repositories/webhook-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { parseChannel, toWebhookEntry } from "./_shared";

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    const webhooks = await listWebhooks(projectId);
    return NextResponse.json({ webhooks: await Promise.all(webhooks.map(toWebhookEntry)) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  const body = await request.json();
  // WebhooksTab.tsx's form is { channel, targetRef, enabled } — not the raw
  // { url, events, secret } shape createWebhook expects. Map channel -> events[0]
  // and targetRef -> url (see _shared.ts for why).
  const { channel, targetRef, enabled } = body ?? {};
  if (typeof targetRef !== "string" || !targetRef) {
    return NextResponse.json({ error: "targetRef is required" }, { status: 400 });
  }

  try {
    const webhook = await createWebhook({
      projectId: body?.projectId ?? projectId,
      url: targetRef,
      events: [parseChannel(channel)],
      enabled: enabled ?? true,
    });
    return NextResponse.json({ webhook: await toWebhookEntry(webhook) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
