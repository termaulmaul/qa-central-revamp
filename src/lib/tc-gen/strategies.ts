import type { TestDesignStrategy } from './types';

const STRATEGIES: TestDesignStrategy[] = [
  {
    name: 'minimum',
    testTypes: ['Functional', 'Negative'],
    priority: ['P0', 'P1'],
    coverageTargets: { functional: 60, negative: 20, boundary: 0, security: 0, performance: 0, accessibility: 0 },
    minCasesPerRequirement: 2,
  },
  {
    name: 'standard',
    testTypes: ['Functional', 'Regression', 'Negative', 'Boundary', 'Security'],
    priority: ['P0', 'P1', 'P2'],
    coverageTargets: { functional: 80, negative: 40, boundary: 30, security: 20, performance: 0, accessibility: 0 },
    minCasesPerRequirement: 4,
  },
  {
    name: 'comprehensive',
    testTypes: [
      'Functional', 'Regression', 'Negative', 'Boundary', 'Security', 'API',
      'Performance', 'Accessibility', 'Compatibility', 'Database', 'End-to-End',
    ],
    priority: ['P0', 'P1', 'P2', 'P3'],
    coverageTargets: { functional: 100, negative: 80, boundary: 60, security: 60, performance: 40, accessibility: 40 },
    minCasesPerRequirement: 8,
  },
  {
    name: 'risk-based',
    testTypes: ['Security', 'Negative', 'Functional', 'Regression'],
    priority: ['P0', 'P1'],
    coverageTargets: { functional: 70, negative: 60, boundary: 40, security: 80, performance: 0, accessibility: 0 },
    minCasesPerRequirement: 4,
  },
  {
    name: 'api-focused',
    testTypes: ['API', 'Functional', 'Security', 'Performance', 'Negative', 'Boundary'],
    priority: ['P0', 'P1', 'P2', 'P3'],
    coverageTargets: { functional: 80, negative: 40, boundary: 30, security: 40, performance: 40, accessibility: 0 },
    minCasesPerRequirement: 4,
  },
  {
    name: 'accessibility',
    testTypes: ['Accessibility', 'Functional', 'UI', 'UX'],
    priority: ['P0', 'P1', 'P2'],
    coverageTargets: { functional: 50, negative: 20, boundary: 0, security: 0, performance: 0, accessibility: 100 },
    minCasesPerRequirement: 3,
  },
];

export class TestStrategySelector {
  strategies: TestDesignStrategy[];

  constructor(strategies: TestDesignStrategy[] = STRATEGIES) {
    this.strategies = strategies;
  }

  select(name: string): TestDesignStrategy {
    const found = this.strategies.find((s) => s.name === name);
    if (!found) throw new Error(`Unknown strategy: ${name}. Available: ${this.strategies.map((s) => s.name).join(', ')}`);
    return found;
  }

  pickByContext(riskLevel: string, platform: string, automationCandidate: boolean): TestDesignStrategy {
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') return this.select('risk-based');
    if (platform === 'API') return this.select('api-focused');
    if (!automationCandidate) return this.select('minimum');
    return this.select('standard');
  }

  available(): string[] {
    return this.strategies.map((s) => s.name);
  }
}

export const strategySelector = new TestStrategySelector();
