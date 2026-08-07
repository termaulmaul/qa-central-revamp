export interface StepPattern {
  actionTemplate: string;
  expectedTemplate: string;
  frequency: number;
  domain: string;
}

export interface StepAnalysis {
  totalSteps: number;
  uniqueActions: number;
  patterns: StepPattern[];
  commonVerbs: Array<{ verb: string; count: number }>;
  missingExpected: number;
  avgStepsPerCase: number;
}

export class QaseStepsAnalyzer {
  analyze(steps: Array<{ action?: string; expected_result?: string }>): StepAnalysis {
    const actions = steps.map((s) => s.action ?? '').filter(Boolean);
    const expected = steps.map((s) => s.expected_result ?? '').filter(Boolean);
    const verbs = this.extractVerbs(actions);
    const verbCounts = this.countBy(verbs);
    const patterns = this.minePatterns(actions, expected);

    return {
      totalSteps: steps.length,
      uniqueActions: new Set(actions.map((a) => a.toLowerCase().trim())).size,
      patterns,
      commonVerbs: verbCounts.sort((a, b) => b.count - a.count).slice(0, 10),
      missingExpected: steps.filter((s) => !s.expected_result?.trim()).length,
      avgStepsPerCase: steps.length,
    };
  }

  private extractVerbs(actions: string[]): string[] {
    return actions.map((a) => {
      const match = a.trim().match(/^(\w+)/);
      return match ? match[1].toLowerCase() : '';
    }).filter(Boolean);
  }

  private countBy(items: string[]): Array<{ verb: string; count: number }> {
    const map = new Map<string, number>();
    for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
    return Array.from(map.entries()).map(([verb, count]) => ({ verb, count }));
  }

  private minePatterns(
    actions: string[],
    expected: string[],
  ): StepPattern[] {
    // ponytail: simple frequency-based pattern extraction; add NLP-based clustering when >1000 steps
    const seen = new Set<string>();
    const patterns: StepPattern[] = [];
    for (let i = 0; i < Math.min(actions.length, expected.length); i++) {
      const key = `${actions[i].trim().slice(0, 60)}|${expected[i]?.trim().slice(0, 60)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      patterns.push({
        actionTemplate: actions[i].trim(),
        expectedTemplate: expected[i]?.trim() ?? '',
        frequency: 1,
        domain: this.inferDomain(actions[i]),
      });
    }
    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 20);
  }

  private inferDomain(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('click') || lower.includes('press') || lower.includes('tap')) return 'ui-interaction';
    if (lower.includes('enter') || lower.includes('type') || lower.includes('input')) return 'data-entry';
    if (lower.includes('select') || lower.includes('choose') || lower.includes('pick')) return 'selection';
    if (lower.includes('verify') || lower.includes('check') || lower.includes('assert')) return 'verification';
    if (lower.includes('navigate') || lower.includes('go to') || lower.includes('open')) return 'navigation';
    if (lower.includes('wait') || lower.includes('delay')) return 'timing';
    if (lower.includes('upload') || lower.includes('attach')) return 'file-io';
    if (lower.includes('send') || lower.includes('call') || lower.includes('request')) return 'api';
    return 'general';
  }

  findReusableSteps(
    cases: Array<{ steps?: Array<{ action?: string; expected_result?: string }> }>,
  ): Array<{ action: string; expected: string; frequency: number }> {
    const freq = new Map<string, { action: string; expected: string; count: number }>();
    for (const tc of cases) {
      for (const step of tc.steps ?? []) {
        const action = (step.action ?? '').trim();
        const expected = (step.expected_result ?? '').trim();
        if (!action) continue;
        const key = `${action}|${expected}`;
        const existing = freq.get(key);
        if (existing) {
          existing.count++;
        } else {
          freq.set(key, { action, expected, count: 1 });
        }
      }
    }
    return Array.from(freq.values())
      .filter((s) => s.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map(({ action, expected, count }) => ({ action, expected, frequency: count }));
  }
}