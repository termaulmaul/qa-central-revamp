"use client";

import { useMemo, useState } from "react";
import { Check, FolderOpen, Layers, Loader2, PlayCircle, Search, X } from "lucide-react";
import {
  cardClass,
  enqueueApiAutomationJob,
  EnvironmentGapNotice,
  ErrorBanner,
  ghostButtonClass,
  inputClass,
  labelClass,
  monoClass,
  noteClass,
  primaryButtonClass,
  qaseGet,
  useApiAutomationSettings,
} from "../api-automation-shared";

type InputType = "case" | "suite" | "testrun" | "browse";
type RunMode = "RUN_ONLY" | "RUN_AND_HEAL";
type Env = "dev" | "qa";

const TABS: { value: InputType; label: string; Icon: typeof PlayCircle }[] = [
  { value: "case", label: "Single Case", Icon: PlayCircle },
  { value: "suite", label: "Suite", Icon: Layers },
  { value: "testrun", label: "Test Run", Icon: Check },
  { value: "browse", label: "Browse Files", Icon: FolderOpen },
];

const ENV_OPTS: { value: Env; label: string; url: string }[] = [
  { value: "qa", label: "QA", url: "api-qa.growin.id" },
  { value: "dev", label: "Dev", url: "api-dev.growin.id" },
];

interface QaseCase {
  id: number;
  title: string;
  automation?: string;
  suite_id?: number;
}

interface QaseListResponse {
  result?: { entities?: QaseCase[] };
}

interface QaseRunResponse {
  result?: { id: number; title?: string; cases?: number[] };
}

interface QaseSuiteResponse {
  result?: { id: number; title?: string };
}

interface QueuedRun {
  jobId: string;
  label: string;
}

