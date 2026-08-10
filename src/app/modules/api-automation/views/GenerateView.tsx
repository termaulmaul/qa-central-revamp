"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  cardClass,
  enqueueApiAutomationJob,
  ErrorBanner,
  inputClass,
  labelClass,
  primaryButtonClass,
  useApiAutomationSettings,
} from "../api-automation-shared";

export function GenerateView() {
  const { settings } = useApiAutomationSettings();
  const [feature, setFeature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const [queued, setQueued] = useState("");

  const generate = async () => {
    if (!settings.llmBaseUrl || !settings.llmApiToken) {
      setError("Set an LLM base URL and API token in Settings first.");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const response = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: settings.llmBaseUrl,
          apiToken: settings.llmApiToken,
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You generate concise API test case suggestions (title, steps, expected result) for a QA test management system. Respond as a short bulleted list.",
            },
            { role: "user", content: `Generate API test cases for this feature:\n\n${feature}` },
          ],
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Generation failed");
      const content = body.choices?.[0]?.message?.content ?? JSON.stringify(body);
      setOutput(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const queueRun = async () => {
    setError("");
    setQueued("");
    try {
      // config.kind === "api-automation" is what the Dashboard/History views
      // filter this module's jobs by; the shared queue itself is untyped jsonb.
      const { jobId } = await enqueueApiAutomationJob(`api-automation/${settings.projectCode || "generated"}`, { feature });
      setQueued(`Queued as job ${jobId} — it now shows on the Dashboard page.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to queue the job");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Feature / endpoint description</span>
          <textarea
            className={`${inputClass} min-h-24`}
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            placeholder="POST /orders — creates a new order for a given instrument and quantity…"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => void generate()}
            disabled={loading || !feature.trim()}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {loading ? "Generating…" : "Generate test cases"}
          </button>
          <button type="button" className={primaryButtonClass} onClick={() => void queueRun()} disabled={!feature.trim()}>
            Queue as job
          </button>
        </div>
        {queued && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{queued}</p>}
      </div>

      <ErrorBanner message={error} />

      {output && (
        <div className={cardClass}>
          <pre className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{output}</pre>
        </div>
      )}
    </div>
  );
}
