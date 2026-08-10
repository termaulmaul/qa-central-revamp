"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { DeviceHealthSnapshot, DevicePlatform } from "@/server/db/repositories/device-health-repo";

type Props = {
  platform: DevicePlatform;
  apiPath: string;
};

type MetricPair = { key: string; value: string };

const STATUS_STYLES: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  online: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  recovering: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  scanning: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  unhealthy: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  offline: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
};
const DEFAULT_STATUS_STYLE = "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const STATUS_OPTIONS = ["healthy", "unhealthy", "recovering", "scanning", "offline"];

function statusStyle(status: string) {
  return STATUS_STYLES[status.toLowerCase()] ?? DEFAULT_STATUS_STYLE;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function MetricsList({ metrics }: { metrics: Record<string, unknown> }) {
  const entries = Object.entries(metrics ?? {});
  if (entries.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">No metrics recorded</p>;
  }
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="truncate text-zinc-500 dark:text-zinc-400">{key}</dt>
          <dd className="truncate text-right font-medium text-zinc-900 dark:text-zinc-100">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DeviceCard({ snapshot }: { snapshot: DeviceHealthSnapshot }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.deviceId}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Updated {formatTimestamp(snapshot.recordedAt)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(snapshot.status)}`}>
          {snapshot.status}
        </span>
      </div>
      <MetricsList metrics={snapshot.metrics} />
    </div>
  );
}

export function DeviceHealthView({ platform, apiPath }: Props) {
  const [snapshots, setSnapshots] = useState<DeviceHealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [metricPairs, setMetricPairs] = useState<MetricPair[]>([{ key: "", value: "" }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load snapshots (${res.status})`);
      const data = (await res.json()) as { snapshots: DeviceHealthSnapshot[] };
      setSnapshots(data.snapshots ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snapshots");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  const latestByDevice = new Map<string, DeviceHealthSnapshot>();
  for (const snap of snapshots) {
    if (!latestByDevice.has(snap.deviceId)) latestByDevice.set(snap.deviceId, snap);
  }
  const devices = Array.from(latestByDevice.values());
  const feed = snapshots.slice(0, 50);

  function updateMetricPair(index: number, field: keyof MetricPair, value: string) {
    setMetricPairs((pairs) => pairs.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair)));
  }

  function addMetricPair() {
    setMetricPairs((pairs) => [...pairs, { key: "", value: "" }]);
  }

  function removeMetricPair(index: number) {
    setMetricPairs((pairs) => (pairs.length > 1 ? pairs.filter((_, i) => i !== index) : pairs));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!deviceId.trim()) {
      setError("Device ID is required");
      return;
    }
    const metrics: Record<string, unknown> = {};
    for (const pair of metricPairs) {
      if (pair.key.trim()) metrics[pair.key.trim()] = pair.value;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: deviceId.trim(), status, metrics }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to record snapshot (${res.status})`);
      }
      setDeviceId("");
      setStatus(STATUS_OPTIONS[0]);
      setMetricPairs([{ key: "", value: "" }]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record snapshot");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section id="overview" aria-labelledby="device-grid-title" className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between gap-3">
          <h2 id="device-grid-title" className="text-lg font-semibold">Devices</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <div className="mt-4">
          {loading && devices.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading devices…</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No snapshots recorded yet for {platform}.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((snapshot) => (
                <DeviceCard key={snapshot.deviceId} snapshot={snapshot} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="reports" aria-labelledby="event-feed-title" className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 id="event-feed-title" className="text-lg font-semibold">Event Feed</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Most recent snapshots across all devices, newest first.</p>
        <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          {feed.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No events yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {feed.map((snap) => (
                <li key={snap.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-40 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{formatTimestamp(snap.recordedAt)}</span>
                  <span className="w-32 shrink-0 truncate font-medium text-zinc-900 dark:text-zinc-100">{snap.deviceId}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle(snap.status)}`}>{snap.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="configuration" aria-labelledby="record-title" className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 id="record-title" className="text-lg font-semibold">Record Snapshot</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manually register a device health snapshot.</p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Device ID</span>
              <input
                type="text"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                placeholder="e.g. emulator-5554"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Metrics</span>
            {metricPairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.key}
                  onChange={(event) => updateMetricPair(index, "key", event.target.value)}
                  placeholder="key (e.g. batteryLevel)"
                  className="w-1/2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  value={pair.value}
                  onChange={(event) => updateMetricPair(index, "value", event.target.value)}
                  placeholder="value"
                  className="w-1/2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => removeMetricPair(index)}
                  disabled={metricPairs.length === 1}
                  aria-label="Remove metric"
                  className="shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMetricPair}
              className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add metric
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Recording…" : "Record Snapshot"}
          </button>
        </form>
      </section>
    </div>
  );
}
