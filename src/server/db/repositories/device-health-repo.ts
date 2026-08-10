import { getDb } from "./db";
import { unwrap } from "./errors";

export type DevicePlatform = "android" | "ios";

export interface DeviceHealthSnapshot {
  id: string;
  platform: DevicePlatform;
  deviceId: string;
  status: string;
  metrics: Record<string, unknown>;
  recordedAt: string;
}

interface DeviceHealthSnapshotRow {
  id: string;
  platform: DevicePlatform;
  device_id: string;
  status: string;
  metrics: Record<string, unknown>;
  recorded_at: string;
}

function toSnapshot(row: DeviceHealthSnapshotRow): DeviceHealthSnapshot {
  return {
    id: row.id,
    platform: row.platform,
    deviceId: row.device_id,
    status: row.status,
    metrics: row.metrics ?? {},
    recordedAt: row.recorded_at,
  };
}

export async function listSnapshots(platform: DevicePlatform): Promise<DeviceHealthSnapshot[]> {
  const db = await getDb();
  const rows = unwrap(
    "listSnapshots",
    await db.from("pt_device_health_snapshots").select("*").eq("platform", platform).order("recorded_at", { ascending: false }),
  );
  return (rows as DeviceHealthSnapshotRow[]).map(toSnapshot);
}

export async function recordSnapshot(
  platform: DevicePlatform,
  deviceId: string,
  status: string,
  metrics: Record<string, unknown>,
): Promise<DeviceHealthSnapshot> {
  const db = await getDb();
  const row = unwrap<DeviceHealthSnapshotRow>(
    "recordSnapshot",
    await db
      .from("pt_device_health_snapshots")
      .insert({ platform, device_id: deviceId, status, metrics })
      .select("*")
      .single(),
  );
  return toSnapshot(row as DeviceHealthSnapshotRow);
}
