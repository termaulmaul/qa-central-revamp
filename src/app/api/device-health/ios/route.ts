import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { listSnapshots, recordSnapshot } from "@/server/db/repositories/device-health-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// ponytail: snapshot-based health only, no on-prem device-farm/SSH access here; upgrade = wire an af-socket-equivalent realtime ingestion process that calls recordSnapshot() on device events, UI doesn't need to change.

const PLATFORM = "ios" as const;

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snapshots = await listSnapshots(PLATFORM);
    return NextResponse.json({ snapshots });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { deviceId, status, metrics } = body ?? {};
  if (!deviceId || typeof deviceId !== "string") return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
  if (!status || typeof status !== "string") return NextResponse.json({ error: "status is required" }, { status: 400 });

  try {
    const snapshot = await recordSnapshot(PLATFORM, deviceId, status, metrics ?? {});
    return NextResponse.json({ snapshot });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}
