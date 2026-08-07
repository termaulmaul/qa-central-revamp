import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getProjectId, setProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';
import { type RepositoryListing, EXEC_TYPES, availableEnvModes, bpTokensOf } from '../components/Content';
import { CustomVarsEditor, type CustomVar } from '../components/CustomVarsEditor';
import { ChevronDown, Loader, Settings2, PlayCircle, PlusCircle, CheckCircle, Clock } from 'lucide-react';

interface ProjectOption {
  id: string;
  name: string;
}

const RUN_PLATFORMS = ['WEB', 'API', 'ANDROID', 'IOS'] as const;
type RunPlatform = typeof RUN_PLATFORMS[number];

const platformForScript = (script: string, fallback: string): RunPlatform => {
  const nextPlatform = script.split('/')[1]?.toUpperCase();
  return RUN_PLATFORMS.find((value) => value === nextPlatform) ?? fallback as RunPlatform;
};

const ExecuteTestContent = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const [projectId, setProjectContextId] = useState(() => getProjectId() ?? 'default');
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [listing, setListing] = useState<RepositoryListing[]>([]);
  const [scripts, setScripts] = useState<string[]>([]);
  const [repository, setRepository] = useState('');
  const [script, setScript] = useState('');
  const [target, setTarget] = useState('Oncloud');
  const [environment, setEnvironment] = useState('INT');
  const [envModes, setEnvModes] = useState<string[]>([]);
  const [stgProd, setStgProd] = useState(false);
  const [execType, setExecType] = useState<string>('MANUAL');
  const [platform, setPlatform] = useState('WEB');
  const [vus, setVus] = useState(335);
  const [duration, setDuration] = useState('5m');
  const [numStart, setNumStart] = useState(1);
  // Selected BP scenario: 'ALL' runs every BP, a BP token (e.g. 'BP001') runs
  // only that one. Kept as a token so it maps straight to the k6 SCENARIO env.
  const [scenario, setScenario] = useState('ALL');
  // ACC selects the account dataset (a key of ACCOUNT_CONFIG in config.js).
  // The UI offers Regular (REG) and Daytrade (DT); Regular is the default.
  const [acc, setAcc] = useState('REG');
  // Custom runtime variables (pt-framework's customVars): free rows of
  // name/value, entry order preserved; empty-name rows are ignored at submit.
  const [customVars, setCustomVars] = useState<Array<{ key: string; value: string }>>([]);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batching, setBatching] = useState(false);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const requestId = useRef(0);

  // Default script pick: prefer the .js entry point when a repository offers
  // both .js and .sh; users can still switch to a .sh runner manually.
  const preferredScript = (candidates: string[]): string =>
    candidates.find((value) => value.toLowerCase().endsWith('.js')) ?? candidates[0] ?? '';

  const loadScripts = useCallback(async () => {
    const id = ++requestId.current;
    setLoadingScripts(true);
    setError('');
    try {
      const response = await fetch(`/api/scripts/listing?projectId=${encodeURIComponent(projectId)}`, {
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({})) as { repositories?: unknown; envModes?: unknown; accModes?: unknown; error?: string };
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error(body.error ?? 'Unable to load scripts');
      setEnvModes(Array.isArray(body.envModes)
        ? body.envModes.filter((value): value is string => typeof value === 'string')
        : []);
      const nextListing = Array.isArray(body.repositories)
        ? body.repositories.filter((value): value is RepositoryListing => {
          const repo = value as { name?: unknown; scripts?: unknown } | null;
          return typeof repo?.name === 'string' && Array.isArray(repo.scripts);
        })
        : [];
      const nextScripts = nextListing.flatMap((repo) =>
        repo.scripts.filter((value): value is string => typeof value === 'string'));
      setListing(nextListing);
      setScripts(nextScripts);
      setRepository((current) => nextListing.some((repo) => repo.name === current) ? current : nextListing[0]?.name ?? '');
      setScript((current) => {
        if (nextScripts.includes(current)) return current;
        // Same fallback repository as before (the listing's first); prefer its
        // .js entry point over the .sh runners.
        const repoScripts = nextScripts.filter((value) => value.startsWith(`${nextListing[0]?.name ?? ''}/`));
        return preferredScript(repoScripts.length ? repoScripts : nextScripts);
      });
    } catch (cause) {
      if (id !== requestId.current) return;
      setListing([]);
      setScripts([]);
      setRepository('');
      setScript('');
      setError(cause instanceof Error ? cause.message : 'Unable to load scripts');
    } finally {
      if (id === requestId.current) setLoadingScripts(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadScripts();
    return () => { ++requestId.current; };
  }, [loadScripts]);

  // Load the active project's configured RUNTIME_CFG defaults whenever the
  // project changes; any field the project leaves unset falls back to the
  // application default. Edits made on this page affect only the current
  // execution — saved defaults change only via Settings.
  const defaultsRequestId = useRef(0);
  useEffect(() => {
    const id = ++defaultsRequestId.current;
    void (async () => {
      let defaults: Record<string, unknown> = {};
      try {
        const response = await fetch(`/api/settings/runtime-defaults?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include' });
        if (response.ok) {
          const body = await response.json().catch(() => ({})) as { defaults?: Record<string, unknown> | null };
          if (body.defaults && typeof body.defaults === 'object') defaults = body.defaults;
        }
      } catch { /* fall through to the application defaults */ }
      if (id !== defaultsRequestId.current) return;
      const str = (key: string, fallback: string) =>
        typeof defaults[key] === 'string' && defaults[key] ? defaults[key] as string : fallback;
      const int = (key: string, fallback: number) =>
        typeof defaults[key] === 'number' && Number.isInteger(defaults[key]) ? defaults[key] as number : fallback;

      const nextEnv = str('ENV_MODE', 'INT');
      if (new Set(['STG', 'PRD', 'PROD']).has(nextEnv)) setStgProd(true);
      setEnvironment(nextEnv);
      // Applied as saved (platform values are repo-cased, e.g. 'Web'); the
      // snap-to-options effect below corrects anything the listing no longer
      // offers, so nothing is hardcoded here.
      setPlatform(str('TARGET_PLATFORM', 'WEB'));
      setAcc(str('ACC', 'REG'));
      const nextExec = str('EXEC_TYPE', 'MANUAL').toUpperCase();
      setExecType(EXEC_TYPES.some((value) => value === nextExec) ? nextExec : 'MANUAL');
      setVus(int('VUS', 335));
      setDuration(str('DURATION', '5m'));
      setNumStart(int('NUMSTART', 1));
      // SCENARIO defaults are stored as a token list; this page's control is a
      // single select, so exactly one saved token preselects it — anything
      // else means All BP. The token-validity guard below re-checks it once
      // the listing arrives.
      const savedScenarios = Array.isArray(defaults.SCENARIO)
        ? (defaults.SCENARIO as unknown[]).filter((value): value is string => typeof value === 'string')
        : [];
      setScenario(savedScenarios.length === 1 ? savedScenarios[0] : 'ALL');
      const savedVars = Array.isArray(defaults.CUSTOM_VARS)
        ? (defaults.CUSTOM_VARS as unknown[]).flatMap((row) => {
          const candidate = row as { key?: unknown; value?: unknown } | null;
          return typeof candidate?.key === 'string' && typeof candidate?.value === 'string'
            ? [{ key: candidate.key, value: candidate.value }]
            : [];
        })
        : [];
      setCustomVars(savedVars);
    })();
  }, [projectId]);

  // Same data source as the Projects page: /api/projects (active projects).
  const optionsRequestId = useRef(0);
  const loadProjectOptions = useCallback(async () => {
    const id = ++optionsRequestId.current;
    try {
      const response = await fetch('/api/projects', { credentials: 'include' });
      if (!response.ok) return;
      const body = await response.json().catch(() => ({})) as { projects?: unknown };
      if (id !== optionsRequestId.current) return;
      const nextOptions = Array.isArray(body.projects)
        ? body.projects
          .filter((value): value is { id: string; name?: unknown } =>
            typeof (value as { id?: unknown } | null)?.id === 'string')
          .map((value) => ({ id: value.id, name: typeof value.name === 'string' && value.name ? value.name : value.id }))
        : [];
      setProjectOptions(nextOptions);
    } catch {
      // Keep the previous options; the current project id stays selectable.
    }
  }, []);

  useEffect(() => {
    void loadProjectOptions();
    return () => { ++optionsRequestId.current; };
  }, [loadProjectOptions]);

  useEffect(() => {
    const updateProject = () => {
      // The Projects page fires this event on create/archive/delete/select, so
      // refresh the options even when the selected project id is unchanged.
      void loadProjectOptions();
      const nextProjectId = getProjectId() ?? 'default';
      if (nextProjectId === projectId) return;
      ++requestId.current;
      setSyncing(false);
      setProjectContextId(nextProjectId);
    };
    window.addEventListener(PROJECT_CONTEXT_EVENT, updateProject);
    return () => window.removeEventListener(PROJECT_CONTEXT_EVENT, updateProject);
  }, [projectId, loadProjectOptions]);

  const selectScript = (nextScript: string) => {
    setScript(nextScript);
    const nextPlatform = nextScript.split('/')[1]?.toUpperCase();
    if (nextPlatform && RUN_PLATFORMS.some((value) => value === nextPlatform)) setPlatform(nextPlatform);
  };

  const syncScripts = async () => {
    const id = ++requestId.current;
    setSyncing(true);
    setStatus('');
    setError('');
    try {
      const response = await fetch('/api/sync-scripts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string; files?: string[] };
      if (id !== requestId.current) return;
      if (!response.ok) {
        // Show the real reason plus the exact conflicting files when the server
        // reports them, so the user knows what blocked the sync.
        const detail = body.files?.length ? `${body.error ?? 'Script synchronization failed'}: ${body.files.join(', ')}` : body.error;
        throw new Error(detail ?? 'Script synchronization failed');
      }
      setStatus(body.message ?? 'Scripts synchronized');
      setSyncing(false);
      void loadScripts();
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : 'Script synchronization failed');
    } finally {
      if (id === requestId.current) setSyncing(false);
    }
  };

  const validate = (requireScript = true): string | null => {
    if (requireScript && !script) return 'Select a script';
    if (!Number.isInteger(vus) || vus < 1 || vus > 5_000) return 'Max VUs must be between 1 and 5000';
    if (!Number.isInteger(numStart) || numStart < 0 || numStart > vus) return 'Initial VUs must be between 0 and Max VUs';
    if (!/^[1-9]\d{0,5}[smh]$/.test(duration)) return 'Duration must use seconds, minutes, or hours, for example 30s or 5m';
    const names = new Set<string>();
    for (const variable of customVars) {
      const name = variable.key.trim();
      if (!name && !variable.value) continue; // fully empty rows are ignored
      if (!name) return 'Custom variable names must not be empty';
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name)) {
        return `Custom variable name "${name}" must be letters, digits, and underscores`;
      }
      if (names.has(name)) return `Duplicate custom variable name: ${name}`;
      names.add(name);
    }
    return null;
  };

  // Rows with a name, trimmed, in entry order — what actually ships with the
  // run (pt-framework filters the same way on submit).
  const submittedVars = () => customVars
    .map((variable) => ({ key: variable.key.trim(), value: variable.value }))
    .filter((variable) => variable.key);

  const queueTest = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setStatus('');
    setError('');
    try {
      // Both ONCLOUD and ONPREM enqueue onto the same performance queue; the
      // worker runs ONPREM over SSH. On success the user is taken to the queue.
      const response = await fetch('/api/queue/job', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          script,
          target,
          config: {
            env: environment,
            runby: 'MANUAL',
            platform,
            vus,
            duration,
            scenario,
            numStart,
            baseUrl: '',
            acc,
            customVars: submittedVars(),
          },
        }),
      });
      const body = await response.json().catch(() => ({})) as { jobId?: string; position?: number; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Unable to queue test');
      setStatus(`Queued job ${body.jobId ?? ''} at position ${body.position ?? 1}`.trim());
      onNavigate('pt-queue');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to queue test');
    } finally {
      setSubmitting(false);
    }
  };

  const queueBatchRegression = async () => {
    const validationError = validate(false);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBatching(true);
    setStatus('');
    setError('');
    let queued = 0;
    let skipped = 0;
    let failed = 0;
    try {
      const suffix = `?projectId=${encodeURIComponent(projectId)}`;
      const snapshotResponse = await fetch(`/api/queue${suffix}`, { credentials: 'include' });
      const snapshot = await snapshotResponse.json() as {
        error?: string;
        current?: { script?: string };
        queue: Array<{ script?: string }>;
      };
      if (!snapshotResponse.ok) throw new Error(snapshot.error ?? 'Unable to load queue');
      const occupied = new Set([
        snapshot.current?.script,
        ...snapshot.queue.map((job: { script?: string }) => job.script),
      ].filter((value): value is string => Boolean(value)));
      for (const regressionScript of regressionScripts) {
        if (occupied.has(regressionScript)) {
          skipped++;
          continue;
        }
        try {
          const response = await fetch('/api/queue/job', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              script: regressionScript,
              target,
              config: {
                env: environment,
                runby: 'MANUAL',
                platform: platformForScript(regressionScript, platform),
                vus,
                duration,
                scenario: 'ALL',
                numStart,
                baseUrl: '',
                acc,
                customVars: submittedVars(),
              },
            }),
          });
          const body = await response.json().catch(() => ({})) as { error?: string };
          if (!response.ok) throw new Error(body.error ?? 'Unable to queue test');
          occupied.add(regressionScript);
          queued++;
        } catch {
          failed++;
        }
      }
      setStatus(`Batch regression: ${queued} queued, ${skipped} skipped, ${failed} failed`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to queue batch regression');
    } finally {
      setBatching(false);
    }
  };

  const repositories = listing.map((repo) => repo.name);
  const activeRepository = listing.find((repo) => repo.name === repository);
  const repositoryScripts = activeRepository?.scripts ?? [];
  const regressionScripts = scripts.filter((value) => /(?:^|\/)regression[^/]*\.js$/i.test(value));
  const platformOptions = activeRepository?.platforms ?? [];
  const bpTokens = useMemo(() => bpTokensOf(
    listing.find((repo) => repo.name === repository)?.scenarios?.[platform] ?? [],
  ), [listing, repository, platform]);
  const envOptions = availableEnvModes(envModes, stgProd);

  useEffect(() => {
    const options = availableEnvModes(envModes, stgProd);
    if (options.length && !options.includes(environment)) {
      setEnvironment(options.includes('INT') ? 'INT' : options[0]);
    }
  }, [envModes, stgProd, environment]);

  useEffect(() => {
    const options = listing.find((repo) => repo.name === repository)?.platforms ?? [];
    if (options.length && !options.includes(platform)) setPlatform(options[0]);
  }, [listing, repository, platform]);

  // Drop a selected BP scenario back to 'ALL' when it is no longer offered for
  // the current repo/platform, so a stale token is never submitted. Skipped
  // while the listing loads — a project's saved SCENARIO default is applied
  // before the tokens arrive and must not be wiped by the empty interim list.
  useEffect(() => {
    if (loadingScripts) return;
    if (scenario !== 'ALL' && !bpTokens.includes(scenario)) setScenario('ALL');
  }, [scenario, bpTokens, loadingScripts]);

  // Custom vars surface as -e flags, exactly as pt-framework's preview does.
  const accFlag = acc ? ` -e ACC=${acc}` : '';
  const customFlags = customVars
    .filter((variable) => variable.key.trim())
    .map((variable) => ` -e ${variable.key.trim()}=${variable.value}`)
    .join('');
  const commandPreview = script
    ? `k6 run --vus ${vus} --duration ${duration}${accFlag}${customFlags} ${script}`
    : 'select a script first...';

  return (
    <div className="pt-page-stack">
      <div>
        <p className="eyebrow">Action</p>
        <h1 className="page-title">Execute Performance Test</h1>
        <p className="page-subtitle">Configure and run load tests manually, track execution status, and sync scripts.</p>
      </div>
      

      <div className="panel">
        <div className="ph"><h3>Test Target</h3></div>
        <div className="panel-body flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <label className="block flex-1">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Project Metric ID</span>
              <select
                aria-label="Project"
                className="pt-input"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                {!projectOptions.some((option) => option.id === projectId) && (
                  <option value={projectId}>{projectId}</option>
                )}
                {projectOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>

            <label className="block flex-1">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Git Repository</span>
              <select aria-label="Repository" value={repository} className="pt-input" disabled={loadingScripts} onChange={(event) => {
                const nextRepository = event.target.value;
                setRepository(nextRepository);
                selectScript(preferredScript(scripts.filter((value) => value.startsWith(`${nextRepository}/`))));
              }}>
                {repositories.length === 0 && <option value="">SELECT REPOSITORY...</option>}
                {repositories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>

            <label className="block flex-1">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Target Script</span>
              <select aria-label="Script" value={script} className="pt-input" disabled={loadingScripts || !repositoryScripts.length} onChange={(event) => selectScript(event.target.value)}>
                {repositoryScripts.length === 0 && <option value="">SELECT REPO FIRST...</option>}
                {repositoryScripts.map((value) => <option key={value} value={value}>{value.slice(repository.length + 1)}</option>)}
              </select>
            </label>

            <div className="flex items-end">
              <button type="button" className="pt-ghost-btn h-[38px] w-full md:w-auto px-4" onClick={() => void syncScripts()} disabled={syncing || loadingScripts}>
                ⟳ {syncing ? 'SYNCING…' : 'SYNC'}
              </button>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target Node</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className={`flex flex-col p-4 border rounded-xl transition-colors text-left ${target === 'Onprem' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`} type="button" aria-pressed={target === 'Onprem'} onClick={() => setTarget('Onprem')}>
                <strong className="text-sm font-semibold mb-1">ONPREM</strong>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">LOCAL BAREMETAL</span>
              </button>
              <button className={`flex flex-col p-4 border rounded-xl transition-colors text-left ${target === 'Oncloud' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`} type="button" aria-pressed={target === 'Oncloud'} onClick={() => setTarget('Oncloud')}>
                <strong className="text-sm font-semibold mb-1">ONCLOUD</strong>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">DISTRIBUTED AWS/GCP</span>
              </button>
              <div className="flex flex-col p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl justify-center items-center text-center">
                <strong className="text-sm font-semibold mb-1">{(repository || projectId).toUpperCase()}</strong>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{loadingScripts ? 'LOADING SCRIPTS…' : `${scripts.length} SCRIPTS AVAILABLE`}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-live" aria-live="polite">
          {status && <p className="pt-status" role="status">{status}</p>}
          {error && <p className="pt-error" role="alert">{error}</p>}
        </div>
      </div>

      <div className="panel">
        <div className="ph"><h3>Runtime Configuration</h3></div>
        {/* Field order (2-col grid, left→right/top→bottom): ENV_MODE,
            TARGET_PLATFORM, SCENARIO, ACC, EXEC_TYPE, VUS, DURATION, NUMSTART.
            Layout/order only — every field's binding, options, and handlers are
            unchanged. */}
        <div className="panel-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">ENV_MODE
              <button
                type="button"
                className={`pt-tag pt-tag-toggle${stgProd ? ' on' : ''}`}
                aria-pressed={stgProd}
                onClick={() => setStgProd((value) => !value)}
              >
                ● STG/PRD {stgProd ? 'ON' : 'OFF'}
              </button>
            </span>
            <select value={environment} onChange={(event) => setEnvironment(event.target.value)} className="pt-input">
              {envOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">TARGET_PLATFORM</span>
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="pt-input">
              {platformOptions.length === 0 && <option value={platform}>{platform}</option>}
              {platformOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">SCENARIO<em className="pt-tag">{platform} BP SCRIPTS</em></span>
            <select
              className="pt-input"
              aria-label="Scenario"
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
            >
              <option value="ALL">All BP</option>
              {bpTokens.map((token) => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </label>
          {/* BASE_URL_OVERRIDE is hidden from the UI: its value is fixed
              ("Managed by environment") and users cannot change it. The backend
              still processes config.baseUrl exactly as before; the submit paths
              continue to send baseUrl: '' unchanged. */}
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">ACC<em className="pt-tag">ACCOUNT_DATASET</em></span>
            <select
              className="pt-input"
              aria-label="Account dataset"
              value={acc}
              onChange={(event) => setAcc(event.target.value)}
            >
              {/* Fixed user-facing labels; the internal ACC values sent to the
                  backend (REG/DT) are unchanged and never shown to the user. */}
              <option value="REG">Regular</option>
              <option value="DT">Daytrade</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">EXEC_TYPE</span>
            <select value={execType} onChange={(event) => setExecType(event.target.value)} className="pt-input">
              {EXEC_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">VUS</span>
            <input type="number" min={1} max={5000} value={vus} onChange={(event) => setVus(Number(event.target.value))} className="pt-input" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">DURATION</span>
            <input type="text" value={duration} onChange={(event) => setDuration(event.target.value)} pattern="[1-9][0-9]{0,5}[smh]" placeholder="5m" className="pt-input" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">NUMSTART</span>
            <input type="number" min={0} max={vus} value={numStart} onChange={(event) => setNumStart(Number(event.target.value))} className="pt-input" />
          </label>
        </div>
        {/* Custom Variables — shared editor (also used by Settings → Runtime
            Defaults): free rows of VARIABLE_NAME/value in entry order,
            removable, plus New Variable. */}
        <CustomVarsEditor vars={customVars} onChange={setCustomVars} />
      </div>

      <div className="panel">
        <div className="ph"><h3>Command Preview</h3></div>
        <div className="panel-body">
          <pre className="bg-zinc-950 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">&gt; {commandPreview}</pre>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 mt-2">
        <button className="pt-ghost-btn" type="button" disabled={loadingScripts || batching || !regressionScripts.length} onClick={() => void queueBatchRegression()}>{batching ? 'QUEUEING…' : 'BATCH REGRESSION'}</button>
        <button className="pt-primary-btn" type="button" disabled={loadingScripts || submitting || batching || !script} onClick={() => void queueTest()}>{submitting ? 'QUEUEING…' : '▶ QUEUE TEST'}</button>
      </div>
    </div>
  );
};

export const Overview = ExecuteTestContent;
