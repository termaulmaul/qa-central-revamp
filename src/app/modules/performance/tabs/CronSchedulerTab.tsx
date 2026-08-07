"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Clock, Pencil, Plus, Power, RefreshCw, Trash2, X } from 'lucide-react';
import { getProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';
import { EXEC_TYPES, availableEnvModes, bpTokensOf, type RepositoryListing } from '../components/Content';
import { CustomVarsEditor, type CustomVar } from '../components/CustomVarsEditor';

// Cron Scheduler over the ONPREM runner's crontab (10.184.120.48) — the
// single source of truth. Every list/read is live from the VM; create, edit,
// enable/disable, and delete post exact-line changes and re-render the fresh
// VM state the server returns. Nothing is stored locally.

interface CronEntry {
  raw: string;
  enabled: boolean;
  schedule: string;
  command: string;
  isPT: boolean;
  lastRun?: string | null;
}

// Runtime env keys the pipeline itself sets — anything else parsed from the
// command line is a user custom variable.
const KNOWN_ENV_KEYS = new Set(['USER', 'K6_USERS', 'DURATION', 'ENV', 'ACC', 'RUNBY', 'PLATFORM', 'SCENARIO', 'NUMSTART', 'TEST_PASSWORD', 'TEST_PIN']);

interface ParsedSchedule {
  name: string;
  project: string;
  execType: string;
  repository: string;
  script: string;
  platform: string;
  scenarios: string[];
  env: string;
  acc: string;
  vus: string;
  duration: string;
  numStart: string;
  customVars: CustomVar[];
  logPath: string | null;
}

// Reverse of buildCommand: recover the schedule's fields from the cron line so
// the table and the edit form always reflect exactly what the VM will run.
function parseCommand(command: string): ParsedSchedule {
  const out: ParsedSchedule = {
    name: '', project: '', execType: 'MANUAL', repository: '', script: '',
    platform: '', scenarios: [], env: '', acc: '', vus: '', duration: '',
    numStart: '', customVars: [], logPath: null,
  };
  const marker = command.match(/#\s*PT\s+(\{.*\})\s*$/);
  if (marker) {
    try {
      const meta = JSON.parse(marker[1]) as { name?: unknown; project?: unknown; exec?: unknown };
      if (typeof meta.name === 'string') out.name = meta.name;
      if (typeof meta.project === 'string') out.project = meta.project;
      if (typeof meta.exec === 'string') out.execType = meta.exec;
    } catch { /* not our marker */ }
  }
  const script = command.match(/Script\/([^\s'"<>|;&]+?\.(?:sh|js))/)?.[1]
    ?? command.match(/run\s+([^\s'"<>|;&]+?\.(?:sh|js))/)?.[1] ?? '';
  if (script) {
    // Either 'Suite/Platform/file.js' (full) or 'Platform/file.js' after a
    // cd into Script/<suite> — recover the suite from the cd in that case.
    const cdSuite = command.match(/Script\/([A-Za-z0-9._-]+)\s*&&/)?.[1] ?? '';
    const parts = script.split('/');
    if (parts.length >= 3) {
      out.repository = parts[0];
      out.script = script;
    } else {
      out.repository = cdSuite || parts[0];
      out.script = cdSuite ? `${cdSuite}/${script}` : script;
    }
  }
  // -e KEY=VAL (k6) or bare KEY=VAL prefixes (sh); values optionally 'quoted'.
  const envRe = /(?:-e\s+)?([A-Za-z_][A-Za-z0-9_]*)=('(?:[^']|'\\''|'"'"')*'|[^\s]+)/g;
  for (const m of command.matchAll(envRe)) {
    const key = m[1];
    let value = m[2];
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    switch (key) {
      case 'ENV': out.env = value; break;
      case 'ACC': out.acc = value; break;
      case 'USER': case 'K6_USERS': out.vus = value; break;
      case 'DURATION': out.duration = value; break;
      case 'PLATFORM': out.platform = value; break;
      case 'NUMSTART': out.numStart = value; break;
      case 'SCENARIO': out.scenarios = value ? value.split(',').filter(Boolean) : []; break;
      case 'RUNBY': if (!marker) out.execType = value.toUpperCase(); break;
      default:
        if (!KNOWN_ENV_KEYS.has(key) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
          && command.includes(`-e ${key}=`)) {
          out.customVars.push({ key, value });
        }
    }
  }
  out.logPath = command.match(/>>\s*(\/var\/log\/[A-Za-z0-9._-]+\.log)/)?.[1] ?? null;
  if (!out.name) out.name = out.script.split('/').pop()?.replace(/\.(js|sh)$/i, '') ?? command.slice(0, 32);
  return out;
}

// ── next-run computation for a 5-field cron expression (UTC of the VM is
// assumed local for display purposes; best-effort like pt-framework's hint) ──
function fieldMatches(expr: string, value: number, min: number): boolean {
  for (const part of expr.split(',')) {
    const step = part.match(/^(.+)\/(\d+)$/);
    const body = step ? step[1] : part;
    const every = step ? Number(step[2]) : 1;
    let lo = min;
    let hi = Infinity;
    if (body === '*') { hi = 9999; } else {
      const range = body.match(/^(\d+)-(\d+)$/);
      if (range) { lo = Number(range[1]); hi = Number(range[2]); }
      else if (/^\d+$/.test(body)) { lo = Number(body); hi = Number(body); }
      else return false;
    }
    if (value >= lo && value <= hi && (value - lo) % every === 0) return true;
  }
  return false;
}

function nextRun(schedule: string, from = new Date()): Date | null {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hr, dom, mon, dow] = parts;
  const t = new Date(from.getTime());
  t.setSeconds(0, 0);
  t.setMinutes(t.getMinutes() + 1);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    const domOk = fieldMatches(dom, t.getDate(), 1);
    const dowOk = fieldMatches(dow, t.getDay(), 0);
    // POSIX cron: dom/dow OR each other when both are restricted.
    const dayOk = dom !== '*' && dow !== '*' ? (domOk || dowOk) : (domOk && dowOk);
    if (fieldMatches(min, t.getMinutes(), 0) && fieldMatches(hr, t.getHours(), 0)
      && dayOk && fieldMatches(mon, t.getMonth() + 1, 1)) return t;
    t.setMinutes(t.getMinutes() + 1);
  }
  return null;
}

const fmt = (value: string | Date | null | undefined) => {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

interface ModalProps { title: string; onClose: () => void; children: ReactNode }
const CronModal = ({ title, onClose, children }: ModalProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <div className="pt-modal-overlay" role="presentation" onClick={onClose}>
      <section className="panel pt-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="ph"><span>{title}</span>
          <button type="button" className="pt-ghost-btn icon-btn" aria-label={`Close ${title}`} onClick={onClose}><X size={14} /></button>
        </div>
        {children}
      </section>
    </div>
  );
};

interface FormState {
  name: string;
  cron: string;
  enabled: boolean;
  project: string;
  repository: string;
  script: string;
  platform: string;
  scenarios: string[];
  env: string;
  acc: string;
  execType: string;
  vus: number;
  duration: string;
  numStart: number;
  customVars: CustomVar[];
}

const EMPTY_FORM: FormState = {
  name: '', cron: '0 0 * * *', enabled: true, project: '', repository: '',
  script: '', platform: '', scenarios: [], env: 'INT', acc: '', execType: 'MANUAL',
  vus: 335, duration: '5m', numStart: 1, customVars: [],
};

export const CronScheduler = () => {
  const [entries, setEntries] = useState<CronEntry[]>([]);
  const [repoBase, setRepoBase] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CronEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const requestId = useRef(0);

  // Execute Test's option sources for the form (same /api/scripts/listing).
  const [listing, setListing] = useState<RepositoryListing[]>([]);
  const [envModes, setEnvModes] = useState<string[]>([]);
  const listingRequestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/remote-cron', { credentials: 'include' });
      const body = await response.json().catch(() => null) as { entries?: CronEntry[]; repoBase?: string; error?: string } | null;
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error(body?.error ?? 'Unable to read the scheduler');
      setEntries(Array.isArray(body?.entries) ? body.entries : []);
      if (typeof body?.repoBase === 'string') setRepoBase(body.repoBase);
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : 'Unable to read the scheduler');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadListing = useCallback(async (project: string) => {
    const id = ++listingRequestId.current;
    try {
      const response = await fetch(`/api/scripts/listing?projectId=${encodeURIComponent(project || 'default')}`, { credentials: 'include' });
      if (!response.ok) return;
      const body = await response.json() as { repositories?: unknown; envModes?: unknown };
      if (id !== listingRequestId.current) return;
      setEnvModes(Array.isArray(body.envModes) ? body.envModes.filter((v): v is string => typeof v === 'string') : []);
      setListing(Array.isArray(body.repositories)
        ? body.repositories.filter((v): v is RepositoryListing => typeof (v as { name?: unknown } | null)?.name === 'string')
        : []);
    } catch { /* keep previous */ }
  }, []);

  useEffect(() => {
    if (creating || editing) void loadListing(form.project);
  }, [creating, editing, form.project, loadListing]);

  const parsed = useMemo(() => entries.map((entry) => ({ entry, fields: parseCommand(entry.command) })), [entries]);

  const activeRepository = listing.find((repo) => repo.name === form.repository);
  const repositoryOptions = listing.map((repo) => repo.name);
  const scriptOptions = activeRepository?.scripts ?? [];
  const platformOptions = activeRepository?.platforms ?? [];
  const effectivePlatform = form.platform || platformOptions[0] || 'Web';
  const scenarioOptions = useMemo(
    () => bpTokensOf(activeRepository?.scenarios?.[effectivePlatform] ?? []).sort(),
    [activeRepository, effectivePlatform],
  );
  const envOptions = availableEnvModes(envModes, true);

  const slug = (value: string) => value.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'pt-schedule';

  // Compose the crontab line. Mirrors onprem-runner's k6 invocation (-e flags,
  // ../../k6 with PATH fallback) so a scheduled run behaves like a manual one;
  // the trailing "# PT {json}" comment carries name/project/exec for the UI.
  const buildLine = (state: FormState): string | { error: string } => {
    if (!state.name.trim()) return { error: 'Name is required' };
    if (state.cron.trim().split(/\s+/).length !== 5) return { error: 'Cron expression must have 5 fields' };
    if (!state.script) return { error: 'Select a script' };
    if (/%/.test(state.name + state.cron + state.script + state.duration)) return { error: "'%' is not allowed in cron fields" };
    if (!/^[1-9]\d{0,5}[smh]$/.test(state.duration.trim())) return { error: 'Duration must match e.g. 5m / 30s / 1h' };
    if (!Number.isInteger(state.vus) || state.vus < 1 || state.vus > 5000) return { error: 'VUS must be 1-5000' };
    if (!Number.isInteger(state.numStart) || state.numStart < 0 || state.numStart > state.vus) return { error: 'NUMSTART must be 0..VUS' };
    const suite = state.script.split('/')[0];
    const rel = state.script.split('/').slice(1).join('/');
    if (!suite || !rel) return { error: 'Script must be Suite/Platform/file.js' };
    const scenarioEnv = state.scenarios.length ? state.scenarios.join(',') : 'ALL';
    const vars = state.customVars
      .map((v) => ({ key: v.key.trim(), value: v.value }))
      .filter((v) => v.key);
    for (const v of vars) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.key)) return { error: `Invalid variable name: ${v.key}` };
      if (/[%'\r\n]/.test(v.value)) return { error: `Variable ${v.key}: value cannot contain % or quotes` };
    }
    const varFlags = vars.map((v) => ` -e ${v.key}='${v.value}'`).join('');
    const accFlag = state.acc ? ` -e ACC=${state.acc}` : '';
    const runby = state.execType === 'REGRESSION' ? 'Regression' : state.execType === 'LOADTEST' ? 'LoadTest' : 'Manual';
    const log = `/var/log/pt-cron-${slug(state.name)}.log`;
    const meta = JSON.stringify({ name: state.name.trim(), project: state.project, exec: state.execType });
    if (/%/.test(meta)) return { error: "'%' is not allowed in cron fields" };
    // Run from the repo ROOT with ./k6 (pt-framework's cron shape) — never a
    // '..' path, which the server's traversal guard rightly rejects.
    const command = `cd ${repoBase} && K6=./k6; [ -x "$K6" ] || K6=k6; $K6 run Script/${suite}/${rel}`
      + ` -e USER=${state.vus} -e K6_USERS=${state.vus} -e DURATION=${state.duration.trim()} -e ENV=${state.env}${accFlag}`
      + ` -e RUNBY=${runby} -e PLATFORM=${effectivePlatform} -e SCENARIO=${scenarioEnv} -e NUMSTART=${state.numStart}${varFlags}`
      + ` >> ${log} 2>&1 # PT ${meta}`;
    return `${state.enabled ? '' : '# '}${state.cron.trim()} ${command}`;
  };

  const applyChanges = async (changes: Array<{ original: string | null; updated: string | null }>, okMessage: string) => {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const response = await fetch('/api/remote-cron', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const body = await response.json().catch(() => null) as { entries?: CronEntry[]; error?: string; skipped?: number } | null;
      if (!response.ok) throw new Error(body?.error ?? 'Scheduler update failed');
      // The server re-reads the crontab after writing — this IS the VM state.
      setEntries(Array.isArray(body?.entries) ? body.entries : []);
      setStatus(body?.skipped ? `${okMessage} (${body.skipped} line(s) changed elsewhere were skipped — refresh)` : okMessage);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Scheduler update failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, project: getProjectId() ?? 'default' });
    setFormError('');
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (entry: CronEntry) => {
    const f = parseCommand(entry.command);
    setForm({
      name: f.name,
      cron: entry.schedule,
      enabled: entry.enabled,
      project: f.project || (getProjectId() ?? 'default'),
      repository: f.repository,
      script: f.script,
      platform: f.platform,
      scenarios: f.scenarios,
      env: f.env || 'INT',
      acc: f.acc,
      execType: (EXEC_TYPES as readonly string[]).includes(f.execType) ? f.execType : 'MANUAL',
      vus: Number(f.vus) || 335,
      duration: f.duration || '5m',
      numStart: Number(f.numStart) || 0,
      customVars: f.customVars,
    });
    setFormError('');
    setEditing(entry);
    setCreating(false);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const line = buildLine(form);
    if (typeof line !== 'string') {
      setFormError(line.error);
      return;
    }
    const ok = await applyChanges(
      [{ original: editing ? editing.raw : null, updated: line }],
      editing ? 'Schedule updated on 10.184.120.48' : 'Schedule created on 10.184.120.48',
    );
    if (ok) {
      setCreating(false);
      setEditing(null);
    } else {
      setFormError('See the error above the table');
    }
  };

  const toggleEntry = (entry: CronEntry) => {
    const core = entry.raw.replace(/^#+\s*/, '');
    const updated = entry.enabled ? `# ${core}` : core;
    void applyChanges([{ original: entry.raw, updated }], entry.enabled ? 'Schedule disabled' : 'Schedule enabled');
  };

  const deleteEntry = (entry: CronEntry) => {
    const f = parseCommand(entry.command);
    if (!window.confirm(`Delete schedule "${f.name}" from 10.184.120.48? This cannot be undone.`)) return;
    void applyChanges([{ original: entry.raw, updated: null }], 'Schedule deleted');
  };

  const formOpen = creating || Boolean(editing);

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title icon-title"><Clock size={20} /> Scheduler</h1>
          <p className="page-subtitle">Live crontab on 10.184.120.48 — the single source of truth. Nothing is stored locally.</p>
        </div>
        <div className="action-row">
          <button className="pt-primary-btn" type="button" onClick={openCreate} disabled={saving}><Plus size={14} /> New Schedule</button>
          <button className="pt-ghost-btn" type="button" onClick={() => void load()} disabled={loading || saving}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <section className="panel">
        <div className="ph"><span>SCHEDULES</span><span className="ph-meta">{entries.length} on 10.184.120.48</span></div>
        <div className="panel-body pt-page-stack">
          {loading ? <p>Reading crontab from 10.184.120.48…</p> : null}
          {error ? <p role="alert" className="text-crit">{error}</p> : null}
          {status ? <p role="status">{status}</p> : null}
          {!loading && !error && !entries.length ? <p>No PT schedules configured on the runner.</p> : null}
          {!loading && !error && entries.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="mock" style={{ minWidth: '90rem' }}>
                <thead>
                  <tr>
                    <th>Name</th><th>Project</th><th>Repository</th><th>Script</th><th>Platform</th>
                    <th>Scenario</th><th>ENV</th><th>ACC</th><th>EXEC</th><th>VUS</th><th>DURATION</th>
                    <th>NUMSTART</th><th>Custom Vars</th><th>Cron</th><th>Next Run</th><th>Last Run</th>
                    <th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map(({ entry, fields }) => (
                    <tr key={entry.raw}>
                      <td><strong>{fields.name}</strong></td>
                      <td>{fields.project || '—'}</td>
                      <td>{fields.repository || '—'}</td>
                      <td><code>{fields.script || entry.command.slice(0, 40)}</code></td>
                      <td>{fields.platform || '—'}</td>
                      <td>{fields.scenarios.length ? fields.scenarios.join(', ') : 'ALL'}</td>
                      <td>{fields.env || '—'}</td>
                      <td>{fields.acc || '—'}</td>
                      <td>{fields.execType}</td>
                      <td>{fields.vus || '—'}</td>
                      <td>{fields.duration || '—'}</td>
                      <td>{fields.numStart || '0'}</td>
                      <td>{fields.customVars.length ? fields.customVars.map((v) => v.key).join(', ') : '—'}</td>
                      <td><code>{entry.schedule}</code></td>
                      <td>{entry.enabled ? fmt(nextRun(entry.schedule)) : '—'}</td>
                      <td>{fmt(entry.lastRun)}</td>
                      <td><span className={`pill ${entry.enabled ? 'ok' : 'warn'}`}>{entry.enabled ? 'ENABLED' : 'DISABLED'}</span></td>
                      <td>
                        <span className="action-row">
                          <button className="pt-ghost-btn icon-btn" type="button" title="Edit" onClick={() => openEdit(entry)} disabled={saving}><Pencil size={14} /></button>
                          <button className="pt-ghost-btn icon-btn" type="button" title={entry.enabled ? 'Disable' : 'Enable'} onClick={() => toggleEntry(entry)} disabled={saving}><Power size={14} /></button>
                          <button className="pt-ghost-btn icon-btn" type="button" title="Delete" onClick={() => deleteEntry(entry)} disabled={saving}><Trash2 size={14} /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <CronModal title={editing ? `Edit Schedule — ${parseCommand(editing.command).name}` : 'New Schedule'} onClose={() => { setCreating(false); setEditing(null); }}>
          <form className="panel-body pt-page-stack" onSubmit={submitForm}>
            <div className="form-grid">
              <label className="field"><span className="f-label">Scheduler Name</span>
                <input type="text" className="f-input" required value={form.name} placeholder="Nightly smoke" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={saving} />
              </label>
              <label className="field"><span className="f-label">Cron Expression (VM time)</span>
                <input type="text" className="f-input" required value={form.cron} placeholder="0 0 * * *" onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))} disabled={saving} spellCheck={false} />
                <small className="field-hint">Next run: {fmt(nextRun(form.cron))}</small>
              </label>
              <label className="field"><span className="f-label">Project</span>
                <input type="text" className="f-input" value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))} disabled={saving} />
                <small className="field-hint">Scopes the Repository/Script options below (local metadata only).</small>
              </label>
              <label className="field"><span className="f-label">Repository</span>
                <select className="f-input" value={form.repository} onChange={(e) => setForm((f) => ({ ...f, repository: e.target.value, script: '', scenarios: [] }))} disabled={saving}>
                  <option value="">Select…</option>
                  {repositoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  {form.repository && !repositoryOptions.includes(form.repository) && <option value={form.repository}>{form.repository}</option>}
                </select>
              </label>
              <label className="field"><span className="f-label">Script</span>
                <select className="f-input" value={form.script} onChange={(e) => setForm((f) => ({ ...f, script: e.target.value }))} disabled={saving}>
                  <option value="">Select…</option>
                  {scriptOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.script && !scriptOptions.includes(form.script) && <option value={form.script}>{form.script}</option>}
                </select>
              </label>
              <label className="field"><span className="f-label">Target Platform</span>
                <select className="f-input" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value, scenarios: [] }))} disabled={saving}>
                  <option value="">{platformOptions[0] ?? 'Web'} (default)</option>
                  {platformOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="field"><span className="f-label">Scenario ({effectivePlatform} BP scripts)</span>
                <select className="f-input" multiple size={Math.min(5, Math.max(3, scenarioOptions.length))} value={form.scenarios}
                  onChange={(e) => setForm((f) => ({ ...f, scenarios: [...e.currentTarget.selectedOptions].map((o) => o.value) }))} disabled={saving || !scenarioOptions.length}>
                  {scenarioOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <small className="field-hint">None selected = ALL.</small>
              </label>
              <label className="field"><span className="f-label">ENV</span>
                <select className="f-input" value={form.env} onChange={(e) => setForm((f) => ({ ...f, env: e.target.value }))} disabled={saving}>
                  {envOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  {form.env && !envOptions.includes(form.env) && <option value={form.env}>{form.env}</option>}
                </select>
              </label>
              <label className="field"><span className="f-label">ACC</span>
                <select className="f-input" value={form.acc} onChange={(e) => setForm((f) => ({ ...f, acc: e.target.value }))} disabled={saving}>
                  <option value="">Default (ENV fallback)</option>
                  <option value="REG">Regular</option>
                  <option value="DT">Daytrade</option>
                </select>
              </label>
              <label className="field"><span className="f-label">EXEC_TYPE</span>
                <select className="f-input" value={form.execType} onChange={(e) => setForm((f) => ({ ...f, execType: e.target.value }))} disabled={saving}>
                  {EXEC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="field"><span className="f-label">VUS</span>
                <input type="number" min={1} max={5000} className="f-input" value={form.vus} onChange={(e) => setForm((f) => ({ ...f, vus: Number(e.target.value) }))} disabled={saving} />
              </label>
              <label className="field"><span className="f-label">DURATION</span>
                <input type="text" className="f-input" pattern="[1-9][0-9]{0,5}[smh]" placeholder="5m" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} disabled={saving} spellCheck={false} />
              </label>
              <label className="field"><span className="f-label">NUMSTART</span>
                <input type="number" min={0} max={form.vus} className="f-input" value={form.numStart} onChange={(e) => setForm((f) => ({ ...f, numStart: Number(e.target.value) }))} disabled={saving} />
              </label>
              <label className="field"><span className="f-label">Status</span>
                <select className="f-input" value={form.enabled ? 'enabled' : 'disabled'} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.value === 'enabled' }))} disabled={saving}>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </div>
            <div className="field"><span className="f-label">Custom Variables</span>
              <CustomVarsEditor vars={form.customVars} onChange={(next) => setForm((f) => ({ ...f, customVars: next }))} disabled={saving} />
            </div>
            {formError && <p role="alert" className="text-crit">{formError}</p>}
            <div className="action-row">
              <button className="pt-ghost-btn" type="button" onClick={() => { setCreating(false); setEditing(null); }} disabled={saving}>Cancel</button>
              <button className="pt-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save to 10.184.120.48' : 'Create on 10.184.120.48'}</button>
            </div>
          </form>
        </CronModal>
      )}
    </div>
  );
};
