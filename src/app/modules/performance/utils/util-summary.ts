// Highest-average utilization summary for the Utilization popup: the single
// entry with the highest average CPU and the one with the highest average
// memory, across every displayed row. Nodes compare on their avg CPU/Mem
// percentages; grouped pods on their percent-of-limit averages (the popup
// table shows pods in millicores/MB, but the captured data carries the
// percentage fields, which are the only scale comparable with nodes) — pods
// without a configured limit have no percentage and are skipped.

// Failure thresholds for the summary values (popup shows red above these; the
// copied text carries the plain values only).
export const CPU_AVG_THRESHOLD = 50;
export const MEMORY_AVG_THRESHOLD = 60;

export interface SummaryNodeInput {
  instance: string;
  hostname?: string;
  avg_cpu?: number;
  avg_memory?: number;
}

export interface SummaryPodInput {
  pod: string;
  avg_cpu_percent?: number | null;
  avg_memory_percent?: number | null;
}

export interface HighestAverageRow {
  label: 'CPU' | 'MEMORY';
  service: string;
  name: string;
  value: number;
  exceeded: boolean;
}

// Node hostname -> human-readable service name, mirroring pt-framework's
// getNodeType (src/lib/copyReport.ts). Hostnames encode the service as an
// uppercase substring (e.g. TREMAPPLELC034 -> Elasticsearch Node); unknown
// hosts fall back to "-". Keep in sync with the pt-framework source of truth.
function getNodeType(hostname: string): string {
  const h = (hostname || '').toUpperCase();
  if (h.includes('RPD')) return 'Redpanda Node';
  if (h.includes('OCH')) return 'OUCH Node';
  if (h.includes('ICH')) return 'ITCH Node';
  if (h.includes('ORA')) return 'ORACLEDB Node';
  if (h.includes('EDB')) return 'EDB PostgreSQL Node';
  if (h.includes('RDS')) return 'Redis Node';
  if (h.includes('CIC')) return 'CICD';
  if (h.includes('ELC')) return 'Elasticsearch Node';
  if (h.includes('SIX')) return 'k6 Node';
  if (h.includes('MON')) return 'Monitoring Node';
  return '-';
}

// "growin-udfservice-pt" -> "Growin Udf Service": drop the deployment suffix,
// split a trailing "service" into its own word, and title-case. A formatting
// rule only — no service names are hardcoded.
function podServiceName(pod: string): string {
  return pod
    .replace(/-pt$/i, '')
    .split('-')
    .flatMap((segment) => {
      const match = /^(.+)service$/i.exec(segment);
      return match ? [match[1], 'service'] : [segment];
    })
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Test-infrastructure services are excluded from the highest-average summary
// (the copied report) so it reflects the system under test, not the test rig.
// They remain in the full Utilization list, which is rendered independently.
//
// TEMPORARY (revert by removing this array from the union below): also exclude
// Elasticsearch Node from the summary and copied report on request. Its
// utilization is still collected/stored and still shown in the full node list —
// only the highest-average summary skips it.
const TEMP_EXCLUDED_SERVICES = ['Elasticsearch Node'];
const COPY_EXCLUDED_SERVICES = new Set([
  'CICD', 'k6 Node', 'Monitoring Node',
  ...TEMP_EXCLUDED_SERVICES,
]);

interface Candidate {
  service: string;
  name: string;
  value: number;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function highest(candidates: Candidate[]): Candidate | null {
  return candidates.reduce<Candidate | null>(
    (top, candidate) => (top === null || candidate.value > top.value ? candidate : top),
    null,
  );
}

export function highestAverages(
  nodes: SummaryNodeInput[],
  pods: SummaryPodInput[],
): HighestAverageRow[] {
  const candidates = (metric: 'cpu' | 'memory'): Candidate[] => [
    ...nodes.flatMap((node) => {
      const value = metric === 'cpu' ? node.avg_cpu : node.avg_memory;
      const host = node.hostname || node.instance;
      const service = getNodeType(host);
      return finite(value) && !COPY_EXCLUDED_SERVICES.has(service)
        ? [{ service, name: host, value }]
        : [];
    }),
    ...pods.flatMap((pod) => {
      const value = metric === 'cpu' ? pod.avg_cpu_percent : pod.avg_memory_percent;
      const service = podServiceName(pod.pod);
      return finite(value) && !COPY_EXCLUDED_SERVICES.has(service)
        ? [{ service, name: pod.pod, value }]
        : [];
    }),
  ];

  const rows: HighestAverageRow[] = [];
  const cpu = highest(candidates('cpu'));
  if (cpu) rows.push({ label: 'CPU', ...cpu, exceeded: cpu.value > CPU_AVG_THRESHOLD });
  const memory = highest(candidates('memory'));
  if (memory) rows.push({ label: 'MEMORY', ...memory, exceeded: memory.value > MEMORY_AVG_THRESHOLD });
  return rows;
}

// Plain-text copy payload: the two summary rows only, values without any color
// markup. Tab-separated columns, one row per line (no blank rows between them),
// so a paste into a plain-text target keeps the label / service / name / value
// columns aligned. Excel-quality cell placement uses the HTML payload below;
// this is the text/plain fallback the same clipboard write carries.
export function highestAveragesCopyText(rows: HighestAverageRow[]): string {
  return [
    'HIGHEST AVERAGE UTILIZATION',
    ...rows.map((row) => `${row.label}\t${row.service}\t${row.name}\t${row.value.toFixed(2)}`),
  ].join('\n');
}

// HTML copy payload — mirrors pt-framework's copyReport.ts highest-average
// table. Excel parses text/html from the clipboard into real cells: the header
// spans the row via colspan, and every <td> lands in its own cell, so nothing
// merges, shifts, or leaves blank rows. Column order matches the popup:
// label | service | container/host | value. No color markup in the copy.
export function highestAveragesCopyHtml(rows: HighestAverageRow[]): string {
  const cell = 'border:1px solid #999;padding:5px 10px;text-align:left;white-space:nowrap';
  const num = 'border:1px solid #999;padding:5px 10px;text-align:center;white-space:nowrap';
  const head = 'border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold';
  const body = rows.map((row) =>
    `<tr><td style="${cell}">${escapeHtml(row.label)}</td>`
    + `<td style="${cell}">${escapeHtml(row.service)}</td>`
    + `<td style="${cell}">${escapeHtml(row.name)}</td>`
    + `<td style="${num}">${row.value.toFixed(2)}</td></tr>`,
  ).join('');
  return `<table style="border-collapse:collapse;font-family:monospace;font-size:13px">`
    + `<thead><tr><th colspan="4" style="${head}">HIGHEST AVERAGE UTILIZATION</th></tr></thead>`
    + `<tbody>${body}</tbody></table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
