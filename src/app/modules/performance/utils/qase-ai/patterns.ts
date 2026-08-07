export interface MinedPattern {
  type: 'step-template' | 'expected-template' | 'naming' | 'business-rule' | 'security' | 'regression' | 'smoke' | 'sanity' | 'api' | 'ui' | 'workflow';
  pattern: string;
  frequency: number;
  confidence: number;
  examples: string[];
  source: 'cases' | 'suites' | 'labels' | 'steps' | 'history';
}

export class QasePatternMiner {
  private patterns: MinedPattern[] = [];

  mineAll(
    cases: Array<{
      title?: string;
      type?: string;
      severity?: string;
      tags?: string[];
      steps?: Array<{ action?: string; expected_result?: string }>;
    }>,
  ): MinedPattern[] {
    this.patterns = [
      ...this.mineStepTemplates(cases),
      ...this.mineNamingConventions(cases),
      ...this.mineBusinessRules(cases),
      ...this.mineTypePatterns(cases),
    ];
    return this.patterns;
  }

  private mineStepTemplates(
    cases: Array<{ steps?: Array<{ action?: string; expected_result?: string }> }>,
  ): MinedPattern[] {
    const actionFreq = new Map<string, number>();
    const expectedFreq = new Map<string, number>();
    for (const tc of cases) {
      for (const step of tc.steps ?? []) {
        const action = (step.action ?? '').trim();
        const expected = (step.expected_result ?? '').trim();
        if (action) actionFreq.set(action, (actionFreq.get(action) ?? 0) + 1);
        if (expected) expectedFreq.set(expected, (expectedFreq.get(expected) ?? 0) + 1);
      }
    }
    return [
      ...this.toPatterns(actionFreq, 'step-template', 'cases'),
      ...this.toPatterns(expectedFreq, 'expected-template', 'cases'),
    ];
  }

  private mineNamingConventions(
    cases: Array<{ title?: string; type?: string }>,
  ): MinedPattern[] {
    const prefixFreq = new Map<string, number>();
    const suffixFreq = new Map<string, number>();
    for (const tc of cases) {
      const title = (tc.title ?? '').trim();
      const words = title.split(/\s+/);
      if (words.length >= 2) {
        const prefix = words.slice(0, 2).join(' ');
        prefixFreq.set(prefix, (prefixFreq.get(prefix) ?? 0) + 1);
        const suffix = words.slice(-2).join(' ');
        suffixFreq.set(suffix, (suffixFreq.get(suffix) ?? 0) + 1);
      }
    }
    const naming: MinedPattern[] = [];
    for (const [prefix, freq] of prefixFreq) {
      if (freq >= 2) {
        naming.push({
          type: 'naming',
          pattern: `Prefix: "${prefix}"`,
          frequency: freq,
          confidence: Math.min(freq / cases.length * 2, 1),
          examples: [prefix],
          source: 'cases',
        });
      }
    }
    for (const [suffix, freq] of suffixFreq) {
      if (freq >= 2) {
        naming.push({
          type: 'naming',
          pattern: `Suffix: "${suffix}"`,
          frequency: freq,
          confidence: Math.min(freq / cases.length * 2, 1),
          examples: [suffix],
          source: 'cases',
        });
      }
    }
    return naming;
  }

  private mineBusinessRules(
    cases: Array<{ title?: string; steps?: Array<{ action?: string; expected_result?: string }>; tags?: string[] }>,
  ): MinedPattern[] {
    const rules: MinedPattern[] = [];
    const ruleKeywords = ['must', 'should', 'required', 'cannot', 'must not', 'only', 'maximum', 'minimum'];
    for (const tc of cases) {
      for (const step of tc.steps ?? []) {
        const text = `${step.action ?? ''} ${step.expected_result ?? ''}`.toLowerCase();
        for (const kw of ruleKeywords) {
          if (text.includes(kw)) {
            rules.push({
              type: 'business-rule',
              pattern: `Rule keyword "${kw}" in: "${(step.action ?? '').slice(0, 80)}"`,
              frequency: 1,
              confidence: 0.5,
              examples: [(step.action ?? '').slice(0, 100)],
              source: 'steps',
            });
            break;
          }
        }
      }
    }
    return rules;
  }

  private mineTypePatterns(
    cases: Array<{ type?: string; severity?: string; tags?: string[] }>,
  ): MinedPattern[] {
    const typeFreq = new Map<string, number>();
    const severityFreq = new Map<string, number>();
    for (const tc of cases) {
      if (tc.type) typeFreq.set(tc.type, (typeFreq.get(tc.type) ?? 0) + 1);
      if (tc.severity) severityFreq.set(tc.severity, (severityFreq.get(tc.severity) ?? 0) + 1);
    }
    return [
      ...this.toPatterns(typeFreq, 'workflow', 'cases'),
      ...this.toPatterns(severityFreq, 'business-rule', 'cases'),
    ];
  }

  private toPatterns(
    freq: Map<string, number>,
    type: MinedPattern['type'],
    source: MinedPattern['source'],
  ): MinedPattern[] {
    return Array.from(freq.entries())
      .filter(([, c]) => c >= 2)
      .map(([pattern, count]) => ({
        type,
        pattern: pattern.slice(0, 120),
        frequency: count,
        confidence: Math.min(count / 10, 1),
        examples: [pattern.slice(0, 100)],
        source,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 30);
  }

  getPatterns(): MinedPattern[] {
    return this.patterns;
  }

  findAutomationCandidates(
    cases: Array<{ automation?: string; type?: string; steps?: Array<unknown> }>,
  ): Array<{ id?: number; title?: string; reason: string }> {
    const candidates: Array<{ id?: number; title?: string; reason: string }> = [];
    for (const tc of cases) {
      if (tc.automation === 'manual' || !tc.automation) {
        const steps = tc.steps?.length ?? 0;
        if (steps >= 3 && steps <= 15) {
          candidates.push({
            id: (tc as { id?: number }).id,
            title: (tc as { title?: string }).title,
            reason: `${steps} steps, suitable for automation`,
          });
        }
      }
    }
    return candidates.slice(0, 50);
  }
}