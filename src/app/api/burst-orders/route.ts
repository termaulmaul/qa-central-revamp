import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createBurstOrder, listBurstOrders } from "@/server/db/repositories/burst-order-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const orders = await listBurstOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { name, config } = body ?? {};
  if (!name || typeof name !== "string") return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const order = await createBurstOrder(name, (config as Record<string, unknown>) ?? {});
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
