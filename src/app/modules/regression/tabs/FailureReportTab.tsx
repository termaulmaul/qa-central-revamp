"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { fetchFailures, recordFailureApi } from "../api";
import { CLASSIFICATION_OPTIONS, type RegressionRun } from "../types";
import { Card, CardHeader, EmptyState, ErrorBanner, formatDateTime, ghostButtonClass, inputClass, labelClass, Pill, primaryButtonClass } from "../ui";
import type { RegressionFailure } from "../types";

interface FailureReportTabProps {
  runs: RegressionRun[];
  selectedRunId: string | null;
  onSelectRun: (runId: string | null) => void;
}

const CLASSIFICATION_TONE: Record<string, "err" | "warn" | "info" | "neutral"> = {
  regression: "err",
  flaky: "warn",
  environment: "info",
  unknown: "neutral",
};

// Reference implementation groups failures by trading-session type. This module has no
// session concept, so failures are grouped by classification instead — the same
// lightweight taxonomy already used for the record-failure dropdown.
function FailureGroup({ classification, failures, defaultOpen }: { classification: string; failures: RegressionFailure[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  const tone = CLASSIFICATION_TONE[classification] ?? "neutral";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-zinc-50 px-4 py-2 text-left dark:bg-zinc-900/60"
      >
        {open ? <ChevronDown className="size-4 text-zinc-400" aria-hidden="true" /> : <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />}
        <Pill tone={tone}>{classification}</Pill>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{failures.length} case(s)</span>
      </button>
      {open && (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {failures.map((failure) => (
            <div key={failure.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{failure.testName}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDateTime(failure.createdAt)}</span>
              </div>
              {Object.keys(failure.details).length > 0 && (
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  {JSON.stringify(failure.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FailureReportTab({ runs, selectedRunId, onSelectRun }: FailureReportTabProps) {
  const [failures, setFailures] = useState<RegressionFailure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testName, setTestName] = useState("");
  const [classification, setClassification] = useState<string>(CLASSIFICATION_OPTIONS[0]);
  const [detailsText, setDetailsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  useEffect(() => {
    if (!selectedRunId && runs.length > 0) onSelectRun(runs[0].id);
  }, [runs, selectedRunId, onSelectRun]);

  const load = useCallback(async () => {
    if (!selectedRunId) {
      setFailures([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setFailures(await fetchFailures(selectedRunId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load failures");
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!selectedRunId) {
      setFormError("Select a run first");
      return;
    }
    const trimmedName = testName.trim();
    if (!trimmedName) {
      setFormError("Test name is required");
      return;
    }

    let details: Record<string, unknown> = {};
    if (detailsText.trim()) {
      try {
        details = JSON.parse(detailsText) as Record<string, unknown>;
      } catch {
        details = { note: detailsText.trim() };
      }
    }

    setSaving(true);
    try {
      await recordFailureApi(selectedRunId, trimmedName, classification, details);
      setTestName("");
      setDetailsText("");
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to record failure");
    } finally {
      setSaving(false);
    }
  };

  const grouped = failures.reduce<Record<string, RegressionFailure[]>>((acc, failure) => {
    const key = failure.classification ?? "unclassified";
    (acc[key] ??= []).push(failure);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Failure Report</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Per-run failure log grouped by classification.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className={`${inputClass} w-auto`} value={selectedRunId ?? ""} onChange={(event) => onSelectRun(event.target.value || null)}>
            <option value="">Select a run…</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.id.slice(0, 8)} · {run.status}
              </option>
            ))}
          </select>
          <button type="button" className={ghostButtonClass} onClick={() => void load()} disabled={!selectedRunId || loading}>
            <RefreshCw className="size-4" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {!selectedRunId ? (
        <Card>
          <EmptyState>Select a run above to view or record failures.</EmptyState>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Record Failure" />
            <form className="flex flex-col gap-4 p-4" onSubmit={submit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Test name</span>
                  <input
                    className={inputClass}
                    value={testName}
                    onChange={(event) => setTestName(event.target.value)}
                    placeholder="e.g. login.should_reject_invalid_password"
                    disabled={saving}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Classification</span>
                  <select className={inputClass} value={classification} onChange={(event) => setClassification(event.target.value)} disabled={saving}>
                    {CLASSIFICATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Details (JSON or free text, optional)</span>
                <textarea
                  className={`${inputClass} min-h-20 font-mono text-xs`}
                  value={detailsText}
                  onChange={(event) => setDetailsText(event.target.value)}
                  placeholder='{"error": "Timeout waiting for element"}'
                  disabled={saving}
                />
              </label>
              {formError && <ErrorBanner message={formError} />}
              <div className="flex justify-end">
                <button type="submit" className={primaryButtonClass} disabled={saving}>
                  <Plus className="size-4" aria-hidden="true" />
                  {saving ? "Recording…" : "Record Failure"}
                </button>
              </div>
            </form>
          </Card>

          {failures.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {Object.entries(grouped).map(([key, list]) => (
                  <Pill key={key} tone={CLASSIFICATION_TONE[key] ?? "neutral"}>
                    {key} · {list.length}
                  </Pill>
                ))}
              </div>
              <button type="button" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400" onClick={() => setExpandAll((v) => !v)}>
                {expandAll ? "Collapse all" : "Expand all"}
              </button>
            </div>
          )}

          {failures.length === 0 ? (
            <Card>
              <EmptyState>{loading ? "Loading failures…" : "No failures recorded for this run."}</EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(grouped).map(([key, list]) => (
                <FailureGroup key={key} classification={key} failures={list} defaultOpen={expandAll} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
