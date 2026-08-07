// Parse a k6 "Detail" HTML report (benc-uk k6-reporter output) into a per-API
// metrics table, matching the reference collapse/aggregation in pt-framework's
// lib/webhook/pt-summary.mjs — but reading the values straight out of the report
// HTML so nothing is recomputed or mocked.
//
// The report has no single per-API table. Each API contributes five rows to the
// "Custom Metrics" table, one per metric prefix:
//   duration_<api>    → Average / Maximum / Minimum / 95th Percentile
//   sample_<api>      → Count (= Samples), Rate (sample rate, RPS fallback)
//   error_rate_<api>  → Rate (failure fraction, ×100 = Error Rate %)
//   error_count_<api> → Count (= Error Sample / failure count)
//   rps_<api>         → Rate (RPS when populated)
// We group by the shared <api> suffix, collapse to one row, preserve execution
// order (the numeric prefix), and append an aggregated TOTAL row.

export interface ApiMetricRow {
  api: string;
  samples: number;
  avgMs: number;
  maxMs: number;
  minMs: number;
  p95Ms: number;
  errorRatePct: number;
  rps: number;
  errorSample: number;
}

export interface ReportMetrics {
  rows: ApiMetricRow[];
  total: ApiMetricRow; // api === 'TOTAL'
}

// The Custom Metrics <thead> column order (benc-uk k6-reporter):
// 0: name, 1: Count, 2: Rate, 3: Average, 4: Maximum, 5: Median, 6: Minimum,
// 7: 90th Percentile, 8: 95th Percentile.
const COL = { count: 1, rate: 2, average: 3, maximum: 4, minimum: 6, p95: 8 } as const;
const PREFIXES = ['duration_', 'error_rate_', 'error_count_', 'sample_', 'rps_'] as const;

// A populated cell is a formatted number (e.g. "69.52"); an absent one is "-".
function num(text: string | null | undefined): number | null {
  if (text == null) return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed === '-') return null;
  const value = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

interface ApiAccumulator {
  api: string;
  order: number;
  samples: number | null;
  sampleRate: number | null;
  avgMs: number | null;
  maxMs: number | null;
  minMs: number | null;
  p95Ms: number | null;
  errorRateFraction: number | null;
  rpsRate: number | null;
  errorCount: number | null;
}

// Find the "Custom Metrics" table: the pure-table immediately following an <h2>
// whose text is "Custom Metrics" (the first pure-table is the built-in http_*
// metrics, which must be skipped).
function findCustomMetricsTable(doc: Document): HTMLTableElement | null {
  const headings = Array.from(doc.querySelectorAll('h2'));
  for (const h2 of headings) {
    if (h2.textContent?.trim().toLowerCase() === 'custom metrics') {
      let node: Element | null = h2.nextElementSibling;
      while (node && node.tagName !== 'TABLE') node = node.nextElementSibling;
      if (node) return node as HTMLTableElement;
    }
  }
  // Fallback: any table containing a duration_/sample_ bold cell is the one.
  for (const table of Array.from(doc.querySelectorAll('table'))) {
    if (table.querySelector('td b')) {
      const label = table.querySelector('td b')?.textContent ?? '';
      if (PREFIXES.some((p) => label.startsWith(p))) return table as HTMLTableElement;
    }
  }
  return null;
}

function splitMetricLabel(label: string): { prefix: string; api: string } | null {
  for (const prefix of PREFIXES) {
    if (label.startsWith(prefix)) return { prefix: prefix.slice(0, -1), api: label.slice(prefix.length) };
  }
  return null;
}

// Numeric-prefix-aware ordering ("001_01_02" before "001_01_10") so the table
// preserves the report's API execution order.
export function apiOrderKey(api: string): number[] {
  return (api.match(/\d+/g) ?? []).map(Number);
}

