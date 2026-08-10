import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { updateBurstOrder } from "@/server/db/repositories/burst-order-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patch = await request.json().catch(() => null);

  try {
    const order = await updateBurstOrder(id, patch ?? {});
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
