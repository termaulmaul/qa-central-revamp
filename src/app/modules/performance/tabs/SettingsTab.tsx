"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Activity, Bell, Eye, EyeOff, FolderGit2, Gauge, Link2, RefreshCw, ServerCog, Settings as SettingsIcon, Shield, SlidersHorizontal, Timer } from 'lucide-react';
// Same option sources and components as Execute Test's [RUNTIME_CFG], so the
// two screens can never drift apart.
import { EXEC_TYPES, availableEnvModes, bpTokensOf, type RepositoryListing } from '../components/Content';
import { CustomVarsEditor, type CustomVar } from '../components/CustomVarsEditor';

// Scalar RUNTIME_CFG defaults; SCENARIO (multi-select) and CUSTOM_VARS are
// held separately. Placeholders/labels show the application defaults used
// when a field is left on "application default".
const RD_SCALAR_KEYS = ['ENV_MODE', 'TARGET_PLATFORM', 'ACC', 'EXEC_TYPE', 'VUS', 'DURATION', 'NUMSTART'] as const;

type ProjectOption = { id: string; name: string };

type SettingsValues = {
  THRESHOLD_AVG_MS: number;
  THRESHOLD_ERR_PCT: number;
  THRESHOLD_MIN_RPS: number;
};

const DEFAULT_SETTINGS: SettingsValues = {
  THRESHOLD_AVG_MS: 200,
  THRESHOLD_ERR_PCT: 0.1,
  THRESHOLD_MIN_RPS: 381,
};

// The GET returns both categories in one payload; each card saves only its
// own fields (the backend applies partial updates independently).
type SettingsResponse = { settings: SettingsValues & { SCRIPT_REPO_PATH?: string } };

// Server view of the Grafana Configuration: the password never travels to the
// browser — passwordSet says whether one exists, and an empty password on save
// keeps the current one. `source` says where the effective config comes from.
type GrafanaView = {
  url: string;
  user: string;
  verifySsl: boolean;
  timeoutMs: number;
  passwordSet: boolean;
  source: 'settings' | 'env' | 'none';
};

const DEFAULT_GRAFANA: GrafanaView = {
  url: '', user: '', verifySsl: false, timeoutMs: 8000, passwordSet: false, source: 'none',
};

type GrafanaResponse = { grafana: GrafanaView };

// --- App configuration sections (Execution Relay, Notifications, Queue &
// Scheduler, Authentication, Qase). One GET serves every card; each card has
// its own POST. Secrets never travel to the browser: views carry set-flags,
// blank input keeps the current secret, Clear marks it for removal.

const NOTIFY_REF_LIST = ['TEAMS_WEBHOOK', 'NOTIFY_TEAMS', 'DISCORD_WEBHOOK', 'TELEGRAM_WEBHOOK', 'BRRR_WEBHOOK'] as const;
type NotifyRefName = typeof NOTIFY_REF_LIST[number];

const NOTIFY_LABELS: Record<NotifyRefName, string> = {
  TEAMS_WEBHOOK: 'Teams Webhook',
  NOTIFY_TEAMS: 'Teams (Notify) Webhook',
  DISCORD_WEBHOOK: 'Discord Webhook',
  TELEGRAM_WEBHOOK: 'Telegram Webhook',
  BRRR_WEBHOOK: 'BRRR Webhook',
};

type ConfigSource = 'settings' | 'env' | 'default' | 'none';

type QueueStored = Partial<{
  queuePollMs: number; queueLeaseSeconds: number; cronEnabled: boolean; cronPollMs: number; cronBatchSize: number;
}>;
type AuthStored = Partial<{
  sessionHours: number; rateLimitWindowSeconds: number; rateLimitMax: number; passwordExpiryWarningDays: number;
}>;

type AppConfigView = {
  onprem: {
    host1: string; host2: string; user: string; user2: string;
    passwordSet: boolean; testPasswordSet: boolean; testPinSet: boolean; source: ConfigSource;
  };
  notify: Record<NotifyRefName, { configured: boolean; source: ConfigSource }>;
  queue: {
    stored: QueueStored;
    effective: { queuePollMs: number; queueLeaseSeconds: number; cronEnabled: boolean; cronPollMs: number; cronBatchSize: number };
  };
  auth: {
    stored: AuthStored;
    effective: { sessionHours: number; rateLimitWindowSeconds: number; rateLimitMax: number; passwordExpiryWarningDays: number };
  };
  qase: { baseUrl: string; baseUrlStored: boolean; apiTokenSet: boolean; source: ConfigSource };
};

type AppConfigResponse = { appConfig: AppConfigView };

// Write-only secret editing state: blank keeps the stored secret, `clear`
// marks it for removal on save.
type SecretState = { value: string; clear: boolean };
const EMPTY_SECRET: SecretState = { value: '', clear: false };
const secretPayload = (state: SecretState): string | null => (state.clear ? null : state.value);

function sourceText(source: ConfigSource): string {
  if (source === 'settings') return 'Active source: saved dashboard settings — used on every machine.';
  if (source === 'env') return 'Active source: this machine’s .env fallback — Save moves it into the dashboard for every machine.';
  if (source === 'default') return 'Active source: application defaults.';
  return 'Not configured yet.';
}

