import type { RegressionFailure, RegressionPlatform, RegressionRun, RegressionSchedule } from "./types";

async function asJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  throw new Error(typeof body?.error === "string" ? body.error : `Request failed (${response.status})`);
}

export async function fetchPlatforms(): Promise<RegressionPlatform[]> {
  const data = await fetch("/api/regression/platforms", { credentials: "include" }).then((res) =>
    asJson<{ platforms: RegressionPlatform[] }>(res),
  );
  return data.platforms;
}

export async function createPlatformApi(name: string, config: Record<string, unknown>): Promise<RegressionPlatform> {
  const data = await fetch("/api/regression/platforms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, config }),
  }).then((res) => asJson<{ platform: RegressionPlatform }>(res));
  return data.platform;
}

export async function updatePlatformApi(
  id: string,
  patch: { name?: string; config?: Record<string, unknown> },
): Promise<RegressionPlatform> {
  const data = await fetch(`/api/regression/platforms/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  }).then((res) => asJson<{ platform: RegressionPlatform }>(res));
  return data.platform;
}

export async function fetchRuns(platformId?: string): Promise<RegressionRun[]> {
  const qs = platformId ? `?platformId=${encodeURIComponent(platformId)}` : "";
  const data = await fetch(`/api/regression/runs${qs}`, { credentials: "include" }).then((res) =>
    asJson<{ runs: RegressionRun[] }>(res),
  );
  return data.runs;
}

export async function createRunApi(platformId: string, summary?: Record<string, unknown>): Promise<RegressionRun> {
  const data = await fetch("/api/regression/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ platformId, summary }),
  }).then((res) => asJson<{ run: RegressionRun }>(res));
  return data.run;
}

export async function updateRunSummaryApi(id: string, patch: Record<string, unknown>): Promise<RegressionRun> {
  const data = await fetch(`/api/regression/runs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ summary: patch }),
  }).then((res) => asJson<{ run: RegressionRun }>(res));
  return data.run;
}

export async function finishRunApi(id: string, status: string, summary?: Record<string, unknown>): Promise<RegressionRun> {
  const data = await fetch(`/api/regression/runs/${encodeURIComponent(id)}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, summary }),
  }).then((res) => asJson<{ run: RegressionRun }>(res));
  return data.run;
}

export async function fetchFailures(runId: string): Promise<RegressionFailure[]> {
  const data = await fetch(`/api/regression/runs/${encodeURIComponent(runId)}/failures`, {
    credentials: "include",
  }).then((res) => asJson<{ failures: RegressionFailure[] }>(res));
  return data.failures;
}

export async function recordFailureApi(
  runId: string,
  testName: string,
  classification: string | null,
  details: Record<string, unknown>,
): Promise<RegressionFailure> {
  const data = await fetch(`/api/regression/runs/${encodeURIComponent(runId)}/failures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ testName, classification, details }),
  }).then((res) => asJson<{ failure: RegressionFailure }>(res));
  return data.failure;
}

export async function fetchSchedules(): Promise<RegressionSchedule[]> {
  const data = await fetch("/api/regression/schedules", { credentials: "include" }).then((res) =>
    asJson<{ schedules: RegressionSchedule[] }>(res),
  );
  return data.schedules;
}

export async function createScheduleApi(input: {
  name: string;
  cronExpr: string;
  platformId?: string;
  enabled?: boolean;
}): Promise<RegressionSchedule> {
  const data = await fetch("/api/regression/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  }).then((res) => asJson<{ schedule: RegressionSchedule }>(res));
  return data.schedule;
}

export async function deleteScheduleApi(id: string): Promise<void> {
  await fetch(`/api/regression/schedules/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => asJson<{ ok: true }>(res));
}

export interface QaseCaseSummary {
  id: string;
  title: string;
  suiteTitle?: string;
  automation?: string;
  status?: string;
}

export async function fetchQaseCasesApi(token: string, projectCode: string): Promise<QaseCaseSummary[]> {
  const data = await fetch("/api/regression/qase-cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, projectCode }),
  }).then((res) => asJson<{ cases: QaseCaseSummary[] }>(res));
  return data.cases;
}

export async function fetchTradingHoursApi(): Promise<Record<string, unknown> | null> {
  const data = await fetch("/api/regression/trading-hours", { credentials: "include" }).then((res) =>
    asJson<{ config: Record<string, unknown> | null }>(res),
  );
  return data.config;
}

export async function saveTradingHoursApi(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const data = await fetch("/api/regression/trading-hours", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ config }),
  }).then((res) => asJson<{ config: Record<string, unknown> }>(res));
  return data.config;
}
