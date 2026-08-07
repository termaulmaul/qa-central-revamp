"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { getProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';
import { sseUrl } from '../utils/sse-base';
import { computeRunTiming, parseDurationMs, parseK6Progress, type K6Progress } from '../utils/run-timing';

type QueueJobState = 'queued' | 'claimed' | 'running' | 'succeeded' | 'failed' | 'cancelled';

interface QueueJob {
  id: string;
  state: QueueJobState;
  script: string | null;
  target: string | null;
  config: {
    env: string;
    platform: string;
    vus: number;
    duration: string;
    scenario?: string;
  } | null;
  createdAt: string;
  startedAt: string | null;
  testStartedAt: string | null;
}

interface QueueSnapshot {
  state: 'idle' | 'running' | 'cooldown';
  current: QueueJob | null;
  queue: QueueJob[];
  counts: { waiting: number; running: number };
  cooldownUntil: string | null;
}

type ConnectionState = 'connecting' | 'live' | 'offline';

function query(projectId: string | null): string {
  return projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
}

function timestamp(value: string | null): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
}

function jobTitle(job: QueueJob): string {
  return job.script ?? 'Unavailable script';
}

function jobDetail(job: QueueJob): string {
  if (!job.config) return job.target ?? 'Unavailable configuration';
  // Append the executed BP scenario(s) from the persisted runtime config
  // (config.scenario) — a single BP (e.g. BP001), multiple BPs in execution
  // order (e.g. BP001,BP002), or 'All'. scenarioLabel reads the actual stored
  // value, not current UI state, and matches the Running/Run History views.
  return `${job.target ?? 'Unknown target'} · ${job.config.env} · ${job.config.platform} · ${job.config.vus} VUs · ${job.config.duration} · ${scenarioLabel(job)}`;
}

// --- Running-job helpers (ported from pt-framework) ---