function SecretField({ label, state, onChange, isSet, disabled, hint }: {
  label: string;
  state: SecretState;
  onChange: (next: SecretState) => void;
  isSet: boolean;
  disabled: boolean;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const iconButton = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--ink-3)', display: 'inline-flex' } as const;
  return (
    <label className="field">
      <span className="f-label">{label}</span>
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          type={show ? 'text' : 'password'}
          className="f-input"
          style={{ width: '100%', paddingRight: 'var(--s3)', boxSizing: 'border-box' }}
          value={state.value}
          placeholder={state.clear ? 'Will be cleared on save' : (isSet ? '••••••••' : '')}
          onChange={(event) => onChange({ value: event.currentTarget.value, clear: false })}
          disabled={disabled || state.clear}
          autoComplete="new-password"
          spellCheck={false}
        />
        <span style={{ position: 'absolute', right: 'var(--s-1)', top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <button type="button" style={iconButton} onClick={() => setShow((current) => !current)} aria-label={show ? `Hide ${label}` : `Show ${label}`} disabled={disabled || state.clear}>
            {show ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          {isSet ? (
            <button type="button" className="pt-ghost-btn" style={{ padding: '0 6px', fontSize: 'var(--fs-xs)' }} onClick={() => onChange(state.clear ? EMPTY_SECRET : { value: '', clear: true })} disabled={disabled}>
              {state.clear ? 'Undo' : 'Clear'}
            </button>
          ) : null}
        </span>
      </span>
      <small className="field-hint">{state.clear ? 'Marked for removal — Save to apply, Undo to keep.' : (hint ?? (isSet ? 'Saved — leave blank to keep the current value.' : 'Not set.'))}</small>
    </label>
  );
}

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  throw new Error(typeof body?.error === 'string' ? body.error : 'Unable to update settings');
}

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsValues>(DEFAULT_SETTINGS);
  const [repoPath, setRepoPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pathSaving, setPathSaving] = useState(false);
  const [pathSaved, setPathSaved] = useState(false);
  const [pathError, setPathError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    setPathError('');
    try {
      const body = await fetch('/api/settings', { credentials: 'include' }).then(responseJson<SettingsResponse>);
      if (id !== requestId.current) return;
      const { SCRIPT_REPO_PATH, ...thresholds } = body.settings;
      setSettings(thresholds);
      setRepoPath(SCRIPT_REPO_PATH ?? '');
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : 'Unable to load settings');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Saves ONLY the threshold trio — the repository path card is untouched.
  const saveThresholds = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const body = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      }).then(responseJson<SettingsResponse>);
      const { SCRIPT_REPO_PATH: _ignored, ...thresholds } = body.settings;
      setSettings(thresholds);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Saves ONLY the repository path — thresholds are neither sent nor
  // re-validated. Validation errors surface in this card alone.
  const savePath = async (event: FormEvent) => {
    event.preventDefault();
    setPathSaving(true);
    setPathSaved(false);
    setPathError('');
    try {
      const body = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ SCRIPT_REPO_PATH: repoPath }),
      }).then(responseJson<SettingsResponse>);
      setRepoPath(body.settings.SCRIPT_REPO_PATH ?? '');
      setPathSaved(true);
    } catch (cause) {
      setPathError(cause instanceof Error ? cause.message : 'Unable to save the project path');
    } finally {
      setPathSaving(false);
    }
  };

  const change = (key: 'THRESHOLD_AVG_MS' | 'THRESHOLD_ERR_PCT' | 'THRESHOLD_MIN_RPS', value: number) => {
    if (!Number.isFinite(value)) return;
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const changePath = (value: string) => {
    setRepoPath(value);
    setPathSaved(false);
  };

  // --- Grafana Configuration (deployment-wide) ---
  const [gf, setGf] = useState<GrafanaView>(DEFAULT_GRAFANA);
  const [gfPassword, setGfPassword] = useState('');
  const [gfShowPwd, setGfShowPwd] = useState(false);
  const [gfTimeout, setGfTimeout] = useState('8000');
  const [gfLoading, setGfLoading] = useState(true);
  const [gfSaving, setGfSaving] = useState(false);
  const [gfSaved, setGfSaved] = useState(false);
  const [gfError, setGfError] = useState('');
  const gfRequestId = useRef(0);

  const gfLoad = useCallback(async () => {
    const id = ++gfRequestId.current;
    setGfLoading(true);
    setGfError('');
    try {
      const body = await fetch('/api/settings/grafana', { credentials: 'include' }).then(responseJson<GrafanaResponse>);
      if (id !== gfRequestId.current) return;
      setGf(body.grafana);
      setGfTimeout(String(body.grafana.timeoutMs));
      setGfPassword('');
    } catch (cause) {
      if (id !== gfRequestId.current) return;
      setGfError(cause instanceof Error ? cause.message : 'Unable to load the Grafana configuration');
    } finally {
      if (id === gfRequestId.current) setGfLoading(false);
    }
  }, []);

  useEffect(() => {
    void gfLoad();
  }, [gfLoad]);

  // Saves ONLY the Grafana card. An empty password keeps the current secret;
  // clearing every field removes the stored config (env fallback takes over).
  const saveGrafana = async (event: FormEvent) => {
    event.preventDefault();
    setGfSaving(true);
    setGfSaved(false);
    setGfError('');
    try {
      const timeoutMs = Number(gfTimeout);
      if (!Number.isInteger(timeoutMs) || timeoutMs < 500 || timeoutMs > 30000) {
        throw new Error('Timeout must be a whole number of milliseconds from 500 through 30000');
      }
      const body = await fetch('/api/settings/grafana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url: gf.url,
          user: gf.user,
          password: gfPassword,
          verifySsl: gf.verifySsl,
          timeoutMs,
        }),
      }).then(responseJson<GrafanaResponse>);
      setGf(body.grafana);
      setGfTimeout(String(body.grafana.timeoutMs));
      setGfPassword('');
      setGfSaved(true);
    } catch (cause) {
      setGfError(cause instanceof Error ? cause.message : 'Unable to save the Grafana configuration');
    } finally {
      setGfSaving(false);
    }
  };

  const changeGf = (patch: Partial<GrafanaView>) => {
    setGf((current) => ({ ...current, ...patch }));
    setGfSaved(false);
  };

  // --- App configuration cards (deployment-wide) ---
  const [ac, setAc] = useState<AppConfigView | null>(null);
  const [acLoading, setAcLoading] = useState(true);
  const [acError, setAcError] = useState('');
  const acRequestId = useRef(0);

  const [op, setOp] = useState({ host1: '', host2: '', user: '', user2: '' });
  const [opPassword, setOpPassword] = useState<SecretState>(EMPTY_SECRET);
  const [opTestPassword, setOpTestPassword] = useState<SecretState>(EMPTY_SECRET);
  const [opTestPin, setOpTestPin] = useState<SecretState>(EMPTY_SECRET);
  const [nf, setNf] = useState<Record<NotifyRefName, SecretState>>(
    () => Object.fromEntries(NOTIFY_REF_LIST.map((ref) => [ref, EMPTY_SECRET])) as Record<NotifyRefName, SecretState>,
  );
  const [qc, setQc] = useState({ queuePollMs: '', queueLeaseSeconds: '', cronPollMs: '', cronBatchSize: '' });
  const [qcCron, setQcCron] = useState(false);
  const [au, setAu] = useState({ sessionHours: '', rateLimitWindowSeconds: '', rateLimitMax: '', passwordExpiryWarningDays: '' });
  const [qsBaseUrl, setQsBaseUrl] = useState('');
  const [qsToken, setQsToken] = useState<SecretState>(EMPTY_SECRET);

  type CardKey = 'onprem' | 'notify' | 'queue' | 'auth' | 'qase';
  const [cardSaving, setCardSaving] = useState<CardKey | ''>('');
  const [cardSaved, setCardSaved] = useState<CardKey | ''>('');
  const [cardError, setCardError] = useState<Partial<Record<CardKey, string>>>({});

  // Re-seeds one card's fields from a fresh view (or all cards on load), so
  // saving one card never wipes another card's in-progress edits.
  const seedCards = useCallback((view: AppConfigView, only?: CardKey) => {
    setAc(view);
    if (!only || only === 'onprem') {
      setOp({ host1: view.onprem.host1, host2: view.onprem.host2, user: view.onprem.user, user2: view.onprem.user2 });
      setOpPassword(EMPTY_SECRET);
      setOpTestPassword(EMPTY_SECRET);
      setOpTestPin(EMPTY_SECRET);
    }
    if (!only || only === 'notify') {
      setNf(Object.fromEntries(NOTIFY_REF_LIST.map((ref) => [ref, EMPTY_SECRET])) as Record<NotifyRefName, SecretState>);
    }
    if (!only || only === 'queue') {
      setQc({
        queuePollMs: view.queue.stored.queuePollMs?.toString() ?? '',
        queueLeaseSeconds: view.queue.stored.queueLeaseSeconds?.toString() ?? '',
        cronPollMs: view.queue.stored.cronPollMs?.toString() ?? '',
        cronBatchSize: view.queue.stored.cronBatchSize?.toString() ?? '',
      });
      setQcCron(view.queue.effective.cronEnabled);
    }
    if (!only || only === 'auth') {
      setAu({
        sessionHours: view.auth.stored.sessionHours?.toString() ?? '',
        rateLimitWindowSeconds: view.auth.stored.rateLimitWindowSeconds?.toString() ?? '',
        rateLimitMax: view.auth.stored.rateLimitMax?.toString() ?? '',
        passwordExpiryWarningDays: view.auth.stored.passwordExpiryWarningDays?.toString() ?? '',
      });
    }
    if (!only || only === 'qase') {
      setQsBaseUrl(view.qase.baseUrlStored ? view.qase.baseUrl : '');
      setQsToken(EMPTY_SECRET);
    }
  }, []);

  const acLoad = useCallback(async () => {
    const id = ++acRequestId.current;
    setAcLoading(true);
    setAcError('');
    try {
      const body = await fetch('/api/settings/app-config', { credentials: 'include' }).then(responseJson<AppConfigResponse>);
      if (id !== acRequestId.current) return;
      seedCards(body.appConfig);
    } catch (cause) {
      if (id !== acRequestId.current) return;
      setAcError(cause instanceof Error ? cause.message : 'Unable to load the app configuration');
    } finally {
      if (id === acRequestId.current) setAcLoading(false);
    }
  }, [seedCards]);

  useEffect(() => {
    void acLoad();
  }, [acLoad]);

  const saveCard = async (card: CardKey, payload: unknown) => {
    setCardSaving(card);
    setCardSaved('');
    setCardError((current) => ({ ...current, [card]: '' }));
    try {
      const body = await fetch(`/api/settings/app-config/${card}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }).then(responseJson<AppConfigResponse>);
      seedCards(body.appConfig, card);
      setCardSaved(card);
    } catch (cause) {
      setCardError((current) => ({ ...current, [card]: cause instanceof Error ? cause.message : 'Unable to save' }));
    } finally {
      setCardSaving('');
    }
  };

  // Blank numeric input = omitted key = fall back to env/default on the server.
  const numericPayload = (fields: Record<string, string>): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const [key, raw] of Object.entries(fields)) {
      if (raw.trim() !== '') out[key] = Number(raw);
    }
    return out;
  };

  const cardBusy = (card: CardKey) => acLoading || cardSaving === card;
  const cardMark = (card: CardKey) => { setCardSaved((current) => (current === card ? '' : current)); };

  // --- Runtime Defaults (per project) ---
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [rdProject, setRdProject] = useState('');
  const [rdValues, setRdValues] = useState<Record<string, string>>({});
  const [rdScenarios, setRdScenarios] = useState<string[]>([]);
  // UI-only filter for the scenario list; selection state is untouched.
  const [rdScenarioFilter, setRdScenarioFilter] = useState('');
  const [rdVars, setRdVars] = useState<CustomVar[]>([]);
  const [rdLoading, setRdLoading] = useState(false);
  const [rdSaving, setRdSaving] = useState(false);
  const [rdSaved, setRdSaved] = useState(false);
  const [rdError, setRdError] = useState('');
  const rdRequestId = useRef(0);

  // Same data source as Execute Test: /api/scripts/listing supplies the env
  // modes (Helper/config.js ENV_CONFIG), the project's platforms, and its BP
  // scenarios. Re-fetched on every project switch, so a SYNC's changes show
  // up the next time the options load.
  const [rdListing, setRdListing] = useState<RepositoryListing[]>([]);
  const [rdEnvModes, setRdEnvModes] = useState<string[]>([]);
  const rdListingRequestId = useRef(0);
  useEffect(() => {
    if (!rdProject) return;
    const id = ++rdListingRequestId.current;
    void (async () => {
      try {
        const response = await fetch(`/api/scripts/listing?projectId=${encodeURIComponent(rdProject)}`, { credentials: 'include' });
        if (!response.ok) return;
        const body = await response.json() as { repositories?: unknown; envModes?: unknown };
        if (id !== rdListingRequestId.current) return;
        setRdEnvModes(Array.isArray(body.envModes)
          ? body.envModes.filter((value): value is string => typeof value === 'string')
          : []);
        setRdListing(Array.isArray(body.repositories)
          ? body.repositories.filter((value): value is RepositoryListing =>
            typeof (value as { name?: unknown } | null)?.name === 'string')
          : []);
      } catch { /* keep previous options */ }
    })();
  }, [rdProject]);

  // Options derived exactly like Execute Test: env modes via the shared
  // availableEnvModes helper (STG/PRD visible here — configuring a default is
  // deliberate), platforms/scenarios unioned across the project's
  // repositories, scenarios following the selected TARGET_PLATFORM.
  const rdEnvOptions = useMemo(() => availableEnvModes(rdEnvModes, true), [rdEnvModes]);
  const rdPlatformOptions = useMemo(() => [...new Set(
    rdListing.flatMap((repo) => repo.platforms ?? []),
  )], [rdListing]);
  // Platform values are repo-cased (e.g. 'Web'); fall back to the project's
  // first platform when no default is chosen, like Execute Test's snap guard.
  const rdEffectivePlatform = rdValues.TARGET_PLATFORM || rdPlatformOptions[0] || 'WEB';
  // Same BP-token derivation as Execute Test's SCENARIO options.
  const rdScenarioOptions = useMemo(() => bpTokensOf(
    rdListing.flatMap((repo) => repo.scenarios?.[rdEffectivePlatform] ?? []),
  ).sort(), [rdListing, rdEffectivePlatform]);

  // Prune selected scenarios no longer offered for the platform — the same
  // stale-token guard Execute Test applies.
  useEffect(() => {
    if (!rdListing.length) return;
    setRdScenarios((current) => {
      const next = current.filter((token) => rdScenarioOptions.includes(token));
      return next.length === current.length ? current : next;
    });
  }, [rdScenarioOptions, rdListing.length]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/projects', { credentials: 'include' });
        if (!response.ok) return;
        const body = await response.json() as { projects?: unknown };
        const options = Array.isArray(body.projects)
          ? body.projects
            .filter((value): value is { id: string; name?: unknown } =>
              typeof (value as { id?: unknown } | null)?.id === 'string')
            .map((value) => ({ id: value.id, name: typeof value.name === 'string' && value.name ? value.name : value.id }))
          : [];
        setProjects(options);
        setRdProject((current) => current || options[0]?.id || '');
      } catch { /* leave the list empty; the panel disables itself */ }
    })();
  }, []);

  const loadRuntimeDefaults = useCallback(async (project: string) => {
    if (!project) return;
    const id = ++rdRequestId.current;
    setRdLoading(true);
    setRdSaved(false);
    setRdError('');
    try {
      const response = await fetch(`/api/settings/runtime-defaults?projectId=${encodeURIComponent(project)}`, { credentials: 'include' });
      const body = await response.json().catch(() => null) as { defaults?: Record<string, unknown> | null; error?: string } | null;
      if (id !== rdRequestId.current) return;
      if (!response.ok) throw new Error(body?.error ?? 'Unable to load runtime defaults');
      const next: Record<string, string> = {};
      for (const key of RD_SCALAR_KEYS) {
        const value = body?.defaults?.[key];
        next[key] = value === undefined || value === null ? '' : String(value);
      }
      setRdValues(next);
      const savedScenarios = body?.defaults?.SCENARIO;
      setRdScenarios(Array.isArray(savedScenarios)
        ? savedScenarios.filter((value): value is string => typeof value === 'string')
        : []);
      const savedVars = body?.defaults?.CUSTOM_VARS;
      setRdVars(Array.isArray(savedVars)
        ? savedVars.flatMap((row) => {
          const candidate = row as { key?: unknown; value?: unknown } | null;
          return typeof candidate?.key === 'string' && typeof candidate?.value === 'string'
            ? [{ key: candidate.key, value: candidate.value }]
            : [];
        })
        : []);
    } catch (cause) {
      if (id === rdRequestId.current) setRdError(cause instanceof Error ? cause.message : 'Unable to load runtime defaults');
    } finally {
      if (id === rdRequestId.current) setRdLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuntimeDefaults(rdProject);
  }, [rdProject, loadRuntimeDefaults]);

  const rdDisabled = rdLoading || rdSaving || !rdProject;
  const changeRd = (key: string, value: string) => {
    setRdValues((current) => ({ ...current, [key]: value }));
    setRdSaved(false);
  };

  const saveRuntimeDefaults = async (event: FormEvent) => {
    event.preventDefault();
    if (!rdProject) return;
    setRdSaving(true);
    setRdSaved(false);
    setRdError('');
    try {
      const defaults: Record<string, string | number | string[] | CustomVar[]> = {};
      for (const key of RD_SCALAR_KEYS) {
        const raw = (rdValues[key] ?? '').trim();
        if (!raw) continue; // empty = use the application default
        if (key === 'VUS' || key === 'NUMSTART') {
          const parsed = Number(raw);
          if (!Number.isInteger(parsed)) throw new Error(`${key} must be a whole number`);
          defaults[key] = parsed;
        } else {
          defaults[key] = raw;
        }
      }
      if (rdScenarios.length) defaults.SCENARIO = rdScenarios;
      // Rows with a name, trimmed, in entry order — the same filter Execute
      // Test applies on submit.
      const vars = rdVars
        .map((variable) => ({ key: variable.key.trim(), value: variable.value }))
        .filter((variable) => variable.key);
      if (vars.length) defaults.CUSTOM_VARS = vars;
      const response = await fetch('/api/settings/runtime-defaults', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: rdProject, defaults }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? 'Unable to save runtime defaults');
      setRdSaved(true);
    } catch (cause) {
      setRdError(cause instanceof Error ? cause.message : 'Unable to save runtime defaults');
    } finally {
      setRdSaving(false);
    }
  };

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title icon-title"><SettingsIcon size={20} /> Settings</h1>
          <p className="page-subtitle">Deployment-wide configuration — thresholds, script path, Grafana, execution relay, notifications, queue, authentication, Qase — plus per-project runtime defaults. Saved settings work on every machine; .env stays only as a fallback.</p>
        </div>
        <div className="action-row">
          <button className="pt-ghost-btn" type="button" onClick={() => { void load(); void gfLoad(); void acLoad(); }} disabled={loading || saving || pathSaving || gfLoading || gfSaving || acLoading || cardSaving !== ''}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <form className="panel" onSubmit={saveThresholds} aria-busy={loading || saving}>
        <div className="ph"><span className="icon-title"><Gauge size={16} /> Verdict Thresholds</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Deployment-wide pass/fail thresholds applied to every performance run.</p>
          <div className="form-grid">
            <label className="field"><span className="f-label">Max Avg Latency</span><span className="input-affix"><input type="number" min="1" max="600000" className="f-input" value={settings.THRESHOLD_AVG_MS} onChange={(event) => change('THRESHOLD_AVG_MS', event.currentTarget.valueAsNumber)} disabled={loading || saving} required /><span>ms</span></span><small className="field-hint">Average latency must stay below this.</small></label>
            <label className="field"><span className="f-label">Max Error Rate</span><span className="input-affix"><input type="number" min="0" max="100" step="0.01" className="f-input" value={settings.THRESHOLD_ERR_PCT} onChange={(event) => change('THRESHOLD_ERR_PCT', event.currentTarget.valueAsNumber)} disabled={loading || saving} required /><span>%</span></span><small className="field-hint">Failed requests must stay below this.</small></label>
            <label className="field"><span className="f-label">Min RPS</span><span className="input-affix"><input type="number" min="0" max="1000000" className="f-input" value={settings.THRESHOLD_MIN_RPS} onChange={(event) => change('THRESHOLD_MIN_RPS', event.currentTarget.valueAsNumber)} disabled={loading || saving} required /><span>req/s</span></span><small className="field-hint">Total requests per second must meet this.</small></label>
          </div>
          <code className="tc-pre mt-s0 tc-muted">PASS = avg &lt; {settings.THRESHOLD_AVG_MS}ms &amp;&amp; err &lt; {settings.THRESHOLD_ERR_PCT}% &amp;&amp; rps ≥ {settings.THRESHOLD_MIN_RPS}</code>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={loading || saving}>{saving ? 'Saving…' : 'Save Thresholds'}</button>
            {saved ? <span className="pill ok">SAVED</span> : null}
          </div>
          {error ? <p role="alert">{error}</p> : null}
        </div>
      </form>

      <form className="panel" onSubmit={savePath} aria-busy={loading || pathSaving}>
        <div className="ph"><span className="icon-title"><FolderGit2 size={16} /> Growin Performance Test Project Path</span><span className="ph-meta">THIS MACHINE</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Local path to the growin_performancetest repository — the single source for SYNC, script discovery, and catalog scans.</p>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              <span className="f-label">Project Path</span>
              <input
                type="text"
                className="f-input"
                value={repoPath}
                placeholder="/absolute/path/to/growin_performancetest"
                onChange={(event) => changePath(event.currentTarget.value)}
                disabled={loading || pathSaving}
                spellCheck={false}
                autoComplete="off"
              />
              <small className="field-hint">Used by SYNC, repository/script/scenario discovery, catalog scans, and Helper/config.js reads. Leave empty to auto-discover next to this project. Validated on save; remote ONPREM VM paths are unaffected.</small>
            </label>
          </div>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={loading || pathSaving}>{pathSaving ? 'Saving…' : 'Save Project Path'}</button>
            {pathSaved ? <span className="pill ok">SAVED</span> : null}
          </div>
          {pathError ? <p role="alert">{pathError}</p> : null}
        </div>
      </form>

      <form className="panel" onSubmit={saveGrafana} aria-busy={gfLoading || gfSaving}>
        <div className="ph"><span className="icon-title"><Activity size={16} /> Grafana Configuration</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Grafana connection behind the Metrics Dashboard CPU/Memory cards and the derived Health Score. Saved deployment-wide, so the dashboard works on any machine without editing .env.</p>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              <span className="f-label">Grafana URL</span>
              <input
                type="url"
                className="f-input"
                value={gf.url}
                placeholder="https://grafana.example.com"
                onChange={(event) => changeGf({ url: event.currentTarget.value })}
                disabled={gfLoading || gfSaving}
                spellCheck={false}
                autoComplete="off"
              />
              <small className="field-hint">Must be https, without query parameters or embedded credentials.</small>
            </label>
            <label className="field">
              <span className="f-label">Username</span>
              <input
                type="text"
                className="f-input"
                value={gf.user}
                placeholder="grafana-user"
                onChange={(event) => changeGf({ user: event.currentTarget.value })}
                disabled={gfLoading || gfSaving}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
            <label className="field">
              <span className="f-label">Password</span>
              <span style={{ position: 'relative', display: 'block' }}>
                <input
                  type={gfShowPwd ? 'text' : 'password'}
                  className="f-input"
                  style={{ width: '100%', paddingRight: 'var(--s2)', boxSizing: 'border-box' }}
                  value={gfPassword}
                  placeholder={gf.passwordSet ? '••••••••' : 'Password'}
                  onChange={(event) => { setGfPassword(event.currentTarget.value); setGfSaved(false); }}
                  disabled={gfLoading || gfSaving}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setGfShowPwd((current) => !current)}
                  aria-label={gfShowPwd ? 'Hide password' : 'Show password'}
                  disabled={gfLoading || gfSaving}
                  style={{ position: 'absolute', right: 'var(--s-1)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--ink-3)', display: 'inline-flex' }}
                >
                  {gfShowPwd ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </span>
              <small className="field-hint">{gf.passwordSet ? 'A password is saved — leave blank to keep it.' : 'Required for a new configuration.'}</small>
            </label>
            <label className="field">
              <span className="f-label">Verify SSL</span>
              <span className="pt-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={gf.verifySsl}
                  onChange={(event) => changeGf({ verifySsl: event.currentTarget.checked })}
                  disabled={gfLoading || gfSaving}
                />
                <span className="pt-switch-track" aria-hidden="true" />
                <span className="pt-switch-text">{gf.verifySsl ? 'Enabled' : 'Disabled'}</span>
              </span>
              <small className="field-hint">Keep disabled for the corporate Grafana&apos;s internal-CA certificate.</small>
            </label>
            <label className="field">
              <span className="f-label">Timeout</span>
              <span className="input-affix">
                <input
                  type="number"
                  min={500}
                  max={30000}
                  step={100}
                  className="f-input"
                  value={gfTimeout}
                  placeholder="8000"
                  onChange={(event) => { setGfTimeout(event.currentTarget.value); setGfSaved(false); }}
                  disabled={gfLoading || gfSaving}
                  required
                />
                <span>ms</span>
              </span>
              <small className="field-hint">Per-request limit for Grafana calls (500–30000 ms).</small>
            </label>
          </div>
          <small className="field-hint">
            {gf.source === 'settings'
              ? 'Active source: saved dashboard settings — used on every machine.'
              : gf.source === 'env'
                ? 'Active source: this machine’s .env fallback — Save moves it into the dashboard for every machine.'
                : 'Not configured yet — the metrics cards show Unavailable until this is saved.'}
            {' '}Clear every field and save to remove the stored configuration.
          </small>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={gfLoading || gfSaving}>{gfSaving ? 'Saving…' : 'Save Grafana Config'}</button>
            {gfSaved ? <span className="pill ok">SAVED</span> : null}
          </div>
          {gfError ? <p role="alert">{gfError}</p> : null}
        </div>
      </form>

      {acError ? <p role="alert">{acError}</p> : null}

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCard('onprem', {
            ...op,
            password: secretPayload(opPassword),
            testPassword: secretPayload(opTestPassword),
            testPin: secretPayload(opTestPin),
          });
        }}
        aria-busy={cardBusy('onprem')}
      >
        <div className="ph"><span className="icon-title"><ServerCog size={16} /> Execution Relay (ONPREM)</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">SSH/SCP two-hop relay to the on-prem k6 runner: dashboard → jump host → runner. Used by Execute Test, the queue worker, and the remote cron.</p>
          <div className="form-grid">
            <label className="field"><span className="f-label">Jump Host</span>
              <input type="text" className="f-input" value={op.host1} placeholder="10.82.15.72" onChange={(event) => { setOp({ ...op, host1: event.currentTarget.value }); cardMark('onprem'); }} disabled={cardBusy('onprem')} spellCheck={false} autoComplete="off" />
              <small className="field-hint">First hop (SSH ProxyCommand).</small>
            </label>
            <label className="field"><span className="f-label">Runner Host</span>
              <input type="text" className="f-input" value={op.host2} placeholder="10.184.120.48" onChange={(event) => { setOp({ ...op, host2: event.currentTarget.value }); cardMark('onprem'); }} disabled={cardBusy('onprem')} spellCheck={false} autoComplete="off" />
              <small className="field-hint">Performance Test VM running k6.</small>
            </label>
            <label className="field"><span className="f-label">SSH User</span>
              <input type="text" className="f-input" value={op.user} placeholder="qa" onChange={(event) => { setOp({ ...op, user: event.currentTarget.value }); cardMark('onprem'); }} disabled={cardBusy('onprem')} spellCheck={false} autoComplete="off" />
              <small className="field-hint">Used on both hops unless a runner user is set.</small>
            </label>
            <label className="field"><span className="f-label">Runner User (optional)</span>
              <input type="text" className="f-input" value={op.user2} placeholder={op.user || 'qa'} onChange={(event) => { setOp({ ...op, user2: event.currentTarget.value }); cardMark('onprem'); }} disabled={cardBusy('onprem')} spellCheck={false} autoComplete="off" />
              <small className="field-hint">Overrides the SSH user on the runner hop only.</small>
            </label>
            <SecretField label="SSH Password" state={opPassword} onChange={(next) => { setOpPassword(next); cardMark('onprem'); }} isSet={ac?.onprem.passwordSet ?? false} disabled={cardBusy('onprem')} />
            <SecretField label="Test-User Password" state={opTestPassword} onChange={(next) => { setOpTestPassword(next); cardMark('onprem'); }} isSet={ac?.onprem.testPasswordSet ?? false} disabled={cardBusy('onprem')} hint="Optional — performance scripts authenticate with it." />
            <SecretField label="Test-User PIN" state={opTestPin} onChange={(next) => { setOpTestPin(next); cardMark('onprem'); }} isSet={ac?.onprem.testPinSet ?? false} disabled={cardBusy('onprem')} hint="Optional — performance scripts authenticate with it." />
          </div>
          <small className="field-hint">{ac ? sourceText(ac.onprem.source) : ''}</small>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={cardBusy('onprem')}>{cardSaving === 'onprem' ? 'Saving…' : 'Save Execution Relay'}</button>
            {cardSaved === 'onprem' ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-ghost-btn" type="button" disabled={cardBusy('onprem')} onClick={() => void saveCard('onprem', { host1: '', host2: '', user: '', user2: '', password: null, testPassword: null, testPin: null })}>Reset to .env / defaults</button>
          </div>
          {cardError.onprem ? <p role="alert">{cardError.onprem}</p> : null}
        </div>
      </form>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCard('notify', Object.fromEntries(NOTIFY_REF_LIST.map((ref) => [ref, secretPayload(nf[ref])])));
        }}
        aria-busy={cardBusy('notify')}
      >
        <div className="ph"><span className="icon-title"><Bell size={16} /> Notifications</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Webhook destinations the Webhooks page can reference. URLs embed tokens, so they are stored as secrets and never shown back.</p>
          <div className="form-grid">
            {NOTIFY_REF_LIST.map((ref) => (
              <SecretField
                key={ref}
                label={NOTIFY_LABELS[ref]}
                state={nf[ref]}
                onChange={(next) => { setNf((current) => ({ ...current, [ref]: next })); cardMark('notify'); }}
                isSet={ac?.notify[ref]?.configured ?? false}
                disabled={cardBusy('notify')}
                hint={ac ? (ac.notify[ref]?.configured ? `Configured (${ac.notify[ref].source === 'settings' ? 'saved settings' : '.env fallback'}) — leave blank to keep.` : 'Not configured — paste the https webhook URL.') : undefined}
              />
            ))}
          </div>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={cardBusy('notify')}>{cardSaving === 'notify' ? 'Saving…' : 'Save Notifications'}</button>
            {cardSaved === 'notify' ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-ghost-btn" type="button" disabled={cardBusy('notify')} onClick={() => void saveCard('notify', Object.fromEntries(NOTIFY_REF_LIST.map((ref) => [ref, null])))}>Reset to .env / defaults</button>
          </div>
          {cardError.notify ? <p role="alert">{cardError.notify}</p> : null}
        </div>
      </form>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCard('queue', { ...numericPayload(qc), cronEnabled: qcCron });
        }}
        aria-busy={cardBusy('queue')}
      >
        <div className="ph"><span className="icon-title"><Timer size={16} /> Queue &amp; Scheduler</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Queue worker and cron scheduler tuning. Changes apply from the next cycle — no restart. Blank fields fall back to .env, then application defaults.</p>
          <div className="form-grid">
            <label className="field"><span className="f-label">Queue Poll</span>
              <span className="input-affix"><input type="number" min={250} max={60000} className="f-input" value={qc.queuePollMs} placeholder={String(ac?.queue.effective.queuePollMs ?? 1000)} onChange={(event) => { setQc({ ...qc, queuePollMs: event.currentTarget.value }); cardMark('queue'); }} disabled={cardBusy('queue')} /><span>ms</span></span>
              <small className="field-hint">How often the worker looks for queued jobs (250–60000 ms).</small>
            </label>
            <label className="field"><span className="f-label">Job Lease</span>
              <span className="input-affix"><input type="number" min={15} max={300} className="f-input" value={qc.queueLeaseSeconds} placeholder={String(ac?.queue.effective.queueLeaseSeconds ?? 30)} onChange={(event) => { setQc({ ...qc, queueLeaseSeconds: event.currentTarget.value }); cardMark('queue'); }} disabled={cardBusy('queue')} /><span>s</span></span>
              <small className="field-hint">Claim lease per job; heartbeat renews at a third of this (15–300 s).</small>
            </label>
            <label className="field"><span className="f-label">Cron Scheduler</span>
              <span className="pt-switch">
                <input type="checkbox" role="switch" checked={qcCron} onChange={(event) => { setQcCron(event.currentTarget.checked); cardMark('queue'); }} disabled={cardBusy('queue')} />
                <span className="pt-switch-track" aria-hidden="true" />
                <span className="pt-switch-text">{qcCron ? 'Enabled' : 'Disabled'}</span>
              </span>
              <small className="field-hint">Dispatches due cron schedules; takes effect on the next tick.</small>
            </label>
            <label className="field"><span className="f-label">Cron Poll</span>
              <span className="input-affix"><input type="number" min={1000} max={300000} className="f-input" value={qc.cronPollMs} placeholder={String(ac?.queue.effective.cronPollMs ?? 60000)} onChange={(event) => { setQc({ ...qc, cronPollMs: event.currentTarget.value }); cardMark('queue'); }} disabled={cardBusy('queue')} /><span>ms</span></span>
              <small className="field-hint">Scheduler tick interval (1000–300000 ms).</small>
            </label>
            <label className="field"><span className="f-label">Cron Batch Size</span>
              <input type="number" min={1} max={100} className="f-input" value={qc.cronBatchSize} placeholder={String(ac?.queue.effective.cronBatchSize ?? 25)} onChange={(event) => { setQc({ ...qc, cronBatchSize: event.currentTarget.value }); cardMark('queue'); }} disabled={cardBusy('queue')} />
              <small className="field-hint">Max schedules dispatched per tick (1–100).</small>
            </label>
          </div>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={cardBusy('queue')}>{cardSaving === 'queue' ? 'Saving…' : 'Save Queue & Scheduler'}</button>
            {cardSaved === 'queue' ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-ghost-btn" type="button" disabled={cardBusy('queue')} onClick={() => void saveCard('queue', {})}>Reset to .env / defaults</button>
          </div>
          {cardError.queue ? <p role="alert">{cardError.queue}</p> : null}
        </div>
      </form>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCard('auth', numericPayload(au));
        }}
        aria-busy={cardBusy('auth')}
      >
        <div className="ph"><span className="icon-title"><Shield size={16} /> Authentication &amp; Sessions</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Session lifetime, login rate limiting, and the password-expiry warning. Blank fields fall back to .env, then application defaults. Existing sessions keep their original expiry.</p>
          <div className="form-grid">
            <label className="field"><span className="f-label">Session Lifetime</span>
              <span className="input-affix"><input type="number" min={1} max={168} className="f-input" value={au.sessionHours} placeholder={String(ac?.auth.effective.sessionHours ?? 12)} onChange={(event) => { setAu({ ...au, sessionHours: event.currentTarget.value }); cardMark('auth'); }} disabled={cardBusy('auth')} /><span>h</span></span>
              <small className="field-hint">Login session duration (1–168 hours).</small>
            </label>
            <label className="field"><span className="f-label">Rate-Limit Window</span>
              <span className="input-affix"><input type="number" min={1} max={3600} className="f-input" value={au.rateLimitWindowSeconds} placeholder={String(ac?.auth.effective.rateLimitWindowSeconds ?? 60)} onChange={(event) => { setAu({ ...au, rateLimitWindowSeconds: event.currentTarget.value }); cardMark('auth'); }} disabled={cardBusy('auth')} /><span>s</span></span>
              <small className="field-hint">Window for counting login attempts (1–3600 s).</small>
            </label>
            <label className="field"><span className="f-label">Max Login Attempts</span>
              <input type="number" min={1} max={1000} className="f-input" value={au.rateLimitMax} placeholder={String(ac?.auth.effective.rateLimitMax ?? 10)} onChange={(event) => { setAu({ ...au, rateLimitMax: event.currentTarget.value }); cardMark('auth'); }} disabled={cardBusy('auth')} />
              <small className="field-hint">Attempts allowed per window per address (1–1000).</small>
            </label>
            <label className="field"><span className="f-label">Expiry Warning</span>
              <span className="input-affix"><input type="number" min={0} max={365} className="f-input" value={au.passwordExpiryWarningDays} placeholder={String(ac?.auth.effective.passwordExpiryWarningDays ?? 30)} onChange={(event) => { setAu({ ...au, passwordExpiryWarningDays: event.currentTarget.value }); cardMark('auth'); }} disabled={cardBusy('auth')} /><span>days</span></span>
              <small className="field-hint">Days before password expiry to start warning (0–365).</small>
            </label>
          </div>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={cardBusy('auth')}>{cardSaving === 'auth' ? 'Saving…' : 'Save Authentication'}</button>
            {cardSaved === 'auth' ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-ghost-btn" type="button" disabled={cardBusy('auth')} onClick={() => void saveCard('auth', {})}>Reset to .env / defaults</button>
          </div>
          {cardError.auth ? <p role="alert">{cardError.auth}</p> : null}
        </div>
      </form>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCard('qase', { baseUrl: qsBaseUrl, apiToken: secretPayload(qsToken) });
        }}
        aria-busy={cardBusy('qase')}
      >
        <div className="ph"><span className="icon-title"><Link2 size={16} /> Qase Integration</span><span className="ph-meta">GLOBAL</span></div>
        <div className="panel-body pt-page-stack">
          <p className="page-subtitle">Qase API connection used by the test-case tools and the Qase proxy.</p>
          <div className="form-grid">
            <label className="field"><span className="f-label">Base URL</span>
              <input type="url" className="f-input" value={qsBaseUrl} placeholder={ac?.qase.baseUrl ?? 'https://api.qase.io/v1'} onChange={(event) => { setQsBaseUrl(event.currentTarget.value); cardMark('qase'); }} disabled={cardBusy('qase')} spellCheck={false} autoComplete="off" />
              <small className="field-hint">Must be https. Leave blank for the default.</small>
            </label>
            <SecretField label="API Token" state={qsToken} onChange={(next) => { setQsToken(next); cardMark('qase'); }} isSet={ac?.qase.apiTokenSet ?? false} disabled={cardBusy('qase')} hint={ac?.qase.apiTokenSet ? 'A token is available — leave blank to keep it.' : 'Requests without a token fall back to the browser-supplied token header.'} />
          </div>
          <small className="field-hint">{ac ? sourceText(ac.qase.source) : ''}</small>
          <div className="action-row">
            <button className="pt-primary-btn" type="submit" disabled={cardBusy('qase')}>{cardSaving === 'qase' ? 'Saving…' : 'Save Qase Integration'}</button>
            {cardSaved === 'qase' ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-ghost-btn" type="button" disabled={cardBusy('qase')} onClick={() => void saveCard('qase', { baseUrl: '', apiToken: null })}>Reset to .env / defaults</button>
          </div>
          {cardError.qase ? <p role="alert">{cardError.qase}</p> : null}
        </div>
      </form>

      <form className="panel" onSubmit={saveRuntimeDefaults} aria-busy={rdLoading || rdSaving}>
        <div className="ph"><span className="icon-title"><SlidersHorizontal size={16} /> Runtime Defaults</span><span className="ph-meta">PER PROJECT</span></div>
        <div className="panel-body pt-page-stack">
          <div className="form-grid">
            <label className="field"><span className="f-label">Project</span>
              <select className="f-input" value={rdProject} onChange={(event) => setRdProject(event.target.value)} disabled={rdLoading || rdSaving}>
                {!projects.length && <option value="">No projects available</option>}
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <small className="field-hint">Execute Test loads these defaults automatically when this project is selected. Empty fields fall back to the application defaults (shown as placeholders). Changing values in Execute Test never overwrites what is saved here.</small>
            </label>
          </div>

          <section className="rd-section">
            <h3 className="rd-section-title">Environment</h3>
            <p className="rd-section-desc">Execution environment and account dataset — options come from Helper/config.js, like Execute Test.</p>
            <div className="rd-grid-3">
              <label className="field"><span className="f-label">ENV_MODE</span>
                <select className="f-input" value={rdValues.ENV_MODE ?? ''} onChange={(event) => changeRd('ENV_MODE', event.target.value)} disabled={rdDisabled}>
                  <option value="">Application default (INT)</option>
                  {rdEnvOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="field"><span className="f-label">ACC</span>
                <select className="f-input" value={rdValues.ACC ?? ''} onChange={(event) => changeRd('ACC', event.target.value)} disabled={rdDisabled}>
                  <option value="">Application default (Regular)</option>
                  {/* Fixed user-facing labels; the stored values (REG/DT) match Execute Test. */}
                  <option value="REG">Regular</option>
                  <option value="DT">Daytrade</option>
                </select>
              </label>
              <label className="field"><span className="f-label">EXEC_TYPE</span>
                <select className="f-input" value={rdValues.EXEC_TYPE ?? ''} onChange={(event) => changeRd('EXEC_TYPE', event.target.value)} disabled={rdDisabled}>
                  <option value="">Application default (MANUAL)</option>
                  {EXEC_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="rd-section">
            <h3 className="rd-section-title">Script Target</h3>
            <p className="rd-section-desc">Platform and BP scenarios from the project&apos;s scripts — refreshed after a SYNC.</p>
            <div className="form-grid">
              <label className="field"><span className="f-label">TARGET_PLATFORM</span>
                <select className="f-input" value={rdValues.TARGET_PLATFORM ?? ''} onChange={(event) => changeRd('TARGET_PLATFORM', event.target.value)} disabled={rdDisabled}>
                  <option value="">Application default (WEB)</option>
                  {rdPlatformOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <label className="field"><span className="f-label">SCENARIO ({rdEffectivePlatform} BP scripts{rdScenarios.length ? ` — ${rdScenarios.length} selected` : ''})</span>
              <input
                type="search"
                className="f-input"
                placeholder="Search BP scenarios…"
                value={rdScenarioFilter}
                onChange={(event) => setRdScenarioFilter(event.target.value)}
                disabled={rdDisabled || !rdScenarioOptions.length}
              />
              <select
                className="f-input"
                multiple
                size={Math.min(8, Math.max(4, rdScenarioOptions.length))}
                value={rdScenarios}
                onChange={(event) => {
                  setRdScenarios([...event.currentTarget.selectedOptions].map((option) => option.value));
                  setRdSaved(false);
                }}
                disabled={rdDisabled || !rdScenarioOptions.length}
              >
                {rdScenarioOptions
                  .filter((token) => !rdScenarioFilter.trim() || token.toLowerCase().includes(rdScenarioFilter.trim().toLowerCase()))
                  .map((token) => <option key={token} value={token}>{token}</option>)}
              </select>
              <small className="field-hint">Multi-select; none selected = All BP. Filtering the list never clears an existing selection.</small>
            </label>
          </section>

          <section className="rd-section">
            <h3 className="rd-section-title">Runtime</h3>
            <p className="rd-section-desc">Load shape for scheduled defaults — same bounds as Execute Test.</p>
            <div className="rd-grid-3">
              <label className="field"><span className="f-label">VUS</span>
                <input type="number" min={1} max={5000} className="f-input" value={rdValues.VUS ?? ''} placeholder="335" onChange={(event) => changeRd('VUS', event.currentTarget.value)} disabled={rdDisabled} />
              </label>
              <label className="field"><span className="f-label">DURATION</span>
                <input type="text" pattern="[1-9][0-9]{0,5}[smh]" className="f-input" value={rdValues.DURATION ?? ''} placeholder="5m" onChange={(event) => changeRd('DURATION', event.currentTarget.value)} disabled={rdDisabled} spellCheck={false} autoComplete="off" />
              </label>
              <label className="field"><span className="f-label">NUMSTART</span>
                <input type="number" min={0} max={5000} className="f-input" value={rdValues.NUMSTART ?? ''} placeholder="1" onChange={(event) => changeRd('NUMSTART', event.currentTarget.value)} disabled={rdDisabled} />
              </label>
            </div>
          </section>

          <section className="rd-section">
            <h3 className="rd-section-title">Custom Variables</h3>
            <p className="rd-section-desc">Extra runtime variables passed to the run, in entry order.</p>
            <CustomVarsEditor vars={rdVars} onChange={(next) => { setRdVars(next); setRdSaved(false); }} disabled={rdDisabled} />
          </section>

          {rdError ? <p role="alert" className="text-crit">{rdError}</p> : null}
          <div className="rd-actions">
            {rdSaved ? <span className="pill ok">SAVED</span> : null}
            <button className="pt-primary-btn" type="submit" disabled={rdLoading || rdSaving || !rdProject}>{rdSaving ? 'Saving…' : 'Save Runtime Defaults'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};
