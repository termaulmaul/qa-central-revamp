// Execution-timing helpers for the running-job Live Progress panel.
// Kept in a standalone module (not the component file) so the pure logic is
// unit-testable and importable without tripping react-refresh's
// "only export components" rule.

// Parse a k6-style duration ("5m", "90s", "1h30m", "500ms", or a bare number of
// seconds) into milliseconds. Returns 0 when it cannot be parsed.
export function parseDurationMs(d: string | undefined): number {
  if (!d) return 0;
  const text = d.trim();
  let ms = 0;
  let matched = '';
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    const n = parseFloat(m[1]);
    matched += m[0];
    if (m[2] === 'ms') ms += n;
    else if (m[2] === 'h') ms += n * 3_600_000;
    else if (m[2] === 'm') ms += n * 60_000;
    else ms += n * 1000;
  }
  if (matched === text && matched) return Math.round(ms);
  const seconds = Number(text);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

// --- k6 log progress parsing (ported from pt-framework's RunProgress) ---
// k6 prints its own progress ("running (2m30.0s/5m0s), ... 412 complete") only
// once the actual test scenario runs — never during setup(). Driving REMAINING
// and the percentage from this (rather than wall-clock) means a job grinding
// through a slow k6 setup() correctly shows 0% / full-duration instead of
// falsely reading 100%.
// eslint-disable-next-line no-control-regex -- strips ANSI colour codes from k6 output
const ANSI_RE = /\[[0-9;]*m/g;
const SETUP_DONE_RE = /setup\s+(complete|completed|done|finished)/i;
const SETUP_SEEN_RE = /\bsetup\b/i;
const DURATION_TOKEN = String.raw`(?:\d+(?:\.\d+)?(?:ms|h|m|s))+`;
const K6_RATIO_RE = new RegExp(`\\b(${DURATION_TOKEN})\\s*/\\s*(${DURATION_TOKEN})\\b`, 'i');
const K6_RUNNING_RE = /running\s+\(([^)]+)\).*?(\d+)\s+complete/i;

interface K6Timing { elapsedMs: number; durationMs: number; iters: number }

function parseLineTiming(line: string): K6Timing | null {
  const ratio = line.match(K6_RATIO_RE);
  if (ratio) {
    return { elapsedMs: parseDurationMs(ratio[1]), durationMs: parseDurationMs(ratio[2]), iters: 0 };
  }
  const running = line.match(K6_RUNNING_RE);
  if (!running) return null;
  return { elapsedMs: parseDurationMs(running[1]), durationMs: 0, iters: parseInt(running[2], 10) };
}

export interface K6Progress {
  hasTiming: boolean;
  elapsedMs: number;
  durationMs: number;
  iters: number;
  rps: number;
}

// Parse the newest k6 progress timing out of the live log. If a "setup complete"
// marker was seen, only timings after it count (so a progress line printed
// during setup is ignored). hasTiming stays false while still in setup.
export function parseK6Progress(logText: string): K6Progress {
  let sawSetup = false;
  let sawSetupDone = false;
  let latest: K6Timing | null = null;
  let latestRatio: K6Timing | null = null;
  let latestAfterSetup: K6Timing | null = null;
  let latestRatioAfterSetup: K6Timing | null = null;
  let rps = 0;

  for (const raw of logText.split(/\r?\n/)) {
    for (const part of raw.split('\r')) {
      const line = part.replace(ANSI_RE, '');
      if (SETUP_SEEN_RE.test(line)) sawSetup = true;
      if (SETUP_DONE_RE.test(line)) sawSetupDone = true;

      const timing = parseLineTiming(line);
      if (timing) {
        latest = timing;
        if (timing.durationMs > 0) latestRatio = timing;
        if (sawSetupDone) {
          latestAfterSetup = timing;
          if (timing.durationMs > 0) latestRatioAfterSetup = timing;
        }
      }

      const mRps = line.match(/http_reqs[.\s]+:\s*\d+\s+([\d.]+)\/s/);
      if (mRps) rps = parseFloat(mRps[1]);
    }
  }

  const timing = sawSetup ? latestRatioAfterSetup ?? latestAfterSetup : latestRatio ?? latest;
  return {
    hasTiming: Boolean(timing),
    elapsedMs: timing?.elapsedMs ?? 0,
    durationMs: timing?.durationMs ?? 0,
    iters: timing?.iters ?? 0,
    rps,
  };
}

export interface RunTiming {
  hasStarted: boolean;
  elapsedMs: number;
  hasTestStarted: boolean;
  remainingMs: number;
  percent: number;
  durationMs: number;
  iters: number;
  rps: number;
}

// Pure timing computation. ELAPSED is wall-clock from execution start (setup
// included). REMAINING and the percentage are driven by k6's OWN reported
// progress (parsed from the live log): they advance only once the actual test
// scenario is running, so during k6's setup() phase they show the full duration
// and 0%. Falls back to the configured DURATION when no live progress is
// available yet. `k6` is the parsed live-log progress (null → not yet running).
export function computeRunTiming(
  durationText: string | undefined,
  startedAt: string | null,
  now: number,
  k6: K6Progress | null,
): RunTiming {
  const configuredMs = parseDurationMs(durationText);
  const startedMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  const hasStarted = Number.isFinite(startedMs);
  const elapsedMs = hasStarted ? Math.max(0, now - startedMs) : 0;

  // The test is "started" (for progress purposes) only once k6 emits a
  // post-setup timing line; before that it's still in setup → 0% / full duration.
  const hasTestStarted = Boolean(k6?.hasTiming);
  // Prefer k6's reported total duration ("2m30s/5m0s") over the configured one.
  const durationMs = (k6?.durationMs ?? 0) > 0 ? k6!.durationMs : configuredMs;
  const testElapsedMs = hasTestStarted ? k6!.elapsedMs : 0;

  const percent = durationMs > 0 && hasTestStarted
    ? Math.min(100, Math.max(0, (testElapsedMs / durationMs) * 100))
    : 0;
  const remainingMs = durationMs > 0
    ? Math.max(0, durationMs - testElapsedMs)
    : 0;

  return {
    hasStarted, elapsedMs, hasTestStarted, remainingMs, percent, durationMs,
    iters: k6?.iters ?? 0,
    rps: k6?.rps ?? 0,
  };
}
