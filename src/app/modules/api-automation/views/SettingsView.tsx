"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  useApiAutomationSettings,
  type StoredSettings,
} from "../api-automation-shared";

export function SettingsView() {
  const { settings, ready, persist } = useApiAutomationSettings();
  const [form, setForm] = useState<StoredSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  return (
    <form
      className={`${cardClass} flex flex-col gap-4`}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        persist(form);
        setSaved(true);
      }}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Credentials are stored only in this browser (localStorage), never sent anywhere except directly to Qase and your
        configured LLM endpoint via this app&apos;s existing proxies.
      </p>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Qase API token</span>
        <input
          className={inputClass}
          type="password"
          value={form.qaseToken}
          onChange={(e) => setForm({ ...form, qaseToken: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Default Qase project code</span>
        <input
          className={inputClass}
          value={form.projectCode}
          onChange={(e) => setForm({ ...form, projectCode: e.target.value })}
          placeholder="DEMO"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>LLM base URL (OpenAI-compatible /chat/completions)</span>
        <input
          className={inputClass}
          value={form.llmBaseUrl}
          onChange={(e) => setForm({ ...form, llmBaseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>LLM API token</span>
        <input
          className={inputClass}
          type="password"
          value={form.llmApiToken}
          onChange={(e) => setForm({ ...form, llmApiToken: e.target.value })}
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className={primaryButtonClass} disabled={!ready}>
          Save settings
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" aria-hidden="true" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