// Compare two API ids by their numeric prefix (execution order), used to sort
// the collapsed rows. Exported for testing alongside apiOrderKey.
export function compareApiOrder(a: string, b: string): number {
  const ka = apiOrderKey(a);
  const kb = apiOrderKey(b);
  const len = Math.max(ka.length, kb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (ka[i] ?? 0) - (kb[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

export function parseDetailReport(html: string): ReportMetrics | null {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return null;
  }
  const table = findCustomMetricsTable(doc);
  if (!table) return null;

  const apis = new Map<string, ApiAccumulator>();
  let order = 0;
  for (const tr of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(tr.querySelectorAll('td'));
    const label = cells[0]?.querySelector('b')?.textContent?.trim()
      ?? cells[0]?.textContent?.trim() ?? '';
    const split = splitMetricLabel(label);
    if (!split) continue;
    const { prefix, api } = split;
    let acc = apis.get(api);
    if (!acc) {
      acc = {
        api, order: order++, samples: null, sampleRate: null, avgMs: null, maxMs: null,
        minMs: null, p95Ms: null, errorRateFraction: null, rpsRate: null, errorCount: null,
      };
      apis.set(api, acc);
    }
    const cell = (index: number) => num(cells[index]?.textContent);
    if (prefix === 'duration') {
      acc.avgMs = cell(COL.average);
      acc.maxMs = cell(COL.maximum);
      acc.minMs = cell(COL.minimum);
      acc.p95Ms = cell(COL.p95);
    } else if (prefix === 'sample') {
      acc.samples = cell(COL.count);
      acc.sampleRate = cell(COL.rate);
    } else if (prefix === 'error_rate') {
      acc.errorRateFraction = cell(COL.rate);
    } else if (prefix === 'error_count') {
      acc.errorCount = cell(COL.count);
    } else if (prefix === 'rps') {
      acc.rpsRate = cell(COL.rate);
    }
  }

  if (apis.size === 0) return null;

  const ordered = Array.from(apis.values())
    .sort((a, b) => compareApiOrder(a.api, b.api) || a.order - b.order)
    .map((acc) => ({
      api: acc.api,
      samples: acc.samples ?? 0,
      avgMs: acc.avgMs ?? 0,
      maxMs: acc.maxMs ?? 0,
      minMs: acc.minMs ?? 0,
      p95Ms: acc.p95Ms ?? 0,
      // error_rate is a fraction (1.00 = 100%); render as a percentage.
      errorRatePct: (acc.errorRateFraction ?? 0) * 100,
      // Prefer the dedicated rps_ rate; fall back to the sample rate.
      rps: acc.rpsRate ?? acc.sampleRate ?? 0,
      errorSample: acc.errorCount ?? 0,
    }));

  return { rows: ordered, total: aggregateTotal(ordered) };
}

// TOTAL row (mirrors pt-summary.mjs): Σ samples, sample-weighted avg, global
// min/max across APIs, max p95, Σerrors/Σsamples for err%, Σ rps, Σ errors.
// Exported so the aggregation can be unit-tested without a DOM.
export function aggregateTotal(rows: ApiMetricRow[]): ApiMetricRow {
  const totalSamples = rows.reduce((s, r) => s + r.samples, 0);
  const totalErrors = rows.reduce((s, r) => s + r.errorSample, 0);
  const weightedAvg = totalSamples > 0
    ? rows.reduce((s, r) => s + r.avgMs * r.samples, 0) / totalSamples
    : 0;
  const minCandidates = rows.map((r) => r.minMs).filter((m) => m > 0);
  return {
    api: 'TOTAL',
    samples: totalSamples,
    avgMs: weightedAvg,
    maxMs: rows.length ? Math.max(...rows.map((r) => r.maxMs)) : 0,
    minMs: minCandidates.length ? Math.min(...minCandidates) : 0,
    p95Ms: rows.length ? Math.max(...rows.map((r) => r.p95Ms)) : 0,
    errorRatePct: totalSamples > 0 ? (totalErrors / totalSamples) * 100 : 0,
    rps: rows.reduce((s, r) => s + r.rps, 0),
    errorSample: totalErrors,
  };
}

// Display helpers — keep the report's 2-decimal formatting; integers stay whole.
export function fmtNum(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
export function fmtInt(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value)) : '—';
}
export function fmtPct(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';
}
