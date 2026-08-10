import { Construction, LayoutDashboard } from "lucide-react";

/** Page heading used by every module page, so titles stay consistent. */
export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-balance text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-pretty leading-6 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

/**
 * Shown for menus that are registered and routed but have no implementation in
 * the reference either — the reference renders its own ComingSoon here. Kept as
 * an honest placeholder rather than inventing data.
 */
export function ComingSoon({ title, moduleName }: { title: string; moduleName: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={title} subtitle={`${moduleName} — this page is registered and routed, but its workflow is not built yet.`} />
      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <Construction className="size-8 text-zinc-400" aria-hidden="true" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Coming Soon</p>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          The upstream dashboard also ships this menu as a placeholder, so there is no behavior to port yet.
        </p>
      </section>
    </div>
  );
}

/** Fallback for an unknown menu id under a known module. */
export function PlaceholderContent({ title, moduleName, menuId }: { title: string; moduleName: string; menuId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={title || menuId} subtitle={moduleName} />
      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <LayoutDashboard className="size-8 text-zinc-400" aria-hidden="true" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No content is mapped to <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">{menuId}</code> yet.
        </p>
      </section>
    </div>
  );
}

/** Static metric-card grid + table, the shape the reference's mock pages use. */
export type StaticPageData = {
  title: string;
  subtitle: string;
  metrics: [string, string, string][];
  section: string;
  columns: string[];
  rows: string[][];
};

const VERDICT_TONES: Record<string, string> = {
  PASS: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  HEALTHY: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  CONNECTED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  ENABLED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  PUBLISHED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  ONLINE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  REVIEW: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  WATCH: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  FLAKY: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  DEGRADED: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  BUSY: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  PAUSED: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  RETRYING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  MAINTENANCE: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  FAIL: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  CRITICAL: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  DISABLED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  HIGH: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  MEDIUM: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StaticPage({ data }: { data: StaticPageData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={data.title} subtitle={data.subtitle} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map(([label, value, caption]) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{caption}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">{data.section}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {data.columns.map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-zinc-100 dark:border-zinc-800">
                  {row.map((cell, cellIndex) => {
                    const tone = VERDICT_TONES[cell];
                    const isLast = cellIndex === row.length - 1;
                    return (
                      <td key={cellIndex} className="px-4 py-2.5">
                        {tone && isLast ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
