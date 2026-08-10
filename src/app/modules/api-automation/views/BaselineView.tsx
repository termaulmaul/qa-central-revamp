"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react";
import {
  EmptyRow,
  EnvironmentGapNotice,
  ErrorBanner,
  MetricCard,
  PillGroup,
  getJson,
  ghostButtonClass,
  inputClass,
  monoClass,
  panelClass,
  tdClass,
  thClass,
} from "../api-automation-shared";

interface BaselineItem {
  method: string;
  path: string;
  env: string;
  suite: string;
  sample_body: unknown;
  avg_ms: number;
  last_ms: number | null;
  min_ms: number;
  max_ms: number;
  p95_ms: number;
  positive: number;
  negative: number;
  total_runs: number;
  pass_rate: number;
  case_count: number;
  last_seen: string | null;
}

const ENVS = [
  { value: "qa", label: "QA" },
  { value: "dev", label: "Dev" },
] as const;

type EnvValue = (typeof ENVS)[number]["value"];

const SORTS = [
  { value: "avg_ms", label: "Avg" },
  { value: "p95_ms", label: "P95" },
  { value: "max_ms", label: "Max" },
  { value: "pass_rate", label: "Pass%" },
  { value: "total_runs", label: "Runs" },
] as const;

type SortKey = (typeof SORTS)[number]["value"];

const METHOD_TONES: Record<string, string> = {
  GET: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  POST: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  PUT: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  PATCH: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
  DELETE: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
};

