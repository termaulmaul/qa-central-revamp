export interface LabelDistribution {
  tag: string;
  count: number;
  percentage: number;
}

export interface LabelAnalysis {
  totalLabels: number;
  uniqueTags: number;
  distribution: LabelDistribution[];
  suggestions: string[];
}

export class QaseLabelsAnalyzer {
  analyze(tagsArrays: string[][]): LabelAnalysis {
    const flat = tagsArrays.flat();
    const counts = new Map<string, number>();
    for (const tag of flat) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    const total = flat.length || 1;
    const distribution = Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLabels: total,
      uniqueTags: counts.size,
      distribution,
      suggestions: this.generateSuggestions(counts, tagsArrays.length),
    };
  }

  private generateSuggestions(
    counts: Map<string, number>,
    caseCount: number,
  ): string[] {
    const suggestions: string[] = [];
    if (caseCount > 10 && counts.size < 3) {
      suggestions.push('Add more diverse tags to improve test case classification');
    }
    const topLabels = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    if (topLabels.length > 0 && topLabels[0][1] / caseCount > 0.8) {
      suggestions.push(`Tag "${topLabels[0][0]}" used on >80% of cases — consider more granular tags`);
    }
    if (!counts.has('automation') && !counts.has('Automation') && !counts.has('automated')) {
      suggestions.push('Consider adding automation status tags (automated/manual)');
    }
    if (!counts.has('smoke') && !counts.has('Smoke') && !counts.has('Smoke Test')) {
      suggestions.push('Consider adding smoke test tags for quick regression selection');
    }
    if (!counts.has('regression') && !counts.has('Regression')) {
      suggestions.push('Consider adding regression tags to identify regression test candidates');
    }
    return suggestions;
  }

  extractCommonTags(cases: Array<{ tags?: string[] }>): string[] {
    const freq = new Map<string, number>();
    for (const tc of cases) {
      for (const tag of tc.tags ?? []) {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 20);
  }
}