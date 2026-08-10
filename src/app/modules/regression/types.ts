export interface RegressionPlatform {
  id: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface RegressionRun {
  id: string;
  platformId: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  summary: Record<string, unknown>;
  createdAt: string;
}

export interface RegressionFailure {
  id: string;
  runId: string | null;
  testName: string;
  classification: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface RegressionSchedule {
  id: string;
  name: string;
  cronExpr: string;
  platformId: string | null;
  enabled: boolean;
  createdAt: string;
}

// Qase write-back and Teams notifications from the reference implementation are
// out of scope (external system side effects). The AI-driven failure classifier
// is also out of scope (depends on external log-parsing infra) — a small fixed
// set of classification options is offered instead.
export const CLASSIFICATION_OPTIONS = ["flaky", "regression", "environment", "unknown"] as const;
export type ClassificationOption = (typeof CLASSIFICATION_OPTIONS)[number];

export const RUN_FINISH_STATUSES = ["passed", "failed", "cancelled"] as const;
export type RunFinishStatus = (typeof RUN_FINISH_STATUSES)[number];

// Sentinel platform name used to store global Trading Hours config in the platforms table
// (no dedicated table — see repo's regression-repo.ts). Filtered out of every normal platform
// picker (Platform Config list, Test Runs tabs, Generate Run modal, etc).
export const TRADING_HOURS_PLATFORM_NAME = "__trading_hours__";

export function isSelectablePlatform(platform: { name: string }): boolean {
  return platform.name !== TRADING_HOURS_PLATFORM_NAME;
}

// Structured fields the new Platform Config UI edits inside `RegressionPlatform.config`.
// Free-form keys are still allowed (config stays a JSON blob) — these are just the ones
// carried over from the reference implementation's PlatformConfig.tsx that are worth a
// dedicated form field instead of raw JSON editing.
export interface PlatformConfigFields {
  qaseProjectCode?: string;
  qaseRunId?: string;
  jenkinsJob?: string;
  maxConcurrent?: number;
  devices?: string[];
}

// A single case pulled onto a run's summary, either typed manually in Generate Run or
// fetched on-demand from Qase (see RunCasesExplorerTab / GenerateRunModal).
export interface RegressionRunCase {
  id: string;
  title: string;
  suiteTitle?: string;
  automation?: string;
  status?: string;
}

export const TRADING_HOURS_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type TradingHoursDay = (typeof TRADING_HOURS_DAYS)[number];

export interface TradingHoursConfig {
  days: TradingHoursDay[];
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  timezone: string;
}

export const DEFAULT_TRADING_HOURS: TradingHoursConfig = {
  days: ["mon", "tue", "wed", "thu", "fri"],
  startTime: "09:00",
  endTime: "16:00",
  timezone: "Asia/Jakarta",
};