function ms(value: number | null) {
  if (value == null) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value.toLocaleString()}ms`;
}

function speedClass(value: number) {
  if (value <= 2000) return "text-emerald-600 dark:text-emerald-400";
  if (value <= 5000) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function service(path: string) {
  return path.split("/").filter(Boolean)[0] ?? "other";
}

function PassBar({ positive, negative }: { positive: number; negative: number }) {
  const total = positive + negative;
  if (total === 0) return <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>;
  const pct = Math.round((positive / total) * 100);
  const tone = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{pct}%</span>
      </div>
      <div className="flex gap-2 text-[10px]">
        <span className="text-emerald-600 dark:text-emerald-400">+{positive}</span>
        <span className="text-rose-600 dark:text-rose-400">−{negative}</span>
      </div>
    </div>
  );
}

export function BaselineView() {
  const [items, setItems] = useState<BaselineItem[]>([]);
  const [env, setEnv] = useState<EnvValue>("qa");
  const [activeService, setActiveService] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("avg_ms");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState(false);

  const load = useCallback(async (targetEnv: EnvValue) => {
    setLoading(true);
    setError("");
    try {
      // Ceiling: response-time baselines are aggregated by the AI Factory backend
      // from its own PASS-run latency samples (GET /api/factory/api/baseline).
      // Nothing in this app captures per-request latency, so the local route is a
      // documented stub that answers `available: false` — see
      // src/app/api/api-automation/baseline/route.ts for the upgrade path. Reading
      // the flag (rather than hard-coding the empty state) means this page starts
      // rendering real rows the moment that route can aggregate anything.
      const body = await getJson<{ available?: boolean; data?: BaselineItem[] }>(
        `/api/api-automation/baseline?env=${encodeURIComponent(targetEnv)}`,
      );
      setAvailable(body.available === true);
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setAvailable(false);
      setError(err instanceof Error ? err.message : "Unable to load baseline data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(env);
  }, [env, load]);

  const services = useMemo(
    () => ["all", ...[...new Set(items.map((item) => service(item.path)))].sort()],
    [items],
  );

  const filtered = useMemo(
    () =>
      items
        .filter((item) => activeService === "all" || service(item.path) === activeService)
        .filter(
          (item) =>
            !search ||
            item.path.toLowerCase().includes(search.toLowerCase()) ||
            item.suite.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => b[sortKey] - a[sortKey]),
    [items, activeService, search, sortKey],
  );

  const totalRuns = filtered.reduce((sum, item) => sum + item.total_runs, 0);
  const avgPassRate = filtered.length
    ? Math.round(filtered.reduce((sum, item) => sum + item.pass_rate, 0) / filtered.length)
    : 0;
  const slowCount = filtered.filter((item) => item.avg_ms > 5000).length;

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Response time from passing runs, per environment.
        </p>
        <button type="button" className={ghostButtonClass} onClick={() => void load(env)} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />

      {!loading && !available && (
        <EnvironmentGapNotice title="Not available in this environment">
          Endpoint baselines are aggregated by the AI Factory backend from its per-request latency samples. Nothing in this
          app records per-endpoint response times — the shared run queue only stores whole-job duration — so there is no
          baseline to show and the table below is intentionally empty rather than reporting zeroes.{" "}
          <code className={monoClass}>GET /api/api-automation/baseline</code> is a documented stub that says so; it starts
          returning real rows once a runner posts per-request latency samples.
        </EnvironmentGapNotice>
      )}

      {available && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Endpoints" value={String(filtered.length)} caption="matching the filters" />
          <MetricCard label="Total runs" value={totalRuns.toLocaleString()} caption="samples aggregated" />
          <MetricCard label="Avg pass rate" value={`${avgPassRate}%`} caption="across endpoints" />
          <MetricCard label="Slow (>5s)" value={String(slowCount)} caption="average above 5s" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <PillGroup label="Env" options={ENVS} value={env} onChange={setEnv} />
        <PillGroup
          label="Service"
          options={services.map((item) => ({ value: item, label: item === "all" ? "All" : item }))}
          value={activeService}
          onChange={setActiveService}
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search endpoint or suite…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <PillGroup label="Sort" options={SORTS} value={sortKey} onChange={setSortKey} />
          <span className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">{filtered.length} endpoints</span>
        </div>
      </div>

      <section className={`overflow-hidden ${panelClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>Method</th>
                <th className={thClass}>Endpoint</th>
                <th className={thClass}>Avg</th>
                <th className={thClass}>Last</th>
                <th className={thClass}>Min / Max</th>
                <th className={thClass}>P95</th>
                <th className={thClass}>Pass rate</th>
                <th className={thClass} aria-label="Expand" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((item) => {
                const key = `${item.env}:${item.method}:${item.path}`;
                const isExpanded = expanded.has(key);
                const tone = METHOD_TONES[item.method] ?? METHOD_TONES.GET;
                return [
                  <tr
                    key={key}
                    onClick={() => toggle(key)}
                    className={`cursor-pointer ${isExpanded ? "bg-blue-50/60 dark:bg-blue-500/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                  >
                    <td className={tdClass}>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${tone}`}>
                        {item.method}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className={`${monoClass} max-w-xs truncate`} title={item.path}>
                        {item.path}
                      </div>
                      <span className="mt-1 inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {service(item.path)}
                      </span>
                    </td>
                    <td className={`${tdClass} ${monoClass} font-bold ${speedClass(item.avg_ms)}`}>{ms(item.avg_ms)}</td>
                    <td className={`${tdClass} ${monoClass} ${item.last_ms ? speedClass(item.last_ms) : ""}`}>
                      {ms(item.last_ms)}
                    </td>
                    <td className={`${tdClass} ${monoClass}`}>
                      <span className="text-emerald-600 dark:text-emerald-400">{ms(item.min_ms)}</span>
                      <span className="px-1 text-zinc-400">/</span>
                      <span className="text-rose-600 dark:text-rose-400">{ms(item.max_ms)}</span>
                    </td>
                    <td className={`${tdClass} ${monoClass} ${speedClass(item.p95_ms)}`}>{ms(item.p95_ms)}</td>
                    <td className={tdClass}>
                      <PassBar positive={item.positive} negative={item.negative} />
                    </td>
                    <td className={`${tdClass} text-zinc-400`}>
                      {isExpanded ? (
                        <ChevronUp className="size-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-4" aria-hidden="true" />
                      )}
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${key}:detail`} className="bg-zinc-50 dark:bg-zinc-900/60">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="flex flex-wrap items-start gap-6">
                          <div className="flex flex-wrap gap-3">
                            {[
                              ["Total runs", item.total_runs],
                              ["Pass", item.positive],
                              ["Fail", item.negative],
                              ["Cases", item.case_count],
                            ].map(([label, value]) => (
                              <div
                                key={String(label)}
                                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900"
                              >
                                <div className="text-xl font-bold">{value}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                  {label}
                                </div>
                              </div>
                            ))}
                          </div>
                          {item.suite && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Suite</p>
                              <p className={monoClass}>{item.suite}</p>
                            </div>
                          )}
                          {Boolean(item.sample_body) && (
                            <div className="min-w-48 flex-1">
                              <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Sample request body
                              </p>
                              <pre className="max-h-32 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 text-[11px] leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                {typeof item.sample_body === "string"
                                  ? item.sample_body
                                  : JSON.stringify(item.sample_body, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        {item.last_seen && (
                          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                            Last seen: {new Date(item.last_seen).toLocaleString()}
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
              {filtered.length === 0 && (
                <EmptyRow colSpan={8}>
                  {loading
                    ? "Loading baseline…"
                    : available
                      ? "No endpoints match these filters."
                      : "No baseline source is connected — see the notice above."}
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
