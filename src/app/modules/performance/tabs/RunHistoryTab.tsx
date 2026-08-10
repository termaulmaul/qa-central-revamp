"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Check, Copy, ExternalLink, RotateCcw, XCircle } from 'lucide-react';
import { getProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';
import { parseDetailReport, fmtInt, fmtNum, fmtPct, type ApiMetricRow, type ReportMetrics } from '../utils/report-metrics';
import { extractExecutionErrors } from '../utils/execution-errors';
import { highestAverages, highestAveragesCopyHtml, highestAveragesCopyText } from '../utils/util-summary';

type TerminalQueueJobState = 'succeeded' | 'failed' | 'cancelled';
type QueueArtifactKind = 'stdout' | 'stderr' | 'result' | 'report';

interface QueueHistoryJob {
  id: string;
  state: TerminalQueueJobState;
  source: string | null;
  script: string | null;
  target: string | null;
  config: {
    env: string;
    runby: string;
    platform: string;
    vus: number;
    duration: string;
    scenario: string;
  } | null;
  bp: string;
  requester: string | null;
  notes: string;
  failureReason: string | null;
  runNo: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  artifacts: Record<QueueArtifactKind, boolean>;
  hasUtilization: boolean;
}

// Node/pod utilization captured at run completion (pt-framework's
// _webui_utilization), read back from the job's result artifact.
interface UtilNodeMetric {
  instance: string;
  hostname?: string;
  avg_cpu: number;
  max_cpu: number;
  avg_memory: number;
  max_memory: number;
  avg_disk?: number | null;
  max_disk?: number | null;
}

interface UtilPodMetric {
  pod: string;
  node?: string;
  pod_count?: number;
  avg_cpu_millicores: number;
  max_cpu_millicores: number;
  avg_memory_mb: number;
  max_memory_mb: number;
  // Percent-of-limit averages, captured alongside the absolute values; the
  // highest-average summary compares on this scale (the only one comparable
  // with node percentages). Null when the container has no configured limit.
  avg_cpu_percent?: number | null;
  avg_memory_percent?: number | null;
}

interface RunUtilization {
  nodes?: UtilNodeMetric[];
  pods?: UtilPodMetric[];
  fetchedAt?: string;
}

interface QueueHistoryPage {
  jobs: QueueHistoryJob[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface QueueHistoryOptions {
  requesters: string[];
  bps: string[];
}

// "26 Jun, 08.50" — day + short month, 24h time with a dot separator, matching
// pt-framework's toLocaleString('id-ID', {day,month,hour,minute}).
function fmtDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.toLocaleString('en-GB', { day: '2-digit' });
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
  return `${day} ${month}, ${time}`;
}

// Elapsed run time as "1m33s" (pt-framework's duration()). Sub-minute reads
// "0m30s". Null when the backend could not compute it.
function fmtDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '—';
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m${String(seconds).padStart(2, '0')}s`;
}

// Human status label + pill class. pt-framework shows FINISHED/FAILED/CANCELLED;
// qa-central's terminal state 'succeeded' maps to the same "FINISHED" label.
function statusLabel(state: TerminalQueueJobState): string {
  return state === 'succeeded' ? 'FINISHED' : state.toUpperCase();
}
function statusClass(state: TerminalQueueJobState): 'ok' | 'err' | 'warn' {
  return state === 'succeeded' ? 'ok' : state === 'failed' ? 'err' : 'warn';
}

function requesterLabel(job: QueueHistoryJob, sessionUser: string | null): string {
  // Prefer the requester captured on the job. For rows created before the
  // requester was recorded, fall back to the currently authenticated user
  // (derived from the active login session), so the column shows a username
  // rather than the run provenance. Empty only when there is no session either.
  return job.requester ?? sessionUser ?? '—';
}

async function responseJson<T>(response: Response, fallback: string): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  throw new Error(typeof body?.error === 'string' ? body.error : fallback);
}

function historyQuery(
  projectId: string | null,
  page: number,
  pageSize: number,
  from: string,
  to: string,
  status: TerminalQueueJobState | '',
  requester: string,
  bp: string,
): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (projectId) params.set('projectId', projectId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (status) params.set('status', status);
  if (requester) params.set('requester', requester);
  if (bp) params.set('bp', bp);
  return `?${params.toString()}`;
}

export const RunHistory = () => {
  const [projectId, setProjectId] = useState<string | null>(() => getProjectId());
  const [history, setHistory] = useState<QueueHistoryPage | null>(null);
  const [options, setOptions] = useState<QueueHistoryOptions>({ requesters: [], bps: [] });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<TerminalQueueJobState | ''>('');
  const [requester, setRequester] = useState('');
  const [bp, setBp] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retrying, setRetrying] = useState<Set<string>>(() => new Set());
  const [reportJob, setReportJob] = useState<{ id: string; runNo: number } | null>(null);
  const [errorsJob, setErrorsJob] = useState<string | null>(null);
  const [utilJob, setUtilJob] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const requestId = useRef(0);
  // Latest refresh fn + the active job ids seen on the queue stream, so the SSE
  // subscription (which must not re-open on every filter change) can call the
  // current refresh and detect a job leaving the queue (i.e. a completion).
  const refreshRef = useRef<() => void>(() => undefined);
  const activeJobIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const next = await fetch(
        `/api/queue/history${historyQuery(projectId, page, pageSize, from, to, status, requester, bp)}`,
        { credentials: 'include' },
      ).then((response) => responseJson<QueueHistoryPage>(response, 'Unable to load history'));
      if (id !== requestId.current) return;
      setHistory(next);
    } catch (cause) {
      if (id !== requestId.current) return;
      setHistory(null);
      setError(cause instanceof Error ? cause.message : 'Unable to load history');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [bp, from, page, pageSize, projectId, requester, status, to]);

  const loadOptions = useCallback(async () => {
    try {
      const next = await fetch(
        `/api/queue/history/options${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
        { credentials: 'include' },
      ).then((response) => responseJson<QueueHistoryOptions>(response, 'Unable to load filter options'));
      setOptions(next);
    } catch {
      // Filter dropdowns degrade to the empty set; the table still loads.
      setOptions({ requesters: [], bps: [] });
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    const updateProject = () => {
      setProjectId(getProjectId());
      setPage(1);
    };
    window.addEventListener(PROJECT_CONTEXT_EVENT, updateProject);
    return () => window.removeEventListener(PROJECT_CONTEXT_EVENT, updateProject);
  }, []);

  // Current authenticated username, read from the same session endpoint the
  // app uses (App.tsx). Used as the Requester fallback for rows with no stored
  // requester, so the value stays dynamic and tied to the active login session.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (!response.ok) return;
        const payload = await response.json() as { authenticated?: boolean; user?: { username?: string } };
        if (!cancelled && payload.authenticated && payload.user?.username) {
          setSessionUser(payload.user.username);
        }
      } catch {
        /* leave sessionUser null — the column falls back to '—' */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(() => {
    void load();
    void loadOptions();
  }, [load, loadOptions]);
  refreshRef.current = refresh;

  // Auto-refresh on execution changes: subscribe to the queue SSE stream (the
  // same one Performance Queue uses) and refetch history whenever a job leaves
  // the active queue — i.e. a run completed and a terminal row appeared. Gating
  // on "a job left" (rather than every snapshot) avoids refetching on plain
  // enqueue/claim churn, preventing unnecessary requests and flicker. The
  // requestId guard in load() drops stale responses, so no duplicate rows or
  // races. Re-subscribes only when the project changes, never on filter edits.
  useEffect(() => {
    const suffix = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    let source: EventSource | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let lastSnapshotAt = Date.now();
    activeJobIds.current = null;

    const onSnapshot = (event: MessageEvent<string>) => {
      lastSnapshotAt = Date.now();
      let snapshot: { current: { id: string } | null; queue: { id: string }[] };
      try {
        snapshot = JSON.parse(event.data) as typeof snapshot;
      } catch {
        return;
      }
      const ids = new Set<string>();
      if (snapshot.current) ids.add(snapshot.current.id);
      for (const job of snapshot.queue ?? []) ids.add(job.id);
      const previous = activeJobIds.current;
      activeJobIds.current = ids;
      // First snapshot just seeds the baseline; after that, any id that was
      // active before and is now gone means that job reached a terminal state.
      const completed = previous !== null && [...previous].some((id) => !ids.has(id));
      if (completed) {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => refreshRef.current(), 300);
      }
    };
    const open = () => {
      source?.close();
      source = new EventSource(`/api/queue/events${suffix}`, { withCredentials: true });
      lastSnapshotAt = Date.now();
      source.addEventListener('snapshot', onSnapshot as EventListener);
    };
    open();

    // Watchdog: the server pushes at least every 10s; if none arrives for ~25s
    // the stream is a zombie (never errored) — reopen it and refetch history so
    // a completion that happened during the stall is not missed.
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastSnapshotAt > 25_000) { open(); refreshRef.current(); }
    }, 5_000);

    return () => {
      window.clearInterval(watchdog);
      if (debounce) clearTimeout(debounce);
      source?.removeEventListener('snapshot', onSnapshot as EventListener);
      source?.close();
    };
  }, [projectId]);

  const retry = useCallback(async (jobId: string) => {
    setRetrying((pending) => new Set(pending).add(jobId));
    setError('');
    setNotice('');
    try {
      await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/retry${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`, {
        method: 'POST',
        credentials: 'include',
      }).then((response) => responseJson<{ jobId: string }>(response, 'Unable to retry queue job'));
      setNotice('Retry queued');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to retry queue job');
    } finally {
      setRetrying((pending) => {
        const next = new Set(pending);
        next.delete(jobId);
        return next;
      });
    }
  }, [load, projectId]);

  const saveNote = useCallback(async (jobId: string, notes: string) => {
    setSavingNote(jobId);
    setError('');
    setNotice('');
    try {
      const updated = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/notes${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      }).then((response) => responseJson<{ id: string; notes: string }>(response, 'Unable to save note'));
      setHistory((current) => current && {
        ...current,
        jobs: current.jobs.map((job) => job.id === jobId ? { ...job, notes: updated.notes } : job),
      });
      setNoteDrafts((drafts) => {
        const next = { ...drafts };
        delete next[jobId];
        return next;
      });
      setNotice('Note saved');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save note');
    } finally {
      setSavingNote(null);
    }
  }, [projectId]);

  // Absolute URL of the standalone HTML report — the "View HTML Report" anchor
  // opens it in a new tab (pt-framework's ExternalLink action).
  const reportUrl = useCallback((jobId: string) => new URL(
    `/api/queue/job/${encodeURIComponent(jobId)}/report?projectId=${encodeURIComponent(projectId ?? 'default')}`,
    window.location.origin,
  ).href, [projectId]);

  const updateFilters = (next: () => void) => {
    next();
    setPage(1);
  };

  const jobs = history?.jobs ?? [];
  const currentPage = history?.page ?? page;
  const totalPages = history?.totalPages ?? 1;

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title">Run History</h1>
          <p className="page-subtitle">Completed, failed, and cancelled jobs.</p>
        </div>
        <div className="pt-kicker-actions">
          <button className="pt-ghost-btn" type="button" onClick={() => setImportOpen(true)}>Import</button>
          <button className="pt-ghost-btn" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <label className="in-wrap">
            <span className="f-label">From</span>
            <input type="date" aria-label="Completion start date" className="f-input" value={from} onChange={(event) => updateFilters(() => setFrom(event.target.value))} />
          </label>
          <label className="in-wrap">
            <span className="f-label">To</span>
            <input type="date" aria-label="Completion end date" className="f-input" value={to} onChange={(event) => updateFilters(() => setTo(event.target.value))} />
          </label>
          <label className="in-wrap">
            <span className="f-label">Requester</span>
            <select aria-label="Requester" className="f-input" value={requester} onChange={(event) => updateFilters(() => setRequester(event.target.value))}>
              <option value="">All requesters</option>
              {options.requesters.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="in-wrap">
            <span className="f-label">BP</span>
            <select aria-label="BP" className="f-input" value={bp} onChange={(event) => updateFilters(() => setBp(event.target.value))}>
              <option value="">All BP</option>
              {options.bps.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="in-wrap">
            <span className="f-label">Status</span>
            <select aria-label="Terminal status" className="f-input" value={status} onChange={(event) => updateFilters(() => setStatus(event.target.value as TerminalQueueJobState | ''))}>
              <option value="">All statuses</option>
              <option value="succeeded">Finished</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="in-wrap">
            <span className="f-label">Rows</span>
            <select aria-label="Rows per page" className="f-input" value={pageSize} onChange={(event) => updateFilters(() => setPageSize(Number(event.target.value)))}>
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </label>
          <span className="pill neutral">{projectId ?? 'default'}</span>
        </div>
      </section>

      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}

      {reportJob && <ReportModal jobId={reportJob.id} runNo={reportJob.runNo} projectId={projectId} onClose={() => setReportJob(null)} />}
      {errorsJob && <K6ErrorsModal jobId={errorsJob} projectId={projectId} onClose={() => setErrorsJob(null)} />}
      {utilJob && <UtilModal jobId={utilJob} projectId={projectId} onClose={() => setUtilJob(null)} />}
      {importOpen && (
        <ImportModal
          projectId={projectId}
          onClose={() => setImportOpen(false)}
          onImported={(fileName) => {
            setImportOpen(false);
            setNotice(`Imported ${fileName}`);
            refresh();
          }}
        />
      )}

      <section className="panel" aria-busy={loading}>
        <div className="ph">
          <span>{history ? `${history.total} results` : 'Loading'}</span>
          <span className="ph-meta">{history ? `Page ${currentPage} of ${totalPages}` : ''}</span>
        </div>
        {jobs.length > 0 ? (
          <div className="panel-body tbl-scroll">
            <table className="mock pt-history-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>BP</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>VUs/Duration</th>
                  <th>Requester</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const draft = noteDrafts[job.id] ?? job.notes;
                  const dirty = draft !== job.notes;
                  return (
                    <tr key={job.id}>
                      <td><span className="table-primary font-mono">{projectId ?? 'default'}</span></td>
                      <td><span className="pt-hist-bp">{job.bp}</span></td>
                      <td>{job.config?.env ?? '—'}</td>
                      <td>
                        <span className={`pill ${statusClass(job.state)}`} title={job.failureReason ?? undefined}>{statusLabel(job.state)}</span>
                        {/* Imported records (manually uploaded k6 reports) are
                            distinguishable from dashboard-executed runs. */}
                        {job.source === 'imported' && (
                          <span className="pill neutral pt-pill-imported" title="Imported from a manually generated k6 report">IMPORTED</span>
                        )}
                        {job.failureReason
                          && (job.state === 'failed'
                            || (job.state === 'cancelled' && job.failureReason !== 'cancelled by user'))
                          && (
                          <div className="pt-hist-reason" title={job.failureReason}>{job.failureReason}</div>
                        )}
                      </td>
                      <td className="pt-hist-start nowrap">{fmtDate(job.startedAt)}</td>
                      <td className="fs-xs text-ink-3 nowrap">{fmtDate(job.finishedAt)}</td>
                      <td className="nowrap">{fmtDuration(job.durationMs)}</td>
                      <td className="nowrap">{job.config?.vus ?? '—'} / {job.config?.duration ?? '—'}</td>
                      <td><span className="pt-hist-requester">{requesterLabel(job, sessionUser)}</span></td>
                      <td>
                        <div className="pt-note-cell">
                          <textarea
                            className="pt-note-input"
                            rows={2}
                            maxLength={1000}
                            placeholder="Add note"
                            value={draft}
                            onChange={(event) => setNoteDrafts((drafts) => ({ ...drafts, [job.id]: event.target.value }))}
                          />
                          {dirty && (
                            <button
                              className="table-action-btn"
                              type="button"
                              disabled={savingNote === job.id}
                              onClick={() => void saveNote(job.id, draft)}
                            >
                              {savingNote === job.id ? 'Saving…' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="pt-icon-actions">
                          {/* Preview report — opens the report modal (icon matches
                              pt-framework's Copy-glyph "Preview report"). */}
                          {job.artifacts.report && (
                            <button className="pt-icon-btn is-emerald" type="button" title="Preview report" aria-label="Preview report" onClick={() => setReportJob({ id: job.id, runNo: job.runNo })}>
                              <Copy aria-hidden="true" />
                            </button>
                          )}
                          {/* Review execution errors — sits between Preview and HTML
                              Report, exactly as pt-framework. Sourced from stderr. */}
                          {job.artifacts.stderr && (
                            <button className="pt-icon-btn is-red" type="button" title="Review k6 errors" aria-label="Review k6 errors" onClick={() => setErrorsJob(job.id)}>
                              <AlertTriangle aria-hidden="true" />
                            </button>
                          )}
                          {/* View HTML report — opens the standalone report in a new tab. */}
                          {job.artifacts.report && (
                            <a
                              className="pt-icon-btn is-emerald"
                              href={reportUrl(job.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View HTML Report"
                              aria-label="View HTML Report"
                            >
                              <ExternalLink aria-hidden="true" />
                            </a>
                          )}
                          {/* View utilization — opens the utilization modal. Shown
                              only when the run captured data, exactly as
                              pt-framework gates it on has_utilization. */}
                          {job.hasUtilization && (
                            <button className="pt-icon-btn is-cyan" type="button" title="View Utilization" aria-label="View Utilization" onClick={() => setUtilJob(job.id)}>
                              <Activity aria-hidden="true" />
                            </button>
                          )}
                          {/* Retry — re-enqueues the job. Imported records have
                              no runnable script, so Retry is not offered (the
                              server rejects it too). */}
                          {job.source !== 'imported' && (
                            <button
                              className="pt-icon-btn is-amber"
                              type="button"
                              title="Retry"
                              aria-label="Retry"
                              disabled={retrying.has(job.id)}
                              onClick={() => void retry(job.id)}
                            >
                              <RotateCcw aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>{loading ? 'LOADING HISTORY' : 'NO RESULTS'}</p></div>
        )}
      </section>

      <div className="flex justify-between items-center gap-s1 flex-wrap">
        <span className="table-secondary">Page {currentPage} of {totalPages}</span>
        <div className="inline-flex gap-s-1">
          <button className="pt-ghost-btn" type="button" disabled={loading || currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="pt-ghost-btn" type="button" disabled={loading || currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

// ── Action modals (parity with pt-framework's ReportModal / K6ErrorsModal /
// UtilModal). Each is opened from an icon in the Actions column, matches the
// shared shell (backdrop + card, title left, COPY + X right), and loads its
// data on open via the same endpoints the rest of the page uses. Copy always
// happens from inside the popup — never from the table.

// Small helper: copy text to the clipboard, with an execCommand fallback for
// browsers that block the async Clipboard API. Mirrors pt-framework's copy.
async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = value;
      area.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01';
      document.body.append(area);
      area.focus();
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Copy an HTML table (plus a text/plain fallback) so Excel parses it into real
// cells — each <td> its own cell, no merged or shifted columns, no blank rows.
// Mirrors pt-framework's copyHtmlToClipboard (src/lib/copyReport.ts): the async
// ClipboardItem path first, then an execCommand selection fallback that copies
// the same rendered table as rich content.
async function copyHtml(html: string, text: string): Promise<boolean> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    return true;
  } catch {
    try {
      const div = document.createElement('div');
      div.innerHTML = html;
      div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01';
      document.body.append(div);
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(div);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const ok = document.execCommand('copy');
      selection?.removeAllRanges();
      div.remove();
      return ok;
    } catch {
      return copyText(text);
    }
  }
}

interface ModalShellProps {
  title: string;
  jobId: string;
  redTitle?: boolean;
  onCopy?: () => void | Promise<void>;
  copyDisabled?: boolean;
  copied?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, jobId, redTitle, onCopy, copyDisabled, copied, onClose, children }: ModalShellProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pt-modal-overlay" role="presentation" onClick={onClose}>
      <div className="pt-modal-card" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="pt-modal-head">
          <span className={`pt-modal-title${redTitle ? ' is-red' : ''}`}>
            {title}<span className="pt-modal-id">{jobId}</span>
          </span>
          <div className="pt-modal-head-actions">
            {onCopy && (
              <button className={`pt-modal-copy${copied ? ' is-copied' : ''}`} type="button" disabled={copyDisabled} onClick={() => void onCopy()}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button className="pt-modal-close" type="button" aria-label="Close" onClick={onClose}>
              <XCircle aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pt-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Import modal — converts a manually generated k6 HTML report into a normal
// Run History record via POST /api/queue/import. The report file is read
// client-side and sent as text (the app's JSON convention); the server
// validates it is a supported k6-reporter report and stores it verbatim as the
// record's report artifact, so every existing action works on it unchanged.
interface ImportProjectOption {
  id: string;
  name: string;
}

function ImportModal({ projectId, onClose, onImported }: {
  projectId: string | null;
  onClose: () => void;
  onImported: (fileName: string) => void;
}) {
  const [projects, setProjects] = useState<ImportProjectOption[]>([]);
  const [project, setProject] = useState(projectId ?? 'default');
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Project options come from the same endpoint the sidebar picker uses; the
  // current project context is preselected.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/projects', { credentials: 'include' });
        const body = await responseJson<{ projects?: Array<{ id?: unknown; name?: unknown }> }>(response, 'Unable to load projects');
        if (cancelled) return;
        setProjects((body.projects ?? [])
          .filter((entry): entry is { id: string; name?: unknown } => typeof entry.id === 'string')
          .map((entry) => ({ id: entry.id, name: typeof entry.name === 'string' && entry.name ? entry.name : entry.id })));
      } catch {
        // The select degrades to the current project id only.
        if (!cancelled) setProjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!file) { setError('Report HTML file is required'); return; }
    const startAt = start ? new Date(start) : null;
    const endAt = end ? new Date(end) : null;
    if (!startAt || Number.isNaN(startAt.getTime()) || !endAt || Number.isNaN(endAt.getTime())) {
      setError('Start Time and End Time are required');
      return;
    }
    if (endAt.getTime() <= startAt.getTime()) { setError('End Time must be after Start Time'); return; }
    setSubmitting(true);
    try {
      const html = await file.text();
      const response = await fetch(`/api/queue/import?projectId=${encodeURIComponent(project)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          fileName: file.name,
          startedAt: startAt.toISOString(),
          finishedAt: endAt.toISOString(),
        }),
      });
      await responseJson<{ jobId?: string }>(response, 'Unable to import report');
      onImported(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to import report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="IMPORT K6 REPORT" jobId={file?.name ?? ''} onClose={onClose}>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4" onSubmit={(event) => void submit(event)}>
        <label className="block md:col-span-2">
          <span className="f-label">Project</span>
          <select className="f-input" aria-label="Project" required value={project} onChange={(event) => setProject(event.target.value)}>
            {!projects.some((option) => option.id === project) && <option value={project}>{project}</option>}
            {projects.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="f-label">Report HTML</span>
          <input
            className="f-input"
            type="file"
            accept=".html,.htm"
            aria-label="Report HTML"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block">
          <span className="f-label">Start Time</span>
          <input className="f-input" type="datetime-local" aria-label="Start time" required value={start} onChange={(event) => setStart(event.target.value)} />
        </label>
        <label className="block">
          <span className="f-label">End Time</span>
          <input className="f-input" type="datetime-local" aria-label="End time" required value={end} onChange={(event) => setEnd(event.target.value)} />
        </label>
        {error && <p className="is-full pt-import-error" role="alert">{error}</p>}
        <div className="pt-import-actions is-full">
          <button className="pt-ghost-btn" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="pt-primary-btn" type="submit" disabled={submitting}>{submitting ? 'Importing…' : 'Import'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// The 9 report-table columns, in order. Numeric columns are right-aligned.
const REPORT_COLUMNS: Array<{ label: string; render: (row: ApiMetricRow) => string; numeric: boolean }> = [
  { label: 'API', render: (r) => r.api, numeric: false },
  { label: 'Samples', render: (r) => fmtInt(r.samples), numeric: true },
  { label: 'Average (ms)', render: (r) => fmtNum(r.avgMs), numeric: true },
  { label: 'Max (ms)', render: (r) => fmtNum(r.maxMs), numeric: true },
  { label: 'Min (ms)', render: (r) => fmtNum(r.minMs), numeric: true },
  { label: 'P95 (ms)', render: (r) => fmtNum(r.p95Ms), numeric: true },
  { label: 'Error Rate (%)', render: (r) => fmtPct(r.errorRatePct), numeric: true },
  { label: 'RPS (/s)', render: (r) => fmtNum(r.rps), numeric: true },
  { label: 'Error Sample', render: (r) => fmtInt(r.errorSample), numeric: true },
];

// Build a tab-separated copy of the rendered table (incl. Run No. + headers):
// single header row, one API per row, TOTAL row aligned under the same columns
// (empty Run No. cell, 'TOTAL' in the API column). This is the text/plain
// fallback the clipboard write below carries alongside the HTML table.
export function metricsToTsv(runNo: number, metrics: ReportMetrics): string {
  const header = ['Run No.', ...REPORT_COLUMNS.map((c) => c.label)].join('\t');
  const line = (runCell: string, row: ApiMetricRow) =>
    [runCell, ...REPORT_COLUMNS.map((c) => c.render(row))].join('\t');
  const body = metrics.rows.map((row, i) => line(i === 0 ? String(runNo) : '', row));
  return [header, ...body, line('', metrics.total)].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// The same table as rich HTML so Excel parses it into real cells — the exact
// mechanism the Utilization popup's copy uses (util-summary's copy HTML +
// copyHtml). Every row carries all 10 cells: the on-screen Run No. rowspan is
// flattened to first-row-only so nothing pastes as a merged or shifted cell,
// and the TOTAL row lands aligned under the same columns. No blank rows; the
// report values are the exact strings the table renders, unchanged.
export function metricsToHtml(runNo: number, metrics: ReportMetrics): string {
  const cell = 'border:1px solid #999;padding:5px 10px;text-align:left;white-space:nowrap';
  const num = 'border:1px solid #999;padding:5px 10px;text-align:right;white-space:nowrap';
  const head = 'border:1px solid #999;padding:6px 10px;text-align:center;font-weight:bold';
  const headerRow = `<tr>${['Run No.', ...REPORT_COLUMNS.map((c) => c.label)]
    .map((label) => `<th style="${head}">${escapeHtml(label)}</th>`)
    .join('')}</tr>`;
  const row = (runCell: string, r: ApiMetricRow) =>
    `<tr><td style="${cell}">${escapeHtml(runCell)}</td>`
    + REPORT_COLUMNS.map((c) => `<td style="${c.numeric ? num : cell}">${escapeHtml(c.render(r))}</td>`).join('')
    + '</tr>';
  const body = metrics.rows.map((r, i) => row(i === 0 ? String(runNo) : '', r)).join('');
  return `<table style="border-collapse:collapse;font-family:monospace;font-size:13px">`
    + `<thead>${headerRow}</thead>`
    + `<tbody>${body}${row('', metrics.total)}</tbody></table>`;
}

// Report preview — parses the run's k6 "Detail" HTML report (fetched from the
// /report endpoint) into a per-API metrics table plus an aggregated TOTAL row,
// exactly as the report already computed them (nothing is recomputed). Run No.
// shows once for the execution. COPY writes the table as HTML + TSV (same
// clipboard mechanism as the Utilization popup) so Excel pastes it as a clean
// table, every value in its own cell. No parseable metrics → "No report data
// for this job."
function ReportModal({ jobId, runNo, projectId, onClose }: { jobId: string; runNo: number; projectId: string | null; onClose: () => void }) {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [copied, setCopied] = useState(false);
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/report${query}`, { credentials: 'include' });
        const body = response.ok ? await response.text() : null;
        if (cancelled) return;
        const parsed = body && body.trim() ? parseDetailReport(body) : null;
        if (parsed) { setMetrics(parsed); setStatus('ready'); }
        else { setMetrics(null); setStatus('empty'); }
      } catch {
        if (!cancelled) { setMetrics(null); setStatus('empty'); }
      }
    })();
    return () => { cancelled = true; };
  }, [jobId, query]);

  const copy = useCallback(async () => {
    if (!metrics) return;
    if (await copyHtml(metricsToHtml(runNo, metrics), metricsToTsv(runNo, metrics))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [metrics, runNo]);

  return (
    <ModalShell title="Report Preview" jobId={jobId} onCopy={copy} copyDisabled={!metrics} copied={copied} onClose={onClose}>
      {status === 'loading'
        ? <p className="pt-modal-empty">Loading…</p>
        : status === 'ready' && metrics
          ? <div className="pt-report-scroll">
              <table className="pt-report-table">
                <thead>
                  <tr>
                    <th className="pt-report-runno">Run No.</th>
                    {REPORT_COLUMNS.map((col) => (
                      <th key={col.label} className={col.numeric ? 'pt-report-num' : ''}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.rows.map((row, index) => (
                    <tr key={row.api}>
                      {index === 0 && (
                        <td className="pt-report-runno" rowSpan={metrics.rows.length}>{runNo}</td>
                      )}
                      {REPORT_COLUMNS.map((col) => (
                        <td key={col.label} className={col.numeric ? 'pt-report-num' : 'pt-report-api'}>{col.render(row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="pt-report-total">
                    <td className="pt-report-runno" />
                    <td className="pt-report-api">TOTAL</td>
                    {REPORT_COLUMNS.slice(1).map((col) => (
                      <td key={col.label} className="pt-report-num">{col.render(metrics.total)}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          : <p className="pt-modal-empty">No report data for this job.</p>}
    </ModalShell>
  );
}

// Execution errors — the run's failed-request lines, extracted from the
// captured run output. The failures live in the STDOUT artifact: for ONPREM the
// runner combines the remote streams into stdout (stderr is stored empty), and
// the k6 scripts console.error one line per failed request — the same requests
// counted by error_count_<api> (Report Preview's "Error Sample"). So this now
// matches Report Preview: any API with Error Sample > 0 shows its lines here.
// stderr is the fallback for LOCAL runs, whose error stream is captured
// separately. Mirrors pt-framework parsing the combined run log for errors.
// COPY copies the text. Empty → "No errors detected."
function K6ErrorsModal({ jobId, projectId, onClose }: { jobId: string; projectId: string | null; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const fetchArtifact = async (kind: 'stdout' | 'stderr'): Promise<string> => {
      try {
        const response = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/artifact/${kind}${query}`, { credentials: 'include' });
        return response.ok ? await response.text() : '';
      } catch {
        return '';
      }
    };
    void (async () => {
      // Prefer the combined stdout (ONPREM + where the failure lines are); fall
      // back to stderr for LOCAL runs that stream errors separately.
      let errors = extractExecutionErrors(await fetchArtifact('stdout'));
      if (!errors) errors = extractExecutionErrors(await fetchArtifact('stderr'));
      if (!cancelled) { setText(errors); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [jobId, projectId]);

  const value = text ?? '';
  const copy = useCallback(async () => {
    if (!value) return;
    if (await copyText(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [value]);

  return (
    <ModalShell title="Execution Errors" jobId={jobId} redTitle onCopy={copy} copyDisabled={!value || loading} copied={copied} onClose={onClose}>
      {loading
        ? <p className="pt-modal-empty">Loading…</p>
        : value.trim()
          ? <pre className="pt-modal-pre is-red">{value}</pre>
          : <p className="pt-modal-empty">No errors detected.</p>}
    </ModalShell>
  );
}

const NODE_COLUMNS = ['Instance', 'Hostname', 'Avg CPU%', 'Max CPU%', 'Avg Mem%', 'Max Mem%', 'Avg Disk%', 'Max Disk%'];
const POD_COLUMNS = ['Pod', 'Node', 'Count', 'Avg CPU (m)', 'Max CPU (m)', 'Avg Mem (MB)', 'Max Mem (MB)'];

// pt-framework's load coloring: averages above 80% are critical, above 60%
// warn, otherwise good. Applied to the Avg CPU%/Avg Mem% node cells only.
function loadClass(value: number): string {
  return value > 80 ? 'pt-util-load-crit' : value > 60 ? 'pt-util-load-warn' : 'pt-util-load-good';
}

function fmtFixed(value: number | null | undefined, digits: number): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
}

// Utilization — parity for pt-framework's UtilModal: the node and grouped-pod
// utilization captured at run completion, read back from the job's result
// artifact (where the worker folded it, as pt-framework folds
// _webui_utilization into summary_json). Missing or empty data shows
// pt-framework's empty state. COPY copies the highest-average summary rows
// (values only, no color markup).
function UtilModal({ jobId, projectId, onClose }: { jobId: string; projectId: string | null; onClose: () => void }) {
  const [util, setUtil] = useState<RunUtilization | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    void (async () => {
      try {
        const response = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/artifact/result${query}`, { credentials: 'include' });
        const body = response.ok ? await response.json() as { utilization?: RunUtilization | null } : null;
        if (!cancelled) setUtil(body?.utilization ?? null);
      } catch {
        if (!cancelled) setUtil(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId, projectId]);

  const nodes = util?.nodes ?? [];
  const pods = util?.pods ?? [];
  const empty = nodes.length === 0 && pods.length === 0;

  // The single highest average CPU and memory across every displayed entry,
  // recomputed from the loaded data — nothing is hardcoded.
  const summary = useMemo(
    () => highestAverages(util?.nodes ?? [], util?.pods ?? []),
    [util],
  );

  const copy = useCallback(async () => {
    if (!summary.length) return;
    // Copy as an HTML table so Excel places each value in its own cell; the
    // text/plain fallback carries the same rows tab-separated.
    if (await copyHtml(highestAveragesCopyHtml(summary), highestAveragesCopyText(summary))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [summary]);

  return (
    <ModalShell title="Utilization" jobId={jobId} onCopy={copy} copyDisabled={loading || !summary.length} copied={copied} onClose={onClose}>
      {loading
        ? <p className="pt-modal-empty">Loading…</p>
        : empty
          ? <p className="pt-modal-empty">No utilization data for this job.</p>
          : (
            <div className="pt-util-body">
              {summary.length > 0 && (
                <div>
                  <div className="pt-report-scroll">
                    <table className="pt-report-table">
                      <thead>
                        <tr><th colSpan={4}>HIGHEST AVERAGE UTILIZATION</th></tr>
                      </thead>
                      <tbody>
                        {summary.map((row) => (
                          <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>{row.service}</td>
                            <td>{row.name}</td>
                            <td className={`pt-report-num${row.exceeded ? ' pt-util-load-crit' : ''}`}>
                              {row.value.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {nodes.length > 0 && (
                <div>
                  <p className="pt-util-title">Surrounding Resource Utilization — Nodes</p>
                  <div className="pt-report-scroll">
                    <table className="pt-report-table">
                      <thead>
                        <tr>{NODE_COLUMNS.map((col) => <th key={col}>{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {nodes.map((node, index) => (
                          <tr key={`${node.instance}-${index}`}>
                            <td>{node.instance}</td>
                            <td>{node.hostname ?? '—'}</td>
                            <td className={`pt-report-num ${loadClass(node.avg_cpu)}`}>{fmtFixed(node.avg_cpu, 2)}%</td>
                            <td className="pt-report-num">{fmtFixed(node.max_cpu, 2)}%</td>
                            <td className={`pt-report-num ${loadClass(node.avg_memory)}`}>{fmtFixed(node.avg_memory, 2)}%</td>
                            <td className="pt-report-num">{fmtFixed(node.max_memory, 2)}%</td>
                            <td className="pt-report-num">{node.avg_disk != null ? `${fmtFixed(node.avg_disk, 2)}%` : '—'}</td>
                            <td className="pt-report-num">{node.max_disk != null ? `${fmtFixed(node.max_disk, 2)}%` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {pods.length > 0 && (
                <div>
                  <p className="pt-util-title">Container Utilization</p>
                  <div className="pt-report-scroll">
                    <table className="pt-report-table">
                      <thead>
                        <tr>{POD_COLUMNS.map((col) => <th key={col}>{col}</th>)}</tr>
                      </thead>
                      <tbody>
                        {pods.map((pod, index) => (
                          <tr key={`${pod.pod}-${index}`}>
                            <td>{pod.pod}</td>
                            <td>{pod.node ?? '—'}</td>
                            <td className="pt-report-num">{pod.pod_count ?? '—'}</td>
                            <td className="pt-report-num">{fmtFixed(pod.avg_cpu_millicores, 1)}</td>
                            <td className="pt-report-num">{fmtFixed(pod.max_cpu_millicores, 1)}</td>
                            <td className="pt-report-num">{fmtFixed(pod.avg_memory_mb, 1)}</td>
                            <td className="pt-report-num">{fmtFixed(pod.max_memory_mb, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {util?.fetchedAt && (
                <p className="pt-util-fetched">Fetched at: {new Date(util.fetchedAt).toLocaleString('id-ID')}</p>
              )}
            </div>
          )}
    </ModalShell>
  );
}
