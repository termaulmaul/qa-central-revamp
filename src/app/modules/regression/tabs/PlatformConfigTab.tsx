"use client";

import { useState, type FormEvent } from "react";
import { Layers, Plus, RefreshCw, Settings, X } from "lucide-react";
import { createPlatformApi, updatePlatformApi } from "../api";
import type { RegressionPlatform } from "../types";
import { isSelectablePlatform, type PlatformConfigFields } from "../types";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  formatDateTime,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "../ui";

interface PlatformConfigTabProps {
  platforms: RegressionPlatform[];
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}

function parseFields(config: Record<string, unknown>): PlatformConfigFields {
  return {
    qaseProjectCode: typeof config.qaseProjectCode === "string" ? config.qaseProjectCode : "",
    qaseRunId: typeof config.qaseRunId === "string" ? config.qaseRunId : "",
    jenkinsJob: typeof config.jenkinsJob === "string" ? config.jenkinsJob : "",
    maxConcurrent: typeof config.maxConcurrent === "number" ? config.maxConcurrent : 1,
    devices: Array.isArray(config.devices) ? (config.devices as unknown[]).map(String) : [],
  };
}

function buildConfig(base: Record<string, unknown>, fields: PlatformConfigFields, devicesText: string): Record<string, unknown> {
  const devices = devicesText
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  return {
    ...base,
    qaseProjectCode: fields.qaseProjectCode?.trim() || undefined,
    qaseRunId: fields.qaseRunId?.trim() || undefined,
    jenkinsJob: fields.jenkinsJob?.trim() || undefined,
    maxConcurrent: fields.maxConcurrent && fields.maxConcurrent > 0 ? fields.maxConcurrent : undefined,
    devices: devices.length > 0 ? devices : undefined,
  };
}

function PlatformFieldsForm({
  fields,
  devicesText,
  onChange,
  onDevicesChange,
  disabled,
}: {
  fields: PlatformConfigFields;
  devicesText: string;
  onChange: (fields: PlatformConfigFields) => void;
  onDevicesChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Qase project code</span>
        <input
          className={inputClass}
          value={fields.qaseProjectCode ?? ""}
          onChange={(e) => onChange({ ...fields, qaseProjectCode: e.target.value })}
          placeholder="e.g. GM"
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Qase run ID</span>
        <input
          className={inputClass}
          value={fields.qaseRunId ?? ""}
          onChange={(e) => onChange({ ...fields, qaseRunId: e.target.value })}
          placeholder="e.g. 42"
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Jenkins job</span>
        <input
          className={inputClass}
          value={fields.jenkinsJob ?? ""}
          onChange={(e) => onChange({ ...fields, jenkinsJob: e.target.value })}
          placeholder="e.g. regression-android-invest"
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Max concurrent</span>
        <input
          type="number"
          min={1}
          max={20}
          className={inputClass}
          value={fields.maxConcurrent ?? 1}
          onChange={(e) => onChange({ ...fields, maxConcurrent: Number(e.target.value) })}
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Device pool (comma-separated, priority order)</span>
        <input
          className={inputClass}
          value={devicesText}
          onChange={(e) => onDevicesChange(e.target.value)}
          placeholder="iphone14, iphone13mini"
          disabled={disabled}
        />
      </label>
    </div>
  );
}

export function PlatformConfigTab({ platforms, loading, error, onReload }: PlatformConfigTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<PlatformConfigFields>({ maxConcurrent: 1 });
  const [devicesText, setDevicesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<PlatformConfigFields>({});
  const [editDevicesText, setEditDevicesText] = useState("");
  const [editError, setEditError] = useState("");

  const selectable = platforms.filter(isSelectablePlatform);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required");
      return;
    }

    setSaving(true);
    try {
      await createPlatformApi(trimmedName, buildConfig({}, fields, devicesText));
      setName("");
      setFields({ maxConcurrent: 1 });
      setDevicesText("");
      setShowForm(false);
      await onReload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to create platform");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (platform: RegressionPlatform) => {
    const parsed = parseFields(platform.config);
    setEditingId(platform.id);
    setEditFields(parsed);
    setEditDevicesText((parsed.devices ?? []).join(", "));
    setEditError("");
  };

  const saveEdit = async (platform: RegressionPlatform) => {
    setEditError("");
    setSaving(true);
    try {
      await updatePlatformApi(platform.id, { config: buildConfig(platform.config, editFields, editDevicesText) });
      setEditingId(null);
      await onReload();
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : "Unable to save platform");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Platform Config</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Platforms that regression runs target — Qase project/run, Jenkins job, concurrency, and device pool.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={ghostButtonClass} onClick={() => void onReload()} disabled={loading}>
            <RefreshCw className="size-4" aria-hidden="true" /> Refresh
          </button>
          <button type="button" className={primaryButtonClass} onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" aria-hidden="true" /> New Platform
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <Card>
          <CardHeader title="New Platform" />
          <form className="flex flex-col gap-4 p-4" onSubmit={submit}>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Name</span>
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Android Invest"
                disabled={saving}
              />
            </label>
            <PlatformFieldsForm fields={fields} devicesText={devicesText} onChange={setFields} onDevicesChange={setDevicesText} disabled={saving} />
            {formError && <ErrorBanner message={formError} />}
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButtonClass} onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={primaryButtonClass} disabled={saving}>
                {saving ? "Saving…" : "Create Platform"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {selectable.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectable.map((platform) => {
            const parsed = parseFields(platform.config);
            const isEditing = editingId === platform.id;
            return (
              <Card key={platform.id} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Layers className="size-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{platform.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    onClick={() => (isEditing ? setEditingId(null) : openEdit(platform))}
                  >
                    {isEditing ? <X className="size-3.5" aria-hidden="true" /> : <Settings className="size-3.5" aria-hidden="true" />}
                    {isEditing ? "Close" : "Edit"}
                  </button>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <PlatformFieldsForm
                      fields={editFields}
                      devicesText={editDevicesText}
                      onChange={setEditFields}
                      onDevicesChange={setEditDevicesText}
                      disabled={saving}
                    />
                    {editError && <ErrorBanner message={editError} />}
                    <div className="flex justify-end">
                      <button type="button" className={primaryButtonClass} onClick={() => void saveEdit(platform)} disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <dt className="font-semibold text-zinc-400 dark:text-zinc-500">Qase</dt>
                    <dd className="truncate">{parsed.qaseProjectCode ? `${parsed.qaseProjectCode}-${parsed.qaseRunId || "?"}` : "—"}</dd>
                    <dt className="font-semibold text-zinc-400 dark:text-zinc-500">Jenkins</dt>
                    <dd className="truncate">{parsed.jenkinsJob || "—"}</dd>
                    <dt className="font-semibold text-zinc-400 dark:text-zinc-500">Max</dt>
                    <dd>{parsed.maxConcurrent ?? 1} concurrent</dd>
                    {parsed.devices && parsed.devices.length > 0 && (
                      <>
                        <dt className="font-semibold text-zinc-400 dark:text-zinc-500">Devices</dt>
                        <dd>{parsed.devices.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                )}
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Created {formatDateTime(platform.createdAt)}</p>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && selectable.length === 0 && !error && (
        <Card>
          <EmptyState>No platforms configured yet. Create one to start scheduling regression runs.</EmptyState>
        </Card>
      )}
      {loading && selectable.length === 0 && (
        <Card>
          <EmptyState>Loading platforms…</EmptyState>
        </Card>
      )}
    </div>
  );
}
