"use client";

import { useMemo, useState } from "react";
import { CloudDownload, Loader2, RefreshCw, Search } from "lucide-react";
import { fetchQaseCasesApi, updateRunSummaryApi } from "../api";
import type { RegressionPlatform, RegressionRun, RegressionRunCase } from "../types";
import { Card, EmptyState, ErrorBanner, ghostButtonClass, inputClass, Pill } from "../ui";
import { loadQaseSettings, saveQaseSettings } from "./GenerateRunModal";

interface RunCasesExplorerTabProps {
  runs: RegressionRun[];
  platforms: RegressionPlatform[];
  selectedRunId: string | null;
  onSelectRun: (runId: string | null) => void;
  onReload: () => Promise<void>;
}

export function RunCasesExplorerTab({ runs, platforms, selectedRunId, onSelectRun, onReload }: RunCasesExplorerTabProps) {
  const [search, setSearch] = useState("");
  const [qaseToken, setQaseToken] = useState(() => loadQaseSettings().token);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const run = runs.find((r) => r.id === selectedRunId) ?? null;
  const platform = platforms.find((p) => p.id === run?.platformId) ?? null;
  const qaseProjectCode = typeof platform?.config.qaseProjectCode === "string" ? platform.config.qaseProjectCode : "";

  const cases: RegressionRunCase[] = useMemo(() => {
    if (!run || !Array.isArray(run.summary.cases)) return [];
    return run.summary.cases as RegressionRunCase[];
  }, [run]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) => c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || (c.suiteTitle ?? "").toLowerCase().includes(q));
  }, [cases, search]);

  const refetchFromQase = async () => {
    if (!run || !qaseToken.trim() || !qaseProjectCode) return;
    setFetching(true);
    setFetchError("");
    try {
      saveQaseSettings({ token: qaseToken.trim() });
      const fetched = await fetchQaseCasesApi(qaseToken.trim(), qaseProjectCode);
      await updateRunSummaryApi(run.id, { cases: fetched });
      await onReload();
    } catch (cause) {
      setFetchError(cause instanceof Error ? cause.message : "Unable to fetch Qase cases");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Run Cases Explorer</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Cases attached to a run&apos;s summary — manual entries plus anything fetched from Qase.</p>
        </div>
        <select className={`${inputClass} w-auto`} value={selectedRunId ?? ""} onChange={(e) => onSelectRun(e.target.value || null)}>
          <option value="">Select a run…</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id.slice(0, 8)} · {r.status}
            </option>
          ))}
        </select>
      </div>

      {!run ? (
        <Card>
          <EmptyState>Select a run above to explore its cases.</EmptyState>
        </Card>
      ) : (
        <>
          {qaseProjectCode && (
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  className={`${inputClass} max-w-xs`}
                  value={qaseToken}
                  onChange={(e) => setQaseToken(e.target.value)}
                  placeholder="Qase API token"
                  disabled={fetching}
                />
                <button type="button" className={ghostButtonClass} onClick={() => void refetchFromQase()} disabled={fetching || !qaseToken.trim()}>
                  {fetching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CloudDownload className="size-4" aria-hidden="true" />}
                  {fetching ? "Fetching…" : `Re-fetch from Qase (${qaseProjectCode})`}
                </button>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">Replaces this run&apos;s case list with the current Qase project cases.</span>
              </div>
              {fetchError && (
                <div className="mt-2">
                  <ErrorBanner message={fetchError} />
                </div>
              )}
            </Card>
          )}

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case ID, title, or suite…" />
          </div>

          <Card>
            {filtered.length === 0 ? (
              <EmptyState>{cases.length === 0 ? "No cases attached to this run yet." : "No cases match your search."}</EmptyState>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filtered.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">#{c.id}</span>
                    <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200">{c.title}</span>
                    {c.suiteTitle && <span className="text-xs text-zinc-400 dark:text-zinc-500">{c.suiteTitle}</span>}
                    {c.automation && <Pill tone="info">{c.automation}</Pill>}
                    {c.status && <Pill tone="neutral">{c.status}</Pill>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {cases.length} total case(s) on this run.
          </div>
        </>
      )}
    </div>
  );
}
