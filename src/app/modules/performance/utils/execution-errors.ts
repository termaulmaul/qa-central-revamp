// Execution Errors extraction.
//
// The run's failed-request detail lives in the captured run output (the stdout
// artifact for ONPREM, where the runner combines the remote streams and the k6
// scripts console.error one line per failed request — the SAME !success branch
// that increments error_count_<api>, i.e. Report Preview's "Error Sample").
// The stderr artifact is empty for ONPREM, which is why the old Execution
// Errors — reading stderr — always said "No errors detected" while Report
// Preview showed thousands of errors.
//
// Mirrors pt-framework's mechanism: parse the combined run log for error lines
// (pt-framework matches k6's native `✘ ERROR https://` in ${jobId}.log). The
// growin scripts don't emit that native marker; they emit level=error console
// lines, so match those — the reliable, always-present failure evidence that
// corresponds 1:1 with the error_count metric.

// A captured line is a failure line when it is one of:
//   - a k6 level=error record (k6 wraps every console.error() as level=error) —
//     the runner prefixes it (e.g. "execute: time=... level=error msg=..."),
//   - k6's own native check/transport failure marker (✘ ERROR ...),
//   - a growin per-request failure line (VU<n> ERROR <label> || ... Status: ...)
//     or a "... FAILED — Status: ..." login/profile line,
// so an API with Error Sample > 0 always contributes at least one match.
const FAILURE_LINE_RE = /(?:\blevel=error\b|✘\s*ERROR|\bERROR\b.*\|\|.*\bStatus:|❌.*\bFAILED\b|\bFAILED\b\s*—\s*Status:)/;

// Pull the failure lines out of a captured run log, preserving order and
// dropping everything else. Returns '' when there are none. Does not alter the
// lines' text — the real request URL/status/body the script logged is shown
// verbatim.
export function extractExecutionErrors(runOutput: string): string {
  if (!runOutput) return '';
  const lines = runOutput.split('\n');
  const errors: string[] = [];
  for (const line of lines) {
    if (FAILURE_LINE_RE.test(line)) errors.push(line.replace(/\s+$/, ''));
  }
  return errors.join('\n');
}