function fmtMs(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h${m}m${String(s).padStart(2, '0')}s` : `${m}m${String(s).padStart(2, '0')}s`;
}

// Inter-run delay countdown in MM:SS (mirrors pt-framework's fmtCountdown).
function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function estFinish(job: QueueJob): string {
  const durationMs = parseDurationMs(job.config?.duration);
  // The test finishes DURATION after it actually starts (setup excluded); until
  // the test starts, estimate from the execution start so a value still shows.
  const anchor = job.testStartedAt ?? job.startedAt;
  if (!anchor || !durationMs) return '—';
  return timestamp(new Date(Date.parse(anchor) + durationMs).toISOString());
}

function scenarioLabel(job: QueueJob): string {
  const s = String(job.config?.scenario ?? '').trim();
  if (s && s.toLowerCase() !== 'all') return s;
  const bp = job.script?.match(/(?:^|[/_-])(BP\d+)/i)?.[1]?.toUpperCase();
  return bp || 'All';
}

interface LiveLogResponse {
  text: string;
  offset: number;
  done: boolean;
  waiting: boolean;
}

// Live Log popup — tails the running job's execution log from the VM in real
// time (mirrors pt-framework's LogModal): polls /live-log every 1.5s, appends
// only the new bytes (via the byte offset), auto-scrolls unless the user
// scrolled up, and shows a LIVE / waiting / disconnected status. Streaming stops
// automatically when the job finishes (done) or the popup closes. A failed poll
// keeps the output already received and flags the connection, so an SSH/network
// blip never loses log lines.
function LiveLogModal({ jobId, projectId, isRunning, onClose }: {
  jobId: string;
  projectId: string | null;
  isRunning: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'connecting' | 'live' | 'waiting' | 'done' | 'offline'>('connecting');
  const offset = useRef(0);
  const bodyRef = useRef<HTMLPreElement | null>(null);
  const atBottom = useRef(true);
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}&` : '?';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/live-log${query}offset=${offset.current}`, { credentials: 'include' });
        if (stopped) return;
        if (!res.ok) { setStatus('offline'); return; } // keep prior text; retry next tick
        const body = await res.json() as LiveLogResponse;
        if (stopped) return;
        if (body.text) { setText((current) => current + body.text); offset.current = body.offset; }
        setStatus(body.done ? 'done' : body.waiting ? 'waiting' : 'live');
      } catch {
        if (!stopped) setStatus('offline'); // network/SSH blip — output preserved
      }
    };

    // Poll immediately, then every 1.5s while running (one final poll when not).
    void poll();
    if (isRunning) {
      const tick = () => { void poll().finally(() => { if (!stopped) timer = setTimeout(tick, 1500); }); };
      timer = setTimeout(tick, 1500);
    }
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [jobId, query, isRunning]);

  // Auto-scroll to the newest line unless the user scrolled up to read history.
  useEffect(() => {
    const el = bodyRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [text]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const statusLabel = status === 'live' ? 'LIVE'
    : status === 'waiting' ? 'WAITING FOR LOG…'
    : status === 'done' ? 'FINISHED'
    : status === 'offline' ? 'RECONNECTING…'
    : 'CONNECTING…';

  return (
    <div className="pt-modal-overlay" role="presentation" onClick={onClose}>
      <div className="pt-modal-card" role="dialog" aria-modal="true" aria-label="Live execution log" onClick={(e) => e.stopPropagation()}>
        <div className="pt-modal-head">
          <span className="pt-modal-title">
            Live Log<span className="pt-modal-id">{jobId}</span>
          </span>
          <div className="pt-modal-head-actions">
            <span className={`pt-livelog-status is-${status}`}>
              {status === 'live' && <i className="status-dot pt-pulse" />} {statusLabel}
            </span>
            <button className="pt-modal-close" type="button" aria-label="Close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="pt-modal-body">
          <pre className="pt-log-view" ref={bodyRef} onScroll={onScroll}>
            {text || (status === 'waiting' || status === 'connecting' ? 'Waiting for process output…' : '')}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Live time-based progress. ELAPSED is wall-clock from the job's start (setup
// included), while REMAINING and the percentage are driven solely by the
// configured DURATION and only begin once the actual test starts (testStartedAt,
// set by the worker after the setup phase) — so during setup they read the full
// duration and 0%. Iterations/RPS require live k6 logs, which this queue does not
// stream, so they are shown as unavailable.
function RunProgress({ job }: { job: QueueJob }) {
  const [now, setNow] = useState(() => Date.now());
  // k6's own progress, parsed from the live log. Percent/remaining follow this
  // (0% while still in k6 setup) rather than wall-clock, so a slow setup phase
  // no longer makes a running job look finished.
  const k6 = useK6LiveProgress(job.id);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { hasStarted, hasTestStarted, elapsedMs, remainingMs, percent, durationMs, iters, rps } =
    computeRunTiming(job.config?.duration, job.startedAt, now, k6);
  const phaseNote = hasStarted && !hasTestStarted ? ' (setup)' : '';
  const vusRps = rps > 0 ? `${job.config?.vus ?? '—'} / ${rps.toFixed(1)}` : (job.config?.vus ?? '—');

  return (
    <div className="pt-run-progress">
      <div className="pt-run-progress-head">
        <span className="pt-run-progress-title">Live Progress</span>
        <span className="pt-run-running"><i className="status-dot pt-pulse" /> RUNNING{phaseNote}</span>
      </div>
      <div className="pt-progress-track"><span style={{ width: `${percent}%` }} /></div>
      <div className="pt-run-kpis">
        <div><span className="pt-kpi-label">Elapsed</span><span className="pt-kpi-value">{hasStarted ? fmtMs(elapsedMs) : '—'}</span></div>
        <div><span className="pt-kpi-label">Remaining</span><span className={`pt-kpi-value${remainingMs > 0 && remainingMs < 30_000 && hasTestStarted ? ' warn' : ''}`}>{durationMs > 0 ? fmtMs(remainingMs) : '—'}</span></div>
        <div><span className="pt-kpi-label">Iterations</span><span className="pt-kpi-value">{iters > 0 ? iters.toLocaleString() : '—'}</span></div>
        <div><span className="pt-kpi-label">VUs / RPS</span><span className="pt-kpi-value">{vusRps}</span></div>
      </div>
      <div className="pt-run-percent">{Math.round(percent)}% of {durationMs > 0 ? fmtMs(durationMs) : (job.config?.duration ?? '—')}</div>
    </div>
  );
}

// Poll the running job's live log and parse k6's own progress from it (every
// 1.5s, matching pt-framework). Uses byte offsets to append only new content.
function useK6LiveProgress(jobId: string): K6Progress | null {
  const [progress, setProgress] = useState<K6Progress | null>(null);
  const text = useRef('');
  const offset = useRef(0);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    text.current = '';
    offset.current = 0;
    const projectId = getProjectId();
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}&` : '?';

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/live-log${q}offset=${offset.current}`, { credentials: 'include' });
        if (stopped || !res.ok) return; // keep prior parse on transient failure
        const body = await res.json() as { text: string; offset: number };
        if (stopped) return;
        if (body.text) {
          text.current += body.text;
          offset.current = body.offset;
          setProgress(parseK6Progress(text.current));
        }
      } catch {
        /* network blip — retry next tick, keep current progress */
      }
    };
    void poll();
    const tick = () => { void poll().finally(() => { if (!stopped) timer = setTimeout(tick, 1500); }); };
    timer = setTimeout(tick, 1500);
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [jobId]);

  return progress;
}

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  throw new Error(typeof body?.error === 'string' ? body.error : 'Unable to load queue');
}

export const PerformanceQueue = () => {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [cancelling, setCancelling] = useState<Set<string>>(() => new Set());
  // The running job whose Live Log popup is open (bound to its id), or null.
  const [logJob, setLogJob] = useState<{ id: string; projectId: string | null } | null>(null);
  // 1s tick so the cooldown countdown updates in real time between SSE pushes.
  const [now, setNow] = useState(() => Date.now());
  const requestId = useRef(0);
  const events = useRef<EventSource | null>(null);
  // Timestamp of the last snapshot received on the stream. A silently-stalled
  // ("zombie") SSE connection — e.g. dropped by a proxy during a long run —
  // stays readyState OPEN so native EventSource reconnect never fires and the
  // UI keeps showing a finished job as Running. The watchdog below reconnects
  // when no snapshot has arrived for well over the server's 10s push interval.
  const lastSnapshotAt = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const closeEvents = useCallback(() => {
    events.current?.close();
    events.current = null;
  }, []);

  const invalidateRequests = useCallback(() => {
    ++requestId.current;
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const projectId = getProjectId();
    const suffix = query(projectId);
    closeEvents();
    setLoading(true);
    setError('');
    setConnection('connecting');

    try {
      const next = await fetch(`/api/queue${suffix}`, { credentials: 'include' }).then(responseJson<QueueSnapshot>);
      if (id !== requestId.current) return;
      setSnapshot(next);
      lastSnapshotAt.current = Date.now();
      const source = new EventSource(sseUrl(`/api/queue/events${suffix}`), { withCredentials: true });
      events.current = source;
      source.onopen = () => {
        if (id === requestId.current) setConnection('live');
      };
      source.onmessage = () => undefined;
      source.addEventListener('snapshot', (event) => {
        if (id !== requestId.current) return;
        lastSnapshotAt.current = Date.now();
        try {
          setSnapshot(JSON.parse((event as MessageEvent<string>).data) as QueueSnapshot);
          setError('');
        } catch {
          setConnection('offline');
        }
      });
      source.onerror = () => {
        if (id === requestId.current) setConnection('offline');
      };
    } catch (cause) {
      if (id !== requestId.current) return;
      setSnapshot(null);
      setConnection('offline');
      setError(cause instanceof Error ? cause.message : 'Unable to load queue');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [closeEvents]);

  useEffect(() => {
    void load();
    window.addEventListener(PROJECT_CONTEXT_EVENT, load);
    return () => {
      window.removeEventListener(PROJECT_CONTEXT_EVENT, load);
      invalidateRequests();
      closeEvents();
    };
  }, [closeEvents, invalidateRequests, load]);

  // Watchdog: the server pushes a snapshot at least every 10s, so if none has
  // arrived for ~25s the stream is dead (a zombie SSE that never errored) —
  // reconnect to re-sync. This is what makes a finished job leave Running
  // without a manual page refresh even when the stream silently stalled.
  useEffect(() => {
    const STALE_MS = 25_000;
    const id = window.setInterval(() => {
      if (Date.now() - lastSnapshotAt.current > STALE_MS) {
        lastSnapshotAt.current = Date.now(); // avoid stacking reconnects
        void load();
      }
    }, 5_000);
    return () => window.clearInterval(id);
  }, [load]);

  const cancel = useCallback(async (jobId: string) => {
    const projectId = getProjectId();
    setCancelling((pending) => new Set(pending).add(jobId));
    setError('');
    try {
      await fetch(`/api/queue/job/${encodeURIComponent(jobId)}/cancel${query(projectId)}`, {
        method: 'POST',
        credentials: 'include',
      }).then(responseJson<{ status: string }>);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to cancel queue job');
    } finally {
      setCancelling((pending) => {
        const next = new Set(pending);
        next.delete(jobId);
        return next;
      });
    }
  }, [load]);

  const current = snapshot?.current ?? null;
  const queued = snapshot?.queue ?? [];
  const connectionLabel = connection === 'live' ? 'LIVE' : connection === 'connecting' ? 'CONNECTING' : 'RECONNECTING';

  // Live cooldown countdown: remaining ms until the next job may start. The
  // server reports state 'cooldown' with a cooldownUntil target; count down to
  // it locally so users see why the queue is waiting (not stalled).
  const cooldownUntilMs = snapshot?.cooldownUntil ? Date.parse(snapshot.cooldownUntil) : Number.NaN;
  const cooldownRemainingMs = Number.isFinite(cooldownUntilMs) ? Math.max(0, cooldownUntilMs - now) : 0;
  const coolingDown = snapshot?.state === 'cooldown' && cooldownRemainingMs > 0;
  const schedulerState = coolingDown ? 'cooldown' : (snapshot?.state === 'running' ? 'running' : 'idle');
  // Human label for the status pill: name the delay so it reads as an
  // intentional Inter-run Delay, not a stuck or still-running scheduler.
  const schedulerStateLabel = schedulerState === 'cooldown' ? 'INTER-RUN DELAY' : schedulerState.toUpperCase();

  // When the countdown hits zero, refetch so the job transitions to Running.
  useEffect(() => {
    if (snapshot?.state === 'cooldown' && cooldownRemainingMs === 0) void load();
  }, [snapshot?.state, cooldownRemainingMs, load]);

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title">Performance Queue</h1>
          <p className="page-subtitle">Persisted FIFO K6 jobs for the selected project.</p>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      <section className="panel" aria-busy={loading}>
        <div className="ph">
          <span>Scheduler Status</span>
          <span className="status-inline"><i className={`status-dot${schedulerState !== 'idle' ? ' pt-pulse' : ''}`} /> {schedulerStateLabel} · {connectionLabel}</span>
        </div>
        <div className="panel-body status-summary">
          WAITING <strong>{snapshot?.counts.waiting ?? 0}</strong> · RUNNING <strong>{snapshot?.counts.running ?? 0}</strong>
          {coolingDown && (
            <span className="pt-cooldown">
              · <i className="status-dot pt-pulse" /> INTER-RUN DELAY — next run in <strong>{fmtCountdown(cooldownRemainingMs)}</strong>
            </span>
          )}
        </div>
        {coolingDown && (
          <div className="panel-body pt-cooldown-note">
            Waiting for the scheduled execution delay — the next job starts automatically when the countdown ends.
          </div>
        )}
      </section>

      {current && (
        <section className="panel pt-running-card">
          <div className="ph">
            <span className="pt-run-title"><i className="status-dot pt-pulse" /> RUNNING <span className="pt-scenario-badge">{scenarioLabel(current)}</span></span>
            <div className="inline-flex gap-s-1">
              <button
                className="pt-ghost-btn"
                type="button"
                onClick={() => setLogJob({ id: current.id, projectId: getProjectId() })}
              >
                Live Log
              </button>
              <button
                className="pt-ghost-btn"
                type="button"
                disabled={cancelling.has(current.id)}
                onClick={() => void cancel(current.id)}
              >
                {cancelling.has(current.id) ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          </div>
          <div className="panel-body pt-page-stack">
            <div className="pt-run-grid">
              {([
                ['Project', getProjectId() ?? 'default'],
                ['Script', jobTitle(current)],
                ['Target', current.target ?? '—'],
                ['Environment', current.config?.env ?? '—'],
                ['Platform', current.config?.platform ?? '—'],
                ['VUs', current.config?.vus ?? '—'],
                ['Duration', current.config?.duration ?? '—'],
                ['Scenario', scenarioLabel(current)],
                ['Start', timestamp(current.startedAt)],
                ['Est. Finish', estFinish(current)],
              ] as const).map(([label, value]) => (
                <div key={label} className="pt-run-cell">
                  <span className="pt-run-cell-label">{label}</span>
                  <span className="pt-run-cell-value" title={String(value)}>{String(value)}</span>
                </div>
              ))}
            </div>
            <RunProgress job={current} />
          </div>
        </section>
      )}

      {logJob && (
        <LiveLogModal
          jobId={logJob.id}
          projectId={logJob.projectId}
          isRunning={current?.id === logJob.id}
          onClose={() => setLogJob(null)}
        />
      )}

      <section className="panel">
        <div className="ph">Waiting Jobs <span className="ph-meta">OLDEST FIRST</span></div>
        {queued.length > 0 ? (
          <div className="panel-body tbl-scroll">
            <table className="mock">
              <thead>
                <tr>
                  <th>Script</th>
                  <th>Configuration</th>
                  <th className="text-right">Queued</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {queued.map((job) => (
                  <tr key={job.id}>
                    <td><span className="table-primary font-mono">{jobTitle(job)}</span></td>
                    <td><span className="table-secondary">{jobDetail(job)}</span></td>
                    <td className="text-right fs-xs text-ink-3 nowrap">{timestamp(job.createdAt)}</td>
                    <td className="text-right">
                      <button
                        className="pt-ghost-btn"
                        type="button"
                        disabled={cancelling.has(job.id)}
                        onClick={() => void cancel(job.id)}
                      >
                        {cancelling.has(job.id) ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>{loading ? 'LOADING QUEUE' : 'NO JOBS WAITING'}</p>
          </div>
        )}
      </section>
    </div>
  );
};
