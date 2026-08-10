"use client";

import { useState } from "react";
import { CloudDownload, Loader2, Play, Trash2, X } from "lucide-react";
import { createRunApi, fetchQaseCasesApi, type QaseCaseSummary } from "../api";
import type { RegressionPlatform, RegressionRunCase } from "../types";
import { Card, ErrorBanner, ghostButtonClass, inputClass, labelClass, primaryButtonClass } from "../ui";

// Same localStorage settings key/shape convention as api-automation's Knowledge tab —
// a single shared Qase token stored client-side, never sent anywhere except to this
// module's own server routes (which forward it directly to api.qase.io).
const SETTINGS_KEY = "regression.qaseSettings";

interface QaseSettings {
  token: string;
}

export function loadQaseSettings(): QaseSettings {
  if (typeof window === "undefined") return { token: "" };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as QaseSettings) : { token: "" };
  } catch {
    return { token: "" };
  }
}

export function saveQaseSettings(settings: QaseSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface GenerateRunModalProps {
  platform: RegressionPlatform;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export function GenerateRunModal({ platform, onClose, onCreated }: GenerateRunModalProps) {
  const qaseProjectCode = typeof platform.config.qaseProjectCode === "string" ? platform.config.qaseProjectCode : "";

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [manualCaseText, setManualCaseText] = useState("");
  const [qaseToken, setQaseToken] = useState(() => loadQaseSettings().token);
  const [fetchedCases, setFetchedCases] = useState<QaseCaseSummary[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const manualCases: RegressionRunCase[] = manualCaseText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => ({ id: `manual-${i}`, title: line }));

  const fetchFromQase = async () => {
    if (!qaseToken.trim() || !qaseProjectCode) return;
    setFetching(true);
    setFetchError("");
    try {
      saveQaseSettings({ token: qaseToken.trim() });
      const cases = await fetchQaseCasesApi(qaseToken.trim(), qaseProjectCode);
      setFetchedCases(cases);
    } catch (cause) {
      setFetchError(cause instanceof Error ? cause.message : "Unable to fetch Qase cases");
    } finally {
      setFetching(false);
    }
  };

  const removeFetched = (id: string) => setFetchedCases((prev) => prev.filter((c) => c.id !== id));

  const create = async () => {
    setCreateError("");
    setCreating(true);
    try {
      const cases: RegressionRunCase[] = [
        ...manualCases,
        ...fetchedCases.map((c) => ({ id: c.id, title: c.title, suiteTitle: c.suiteTitle, automation: c.automation, status: c.status })),
      ];
      const summary: Record<string, unknown> = {
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
        cases,
      };
      await createRunApi(platform.id, summary);
      await onCreated();
      onClose();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Unable to create run");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={creating ? undefined : onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Generate Run</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Platform: <span className="font-medium text-blue-600 dark:text-blue-400">{platform.name}</span>
            </p>
          </div>
          <button type="button" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" onClick={onClose} disabled={creating}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Run name</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nightly regression 8 Aug" disabled={creating} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Notes (optional)</span>
            <textarea className={`${inputClass} min-h-16`} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={creating} />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>Manual case list (one per line, optional)</span>
            <textarea
              className={`${inputClass} min-h-20 font-mono text-xs`}
              value={manualCaseText}
              onChange={(e) => setManualCaseText(e.target.value)}
              placeholder="login.should_reject_invalid_password"
              disabled={creating}
            />
          </label>

          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={labelClass}>Fetch cases from Qase (on-demand, no auto-sync)</span>
            </div>
            {!qaseProjectCode ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Set a Qase project code in this platform&apos;s config first (Platform Config tab).
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    className={`${inputClass} flex-1`}
                    value={qaseToken}
                    onChange={(e) => setQaseToken(e.target.value)}
                    placeholder="Qase API token"
                    disabled={fetching}
                  />
                  <button type="button" className={ghostButtonClass} onClick={() => void fetchFromQase()} disabled={fetching || !qaseToken.trim()}>
                    {fetching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CloudDownload className="size-4" aria-hidden="true" />}
                    {fetching ? "Fetching…" : `Fetch ${qaseProjectCode}`}
                  </button>
                </div>
                {fetchError && <ErrorBanner message={fetchError} />}
                {fetchedCases.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {fetchedCases.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 border-b border-zinc-100 px-2 py-1 text-xs last:border-b-0 dark:border-zinc-800">
                        <span className="font-mono text-zinc-400">#{c.id}</span>
                        <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{c.title}</span>
                        <button type="button" onClick={() => removeFetched(c.id)} className="text-zinc-400 hover:text-rose-600">
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {(manualCases.length > 0 || fetchedCases.length > 0) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {manualCases.length + fetchedCases.length} case(s) will be attached to this run.
            </p>
          )}

          {createError && <ErrorBanner message={createError} />}

          <div className="flex justify-end gap-2">
            <button type="button" className={ghostButtonClass} onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button type="button" className={primaryButtonClass} onClick={() => void create()} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              {creating ? "Creating…" : "Create Run"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
