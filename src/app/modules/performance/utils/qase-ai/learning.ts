import { QaseKnowledgeGraph } from './knowledge';
import { QasePatternMiner, type MinedPattern } from './patterns';
import { QaseStepsAnalyzer } from './steps';
import type { QaseCase } from '@/types/qase';

export interface LearningResult {
  patterns: MinedPattern[];
  duplicateCandidates: unknown[];
  coverageSuggestions: string[];
  namingSuggestions: string[];
  automationSuggestions: string[];
  qualityAssessment: QualityAssessment;
}

export interface QualityAssessment {
  score: number;
  missingExpectedResults: number;
  poorStepQuality: number;
  inconsistentWording: number;
  suggestions: string[];
}

export class QaseLearningEngine {
  private knowledgeGraph: QaseKnowledgeGraph;
  private patternMiner: QasePatternMiner;
  private stepsAnalyzer: QaseStepsAnalyzer;

  constructor() {
    this.knowledgeGraph = new QaseKnowledgeGraph();
    this.patternMiner = new QasePatternMiner();
    this.stepsAnalyzer = new QaseStepsAnalyzer();
  }

  learn(projectCode: string, cases: QaseCase[]): LearningResult {
    this.knowledgeGraph.addCasesData(projectCode, undefined, cases);
    const patterns = this.patternMiner.mineAll(cases);

    const allSteps = cases.flatMap((tc) =>
      (tc.steps ?? []).map((s: QaseCase['steps'][number]) => ({ action: s.action, expected_result: s.expectedResult })),
    );

    const stepAnalysis = this.stepsAnalyzer.analyze(allSteps);
        const duplicates = this.knowledgeGraph.findDuplicates(projectCode);

    const quality = this.assessQuality(cases, stepAnalysis);
    const recommendations = this.knowledgeGraph.getRecommendations(projectCode);

    return {
      patterns,
      duplicateCandidates: duplicates,
      coverageSuggestions: recommendations
        .filter((r) => r.type === 'coverage')
        .map((r) => r.description),
      namingSuggestions: this.inferNamingSuggestions(cases),
      automationSuggestions: this.inferAutomationSuggestions(cases),
      qualityAssessment: quality,
    };
  }

  private assessQuality(
    cases: QaseCase[],
    stepAnalysis: { missingExpected: number; commonVerbs: Array<{ verb: string; count: number }> },
  ): QualityAssessment {
    const missingExpected = stepAnalysis.missingExpected;
    const poorStepQuality = cases.filter((tc) =>
      (tc.steps ?? []).some((s: QaseCase['steps'][number]) => {
        const action = (s.action ?? '').trim();
        return action.length < 5 || action === 'click' || action === 'enter';
      }),
    ).length;
    const inconsistentWording = this.detectInconsistentWording(cases);

    const stepScore = cases.length > 0
      ? Math.max(0, 1 - missingExpected / Math.max(cases.length * 3, 1))
      : 0;
    const wordingScore = Math.max(0, 1 - inconsistentWording * 0.1);
    const qualityScore = Math.round(((stepScore * 0.5 + wordingScore * 0.3 + 0.2) * 100));
    const score = Math.min(100, qualityScore);

    const suggestions: string[] = [];
    if (missingExpected > 0) suggestions.push(`Add expected results to ${missingExpected} steps`);
    if (poorStepQuality > 0) suggestions.push(`Improve ${poorStepQuality} cases with vague step descriptions`);
    if (inconsistentWording > 0) suggestions.push('Standardize wording across similar test cases');

    return { score, missingExpectedResults: missingExpected, poorStepQuality, inconsistentWording, suggestions };
  }

  private detectInconsistentWording(cases: QaseCase[]): number {
    const verbs = new Map<string, Set<string>>();
    for (const tc of cases) {
      for (const step of tc.steps ?? []) {
        const action = (step.action ?? '').trim().toLowerCase();
        if (action) {
          const verb = action.split(/\s+/)[0] ?? '';
          const existing = verbs.get(verb) ?? new Set();
          existing.add(action);
          verbs.set(verb, existing);
        }
      }
    }
    let inconsistencies = 0;
    for (const [, variations] of verbs) {
      if (variations.size > 3) inconsistencies += variations.size - 3;
    }
    return inconsistencies;
  }

  private inferNamingSuggestions(cases: QaseCase[]): string[] {
    const suggestions: string[] = [];
    const prefixes = new Map<string, number>();
    for (const tc of cases) {
      const title = (tc.title ?? '').trim();
      const firstWord = title.split(/\s+/)[0] ?? '';
      if (firstWord) prefixes.set(firstWord, (prefixes.get(firstWord) ?? 0) + 1);
    }
    const topVerbs = ['verify', 'check', 'test', 'validate', 'ensure', 'confirm'];
    const mainPrefixes = Array.from(prefixes.keys());
    for (const v of topVerbs) {
      const count = mainPrefixes.filter((p) => p.toLowerCase() === v).length;
      if (count !== undefined && count > cases.length * 0.3) {
        suggestions.push(`Consider varying test case prefixes — "${v}" appears in many titles`);
      }
    }
    return suggestions.slice(0, 5);
  }

  private inferAutomationSuggestions(cases: QaseCase[]): string[] {
    const automated = cases.filter((tc) =>
      tc.automationStatus === 'automated' || (tc as { automation?: string }).automation === 'automated',
    );
    const automationRate = cases.length > 0
      ? Math.round((automated.length / cases.length) * 100)
      : 0;
    const suggestions: string[] = [];
    if (automationRate < 30) suggestions.push(`Automation rate is ${automationRate}% — consider prioritizing automation`);
    else if (automationRate < 60) suggestions.push(`Automation rate is ${automationRate}% — good progress, target 80%+`);
    return suggestions;
  }
}