function automationChip(automation: string | undefined) {
  if (automation === "automated") {
    return {
      label: "automated",
      cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    };
  }
  if (automation === "to-be-automated") {
    return {
      label: "to automate",
      cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }
  return {
    label: "manual",
    cls: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  };
}

export function RunView() {
  const { settings, ready } = useApiAutomationSettings();
  const [tab, setTab] = useState<InputType>("case");
  const [inputId, setInputId] = useState("");
  const [mode, setMode] = useState<RunMode>("RUN_ONLY");
  const [env, setEnv] = useState<Env>("qa");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");

  const [runTitle, setRunTitle] = useState("");
  const [preview, setPreview] = useState<QaseCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [queued, setQueued] = useState<QueuedRun[]>([]);

  const projectCode = settings.projectCode.trim();
  const configured = Boolean(settings.qaseToken && projectCode);
  const activeEnv = ENV_OPTS.find((option) => option.value === env)!;

  const listCases = async (query: string) => {
    const body = await qaseGet<QaseListResponse>(`case/${encodeURIComponent(projectCode)}?limit=100&${query}`, settings.qaseToken);
    return body.result?.entities ?? [];
  };

  const runQueued = async (label: string, config: Record<string, unknown>) => {
    const { jobId } = await enqueueApiAutomationJob(`api-automation/${projectCode}/${label}`, {
      mode,
      environment: env,
      environmentUrl: activeEnv.url,
      ...config,
    });
    setQueued((prev) => [{ jobId, label }, ...prev]);
  };

  const handleRunCase = async () => {
    const clean = inputId.replace(/^AT-/i, "").trim();
    if (!clean) return;
    setBusy(true);
    setError("");
    try {
      const body = await qaseGet<{ result?: QaseCase }>(
        `case/${encodeURIComponent(projectCode)}/${encodeURIComponent(clean)}`,
        settings.qaseToken,
      );
      const found = body.result;
      if (!found) throw new Error(`Case ${clean} not found in ${projectCode}`);
      await runQueued(`case-${found.id}`, { caseId: found.id, caseTitle: found.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue this case");
    } finally {
      setBusy(false);
    }
  };

  const handleRunSuite = async () => {
    const clean = inputId.replace(/^AT-/i, "").trim();
    if (!clean) return;
    setBusy(true);
    setError("");
    try {
      const suite = await qaseGet<QaseSuiteResponse>(
        `suite/${encodeURIComponent(projectCode)}/${encodeURIComponent(clean)}`,
        settings.qaseToken,
      );
      if (!suite.result) throw new Error(`Suite ${clean} not found in ${projectCode}`);
      const cases = await listCases(`suite_id=${encodeURIComponent(clean)}`);
      if (cases.length === 0) throw new Error(`Suite ${clean} has no cases`);
      await runQueued(`suite-${clean}`, {
        suiteId: Number(clean),
        suiteTitle: suite.result.title,
        caseIds: cases.map((item) => item.id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue this suite");
    } finally {
      setBusy(false);
    }
  };

  const handlePreviewRun = async () => {
    const clean = inputId.trim();
    if (!clean) return;
    setPreviewing(true);
    setError("");
    try {
      const run = await qaseGet<QaseRunResponse>(
        `run/${encodeURIComponent(projectCode)}/${encodeURIComponent(clean)}`,
        settings.qaseToken,
      );
      if (!run.result) throw new Error(`Test run ${clean} not found in ${projectCode}`);
      const caseIds = new Set(run.result.cases ?? []);
      const all = await listCases("");
      const cases = all.filter((item) => caseIds.has(item.id));
      setRunTitle(run.result.title ?? `Run #${clean}`);
      setPreview(cases);
      setSelectedIds(new Set(cases.filter((item) => item.automation === "automated").map((item) => item.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview this test run");
    } finally {
      setPreviewing(false);
    }
  };

  const handleRunTestRun = async () => {
    if (selectedIds.size === 0) return;
    setBusy(true);
    setError("");
    try {
      await runQueued(`testrun-${inputId.trim()}`, {
        runId: Number(inputId.trim()),
        runTitle,
        caseIds: [...selectedIds],
      });
      setPreview([]);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue this test run");
    } finally {
      setBusy(false);
    }
  };

  const automatedCount = useMemo(() => preview.filter((item) => item.automation === "automated").length, [preview]);

  const idLabel = tab === "testrun" ? "Test Run ID" : tab === "suite" ? "Suite ID" : "Qase ID";
  const idPlaceholder = tab === "testrun" ? "e.g. 123" : tab === "suite" ? "e.g. 42" : "AT-3006 or 3006";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Execute existing test specs without re-generating.</p>

      <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {ready && !configured && tab !== "browse" && (
        <div className={noteClass}>
          Set a Qase token and project code on the Settings page first — this page resolves cases, suites and test runs
          through the app&apos;s Qase proxy.
        </div>
      )}

      {tab === "browse" ? (
        // Ceiling: the reference scans the runner's checkout for generated spec
        // files (GET /api/factory/api/jobs/scan-files). There is no runner
        // filesystem behind this app. Upgrade path: expose a spec-listing route
        // (the shape /api/scripts/listing already uses) once specs are stored here.
        <EnvironmentGapNotice title="Not available in this environment">
          Browsing generated spec files reads the AI Factory runner&apos;s working copy over its{" "}
          <code className={monoClass}>scan-files</code> API. No runner filesystem is attached to this app, so there is
          nothing to list — use the Single Case, Suite or Test Run tabs, which resolve real entities from Qase.
        </EnvironmentGapNotice>
      ) : (
        <div className={`${cardClass} flex flex-col gap-4`}>
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem_8rem]">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>{idLabel}</span>
              <input
                className={inputClass}
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder={idPlaceholder}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (tab === "case") void handleRunCase();
                  else if (tab === "suite") void handleRunSuite();
                  else void handlePreviewRun();
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Mode</span>
              <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as RunMode)}>
                <option value="RUN_ONLY">Run Only</option>
                <option value="RUN_AND_HEAL">Run + Heal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Environment</span>
              <select className={inputClass} value={env} onChange={(e) => setEnv(e.target.value as Env)}>
                {ENV_OPTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hitting: <span className={monoClass}>{activeEnv.url}</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {tab === "case" && (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => void handleRunCase()}
                disabled={!inputId.trim() || !configured || busy}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PlayCircle className="size-4" aria-hidden="true" />
                )}
                Run Test
              </button>
            )}
            {tab === "suite" && (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => void handleRunSuite()}
                disabled={!inputId.trim() || !configured || busy}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Layers className="size-4" aria-hidden="true" />
                )}
                Run Suite
              </button>
            )}
            {tab === "testrun" && preview.length === 0 && (
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => void handlePreviewRun()}
                disabled={!inputId.trim() || !configured || previewing}
              >
                {previewing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                Preview Run
              </button>
            )}
          </div>
        </div>
      )}

      <ErrorBanner message={error} />

      {tab === "testrun" && preview.length > 0 && (
        <div className={`${cardClass} flex flex-col gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{runTitle}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {preview.length} cases · {automatedCount} marked automated in Qase
              </p>
            </div>
            <button type="button" className={ghostButtonClass} onClick={() => setPreview([])}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setSelectedIds(new Set(preview.filter((c) => c.automation === "automated").map((c) => c.id)))}
            >
              Automated
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setSelectedIds(new Set(preview.map((c) => c.id)))}>
              Select All
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setSelectedIds(new Set())}>
              None
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            {preview.map((item) => {
              const checked = selectedIds.has(item.id);
              const chip = automationChip(item.automation);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2 text-left last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                    }`}
                  >
                    {checked && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className={`${monoClass} shrink-0`}>AT-{item.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">{item.title}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${chip.cls}`}>{chip.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${primaryButtonClass} self-start`}
            onClick={() => void handleRunTestRun()}
            disabled={selectedIds.size === 0 || busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle className="size-4" aria-hidden="true" />
            )}
            Run {selectedIds.size} case{selectedIds.size !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {queued.length > 0 && (
        <div className={`${cardClass} flex flex-col gap-2`}>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Queued this session</p>
          {/* Ceiling: live per-job status/log streaming and the combined HTML report
              come from the AI Factory job socket, which does not exist here. Runs
              are enqueued on this app's real shared queue instead, so the Dashboard
              and History pages track them. Upgrade path: attach a queue worker. */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enqueued on the shared run queue and tagged for this module. Live per-case log streaming and the combined HTML
            report need the AI Factory runner, which is not attached here — follow progress on the Dashboard and History
            pages.
          </p>
          <ul className="flex flex-col gap-1">
            {queued.map((item) => (
              <li key={item.jobId} className="flex items-center gap-2 text-sm">
                <span className={monoClass}>{item.label}</span>
                <span className="text-zinc-400 dark:text-zinc-500">·</span>
                <span className={monoClass}>{item.jobId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
