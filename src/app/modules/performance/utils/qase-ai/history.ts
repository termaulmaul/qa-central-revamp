export interface TestRunInfo {
  id: number;
  title?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  totalCases?: number;
  passed?: number;
  failed?: number;
  blocked?: number;
  untested?: number;
}

export interface HistoryMetrics {
  totalRuns: number;
  passRate: number;
  failRate: number;
  flakyRate: number;
  avgDuration: number;
  trend: Array<{ runId: number; date: string; passRate: number }>;
}

export class QaseHistoryAnalyzer {
  analyze(runs: TestRunInfo[]): HistoryMetrics {
    const total = runs.length;
    if (!total) return { totalRuns: 0, passRate: 0, failRate: 0, flakyRate: 0, avgDuration: 0, trend: [] };

    const totalPassed = runs.reduce((s, r) => s + (r.passed ?? 0), 0);
    const totalExecuted = runs.reduce((s, r) => s + (r.passed ?? 0) + (r.failed ?? 0), 0);
    const passRate = totalExecuted > 0 ? Math.round((totalPassed / totalExecuted) * 100) : 0;

    const flaky = runs.filter((r) => {
      const f = r.failed ?? 0;
      const t = r.totalCases ?? 1;
      return f > 0 && f / t < 0.3;
    }).length;
    const flakyRate = total > 0 ? Math.round((flaky / total) * 100) : 0;

    return {
      totalRuns: total,
      passRate,
      failRate: 100 - passRate,
      flakyRate,
      avgDuration: this.avgDuration(runs),
      trend: this.trendData(runs),
    };
  }

  private avgDuration(runs: TestRunInfo[]): number {
    const durations = runs
      .filter((r) => r.startTime && r.endTime)
      .map((r) => new Date(r.endTime!).getTime() - new Date(r.startTime!).getTime())
      .filter((d) => d > 0);
    if (!durations.length) return 0;
    return durations.reduce((s, d) => s + d, 0) / durations.length / 60000; // minutes
  }

  private trendData(runs: TestRunInfo[]): Array<{ runId: number; date: string; passRate: number }> {
    return runs.slice(-20).map((r) => {
      const executed = (r.passed ?? 0) + (r.failed ?? 0);
      const rate = executed > 0 ? Math.round(((r.passed ?? 0) / executed) * 100) : 0;
      return {
        runId: r.id,
        date: r.startTime ?? r.endTime ?? '',
        passRate: rate,
      };
    });
  }

  findFlakyCases(
    history: Array<{ cases: Array<{ id: number; status: string }> }>,
  ): Map<number, { pass: number; fail: number; total: number }> {
    const stats = new Map<number, { pass: number; fail: number; total: number }>();
    for (const run of history) {
      for (const tc of run.cases) {
        const s = stats.get(tc.id) ?? { pass: 0, fail: 0, total: 0 };
        s.total++;
        if (tc.status === 'passed' || tc.status === 'pass' || tc.status === 'PASSED') s.pass++;
        else if (tc.status === 'failed' || tc.status === 'fail' || tc.status === 'FAILED') s.fail++;
        stats.set(tc.id, s);
      }
    }
    return stats;
  }
}