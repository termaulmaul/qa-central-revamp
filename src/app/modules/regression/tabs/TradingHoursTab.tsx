"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw, Save } from "lucide-react";
import { fetchTradingHoursApi, saveTradingHoursApi } from "../api";
import { DEFAULT_TRADING_HOURS, TRADING_HOURS_DAYS, type TradingHoursConfig, type TradingHoursDay } from "../types";
import { Card, CardHeader, ErrorBanner, inputClass, labelClass, Pill, primaryButtonClass } from "../ui";

const DAY_LABEL: Record<TradingHoursDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function parseConfig(raw: Record<string, unknown> | null): TradingHoursConfig {
  if (!raw) return DEFAULT_TRADING_HOURS;
  const days = Array.isArray(raw.days) ? (raw.days as unknown[]).filter((d): d is TradingHoursDay => TRADING_HOURS_DAYS.includes(d as TradingHoursDay)) : DEFAULT_TRADING_HOURS.days;
  return {
    days: days.length > 0 ? days : DEFAULT_TRADING_HOURS.days,
    startTime: typeof raw.startTime === "string" ? raw.startTime : DEFAULT_TRADING_HOURS.startTime,
    endTime: typeof raw.endTime === "string" ? raw.endTime : DEFAULT_TRADING_HOURS.endTime,
    timezone: typeof raw.timezone === "string" ? raw.timezone : DEFAULT_TRADING_HOURS.timezone,
  };
}

function isWithinWindow(config: TradingHoursConfig, now: Date): { active: boolean; nowLabel: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const weekday = (parts.find((p) => p.type === "weekday")?.value ?? "").toLowerCase().slice(0, 3);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const nowLabel = `${hour}:${minute}`;
    const dayMatches = config.days.some((d) => weekday.startsWith(d.slice(0, 3)));
    const inRange = nowLabel >= config.startTime && nowLabel < config.endTime;
    return { active: dayMatches && inRange, nowLabel: `${nowLabel} (${weekday})` };
  } catch {
    return { active: false, nowLabel: "—" };
  }
}

export function TradingHoursTab() {
  const [config, setConfig] = useState<TradingHoursConfig>(DEFAULT_TRADING_HOURS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, setTick] = useState(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await fetchTradingHoursApi();
      setConfig(parseConfig(raw));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load trading hours");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Recomputed every render — the 30s interval above forces a re-render via setTick so
  // this always reflects "now", without needing `tick` itself as a dependency.
  const windowStatus = isWithinWindow(config, new Date());

  const toggleDay = (day: TradingHoursDay) => {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveTradingHoursApi({ ...config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save trading hours");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <Clock className="size-5" aria-hidden="true" /> Trading Hours
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Global regression trading-window config — the reference implementation keeps this outside per-platform config, so it applies to every platform here too.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
          <span className={`size-2 rounded-full ${windowStatus.active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Now {windowStatus.nowLabel}</span>
          {windowStatus.active && <Pill tone="ok">within window</Pill>}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <Card className="max-w-2xl">
        <CardHeader title="Window" action={<button type="button" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" onClick={() => void load()} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" /></button>} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Days</span>
            <div className="flex flex-wrap gap-2">
              {TRADING_HOURS_DAYS.map((day) => {
                const active = config.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                        : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    {DAY_LABEL[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Start time</span>
              <input type="time" className={inputClass} value={config.startTime} onChange={(e) => setConfig((prev) => ({ ...prev, startTime: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>End time</span>
              <input type="time" className={inputClass} value={config.endTime} onChange={(e) => setConfig((prev) => ({ ...prev, endTime: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Timezone (IANA)</span>
              <input className={inputClass} value={config.timezone} onChange={(e) => setConfig((prev) => ({ ...prev, timezone: e.target.value }))} placeholder="Asia/Jakarta" />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="button" className={primaryButtonClass} onClick={() => void save()} disabled={saving}>
              <Save className="size-4" aria-hidden="true" />
              {saving ? "Saving…" : saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
