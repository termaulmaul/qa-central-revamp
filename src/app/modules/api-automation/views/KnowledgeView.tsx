"use client";

import { useState } from "react";
import { Loader2, Network } from "lucide-react";
import {
  cardClass,
  ErrorBanner,
  noteClass,
  primaryButtonClass,
  useApiAutomationSettings,
} from "../api-automation-shared";

interface KnowledgeResult {
  project: { title: string; code: string };
  suiteCount: number;
  caseCount: number;
  recommendations: Array<{ type: string; description: string; priority: string }>;
}

export function KnowledgeView() {
  const { settings, ready } = useApiAutomationSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<KnowledgeResult | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/api-automation/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: settings.qaseToken, projectCode: settings.projectCode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Knowledge analysis failed");
      setResult(body as KnowledgeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Knowledge analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (ready && (!settings.qaseToken || !settings.projectCode)) {
    return <div className={noteClass}>Set a Qase token and project code on the Settings page first.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <button type="button" className={primaryButtonClass} onClick={() => void analyze()} disabled={loading || !ready}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Network className="size-4" aria-hidden="true" />
          )}
          {loading ? "Analyzing…" : `Analyze ${settings.projectCode}`}
        </button>
      </div>

      <ErrorBanner message={error} />

      {result && (
        <div className={cardClass}>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {result.project.title} — {result.suiteCount} suites, {result.caseCount} cases
          </h3>
          {result.recommendations.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No recommendations — coverage looks healthy.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <span className="mr-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                    {rec.priority}
                  </span>
                  {rec.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
