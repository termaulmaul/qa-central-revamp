"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

/** The one non-mock Configuration page: reads/writes /api/settings/connections. */
export function ConnectionsView() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/connections");
      const body = (await response.json().catch(() => null)) as { dashboardPublicUrl?: string; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Unable to load connections settings");
      setValue(body?.dashboardPublicUrl ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load connections settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardPublicUrl: value }),
      });
      const body = (await response.json().catch(() => null)) as { dashboardPublicUrl?: string; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Unable to save connections settings");
      setValue(body?.dashboardPublicUrl ?? "");
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save connections settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <p className="max-w-2xl text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        The public base URL this app is reachable at, used for remote callback URLs (e.g. Jenkins webhooks).
      </p>

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Dashboard Public URL</span>
          <input
            type="url"
            value={value}
            onChange={(event) => { setValue(event.currentTarget.value); setSaved(false); }}
            placeholder="https://qa-central.example.com"
            disabled={loading || saving}
            spellCheck={false}
            autoComplete="off"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Used to build remote callback URLs. Leave empty if this deployment has no public URL yet.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved ? <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Saved</span> : null}
      </div>
    </form>
  );
}
