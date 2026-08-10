import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { deleteWebhook, updateWebhook } from "@/server/db/repositories/webhook-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { parseChannel, toWebhookEntry } from "../_shared";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  // Same { channel, targetRef, enabled } -> { events, url, enabled } mapping as
  // POST /api/webhooks — see _shared.ts.
  const patch: { url?: string; events?: string[]; enabled?: boolean } = {};
  if (typeof body?.targetRef === "string") patch.url = body.targetRef;
  if (body?.channel !== undefined) patch.events = [parseChannel(body.channel)];
  if (typeof body?.enabled === "boolean") patch.enabled = body.enabled;

  try {
    const webhook = await updateWebhook(id, patch);
    return NextResponse.json({ webhook: await toWebhookEntry(webhook) });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteWebhook(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
