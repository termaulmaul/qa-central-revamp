"use client";

import { Printer } from "lucide-react";
import type { RegressionFailure, RegressionRun } from "../types";
import { formatDateTime, Pill, primaryButtonClass, statusTone } from "../ui";

// No PDF-generation library is in this repo's package.json and adding one is out of
// scope for this pass — this print-friendly HTML view + window.print() ("Save as PDF"
// in every browser's print dialog) is a dependency-free substitute for the reference
// implementation's jsPDF/html2canvas export.
interface RunReportViewProps {
  run: RegressionRun;
  platformName: string;
  failures: RegressionFailure[];
}

export function RunReportView({ run, platformName, failures }: RunReportViewProps) {
  const byClassification = failures.reduce<Record<string, number>>((acc, f) => {
    const key = f.classification ?? "unclassified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 print:border-none print:p-0 dark:border-zinc-800 dark:bg-zinc-900 print:dark:bg-white">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Run Report</h3>
        <button type="button" className={primaryButtonClass} onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" /> Print / Save as PDF
        </button>
      </div>

      <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800 print:border-zinc-300">
        <h1 className="text-xl font-bold text-zinc-900 print:text-black dark:text-zinc-100">Regression Test Report</h1>
        <p className="mt-1 text-sm font-medium text-zinc-700 print:text-black dark:text-zinc-300">
          {typeof run.summary.name === "string" && run.summary.name ? run.summary.name : `Run ${run.id.slice(0, 8)}`}
        </p>
        <p className="mt-1 text-xs text-zinc-500 print:text-black dark:text-zinc-400">
          Run #{run.id.slice(0, 8)} · {platformName} · Created {formatDateTime(run.createdAt)}
          {run.finishedAt ? ` · Finished ${formatDateTime(run.finishedAt)}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pill tone={statusTone(run.status)}>{run.status}</Pill>
        <span className="text-sm text-zinc-600 print:text-black dark:text-zinc-400">{failures.length} failure(s) recorded</span>
      </div>

      {typeof run.summary.notes === "string" && run.summary.notes && (
        <p className="whitespace-pre-wrap text-sm text-zinc-600 print:text-black dark:text-zinc-400">{run.summary.notes}</p>
      )}

      {Object.keys(byClassification).length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 print:text-black dark:text-zinc-500">
            Failures by classification
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byClassification).map(([key, count]) => (
              <Pill key={key} tone="err">
                {key} · {count}
              </Pill>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 print:text-black dark:text-zinc-500">
          Failure detail
        </div>
        {failures.length === 0 ? (
          <p className="text-sm text-zinc-500 print:text-black dark:text-zinc-400">No failures recorded for this run.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-200 border border-zinc-200 print:divide-zinc-300 print:border-zinc-300 dark:divide-zinc-800 dark:border-zinc-800">
            {failures.map((f) => (
              <div key={f.id} className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium text-zinc-900 print:text-black dark:text-zinc-100">{f.testName}</span>
                  {f.classification && <Pill tone="err">{f.classification}</Pill>}
                </div>
                {Object.keys(f.details).length > 0 && (
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-zinc-500 print:text-black dark:text-zinc-400">
                    {JSON.stringify(f.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[10px] text-zinc-400 print:text-black dark:text-zinc-600">
        Generated {new Date().toLocaleString()} · QA Central regression report
      </p>
    </div>
  );
}
