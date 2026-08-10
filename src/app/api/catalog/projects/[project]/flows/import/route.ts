import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function POST(_request: NextRequest, { params: _params }: { params: Promise<{ project: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Flows have no backing table yet (see /api/catalog/flows), so this cannot
  // actually add anything. It previously returned { ok: true } unconditionally
  // — ApiCatalogTab.tsx's applyBpChanges only checks response.ok, so it always
  // reported "success" and closed the modal even though nothing was added, and
  // reloading always showed the same empty flow list back with no explanation.
  // Matches the honest-stub pattern used by /api/catalog/scan.
  return NextResponse.json({ error: "Flow catalog import is not available in this environment." }, { status: 501 });
}
