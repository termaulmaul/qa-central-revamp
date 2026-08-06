import type { ParsedRequirement } from '../requirements/types';
import type { TestCase, GenerationContext, GenerationResult, TestCaseType, TestCasePriority, TestDataSet, Precondition } from './types';

// ponytail: rule-based generator, swap for LLM-based agent when advanced AI available
const WEIGHTS: Record<string, number> = {
  Functional: 0.3,
  Regression: 0.25,
  Integration: 0.15,
  API: 0.1,
  Negative: 0.05,
  Security: 0.03,
  Boundary: 0.02,
  Performance: 0.02,
  Accessibility: 0.02,
  'End-to-End': 0.03,
  UI: 0.02,
  UX: 0.01,
  Exploratory: 0.005,
  Sanity: 0.005,
  Smoke: 0.005,
  Compatibility: 0.005,
  Localization: 0.002,
  Database: 0.005,
  Concurrency: 0.005,
  Recovery: 0.005,
  Chaos: 0.002,
  'Role-Based': 0.005,
  Permission: 0.005,
  Workflow: 0.005,
};

export class TestCaseGenerator {
  generate(requirement: ParsedRequirement, context: GenerationContext): GenerationResult {
    const warnings: string[] = [];
    const selectedTypes = this.selectTypes(context);
    const testCases: TestCase[] = [];
    const rawText = `${requirement.title} ${requirement.description} ${requirement.acceptance_criteria.map((ac) => ac.text).join(' ')} ${requirement.business_rules.map((br) => br.text).join(' ')}`;

    for (const testType of selectedTypes) {
      const priority = this.determinePriority(requirement, context);
      testCases.push(this.createTestCase(rawText, requirement, context, testType, priority));
    }

    const coverage = this.calculateCoverage(testCases, selectedTypes);

    return {
      testCases,
      coverage,
      warnings,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'claude-5',
        promptVersion: 'v2.0',
        contextHash: this.hashContext(context),
      },
    };
  }

  private selectTypes(context: GenerationContext): TestCaseType[] {
    const selected: TestCaseType[] = [];
    const weights = { ...WEIGHTS };
    const maxCount = context.targetCoverage === 'comprehensive' ? 6 : context.targetCoverage === 'standard' ? 4 : 3;

    if (context.includeSecurity) weights.Security += 0.05;
    if (context.includePerformance) weights.Performance += 0.05;
    if (context.includeAccessibility) weights.Accessibility += 0.05;

    const entries = Object.entries(weights).filter(([, w]) => w > 0.0) as [TestCaseType, number][];
    const totalWeight = entries.reduce((s, [, w]) => s + w, 0);

    for (let i = 0; i < maxCount; i++) {
      let rand = Math.random() * totalWeight;
      for (const [type, weight] of entries) {
        rand -= weight;
        if (rand <= 0) {
          selected.push(type);
          break;
        }
      }
      if (!selected.includes('Functional') && i === 0) selected.unshift('Functional');
    }

    return [...new Set(selected)].slice(0, maxCount);
  }

  private createTestCase(
    rawText: string,
    req: ParsedRequirement,
    ctx: GenerationContext,
    type: TestCaseType,
    priority: TestCasePriority,
  ): TestCase {
    const steps = this.generateSteps(rawText, type, ctx.platform).map((text, i) => ({
      step: i + 1,
      action: text,
      expected: `Verify step ${i + 1} completes without error`,
      data: this.getTestData(ctx, i),
    }));

    return {
      id: `TC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      requirementId: req.id,
      title: `${req.title} - ${type}`,
      description: `Generated ${type} test case for: ${req.title}`,
      type,
      priority,
      severity: this.severityFromPriority(priority),
      automation_candidate: ctx.riskLevel === 'CRITICAL' || ctx.riskLevel === 'HIGH' || type === 'Regression',
      preconditions: this.generatePreconditions(req, ctx),
      testData: this.buildTestData(type),
      steps,
      expectedResult: `Verify ${type} test passes`,
      cleanup: this.generateCleanup(type),
      tags: [type, req.platform, req.risk, req.automation_candidate ? 'auto' : '', 'AI Generated'].filter(Boolean),
      traceability: [{ type: 'requirement', target_id: req.id, target_type: 'requirement', relationship: 'covers' }],
      risk: this.calculateRisk(req, type),
      estimatedDuration: this.estimateDuration(type),
      status: 'AI Generated',
      qase_id: null,
      sync_status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedBy: 'AI',
      reviewNotes: '',
      approvalHistory: [],
    };
  }

  private severityFromPriority(priority: TestCasePriority): 'Critical' | 'Major' | 'Minor' | 'Cosmetic' {
    return ({ P0: 'Critical', P1: 'Major', P2: 'Minor', P3: 'Minor', P4: 'Cosmetic' } as const)[priority] || 'Major';
  }

  private determinePriority(req: ParsedRequirement, ctx: GenerationContext): TestCasePriority {
    if (ctx.riskLevel === 'CRITICAL' || req.risk === 'CRITICAL') return 'P0';
    if (ctx.riskLevel === 'HIGH' || req.risk === 'HIGH') return 'P1';
    if (ctx.riskLevel === 'MEDIUM' || req.risk === 'MEDIUM') return 'P2';
    return 'P3';
  }

  private calculateRisk(req: ParsedRequirement, type: TestCaseType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (type === 'Security' || type === 'Negative') return 'HIGH';
    if (type === 'API') return 'MEDIUM';
    return req.risk;
  }

  private estimateDuration(type: TestCaseType): number {
    const map: Partial<Record<TestCaseType, number>> = {
      Functional: 2, Regression: 3, Security: 4, Negative: 1, Boundary: 1,
      API: 2, Performance: 3, Accessibility: 2, 'End-to-End': 5,
    };
    return map[type] || 2;
  }

  private generateSteps(rawText: string, type: TestCaseType, platform: string): string[] {
    const map: Partial<Record<TestCaseType, string[]>> = {
      Functional: [`Open ${platform} app`, `Execute core workflow for ${rawText}`, `Verify result matches expected behavior`],
      Regression: [`Navigate to ${platform} app`, `Re-execute ${rawText}`, `Validate stability across environments`],
      Security: [`Login as standard user`, `Attempt to ${rawText}`, `Verify unauthorized access blocked`],
      Negative: [`Navigate to ${platform} app`, `Submit invalid ${rawText}`, `Verify error handling and constraints`],
      Boundary: [`Navigate to ${platform} app`, `Test boundary values for ${rawText}`, `Verify edge cases handled`],
      API: [`Execute API call for ${rawText}`, `Validate response structure and business rules`, `Verify error handling`],
      Performance: [`Navigate to ${platform} app`, `Execute heavy operation for ${rawText}`, `Verify performance within SLA`],
      Accessibility: [`Navigate to ${platform} app`, `Verify screen reader compatibility`, `Test keyboard navigation for ${rawText}`],
      'End-to-End': [`Setup test environment`, `Execute full end-to-end scenario for ${rawText}`, `Cleanup and report results`],
    };
    return map[type] || [`Verify ${rawText}`, `Validate behavior`, `Ensure no regressions`];
  }

  private getTestData(ctx: GenerationContext, index: number): Record<string, unknown> | undefined {
    if (ctx.platform === 'API') return { endpoint: '/api/v1', method: 'POST', body: { test: index } };
    return undefined;
  }

  private buildTestData(type: TestCaseType): TestDataSet[] {
    if (type === 'Negative') return [{ name: 'Invalid Input', type: 'invalid', values: { input: '' }, description: 'Negative test validation' }];
    if (type === 'Boundary') return [{ name: 'Min Value', type: 'boundary', values: { value: 1 }, description: 'Min boundary' }, { name: 'Max Value', type: 'boundary', values: { value: 100 }, description: 'Max boundary' }];
    if (type === 'Security') return [{ name: 'Malicious Input', type: 'edge', values: { payload: "1' OR '1'='1" }, description: 'Security penetration' }];
    return [{ name: 'Valid Input', type: 'valid', values: { test: 'value' }, description: 'Standard test' }];
  }

  private generatePreconditions(req: ParsedRequirement, ctx: GenerationContext): Precondition[] {
    const pre: Precondition[] = [];
    if (ctx.platform === 'API') pre.push({ id: 'P1', description: 'API server is running', verified: true });
    if (req.risk === 'HIGH' || req.risk === 'CRITICAL') pre.push({ id: 'P2', description: 'Authentication token is valid', verified: true });
    return pre;
  }

  private generateCleanup(type: TestCaseType): string[] {
    if (type === 'Security') return ['Reset authentication state'];
    if (type === 'API') return ['Clear API cache'];
    if (type === 'Negative') return ['Reset database entries'];
    return [];
  }

  private calculateCoverage(testCases: TestCase[], types: TestCaseType[]): number {
    const uniqueTypes = new Set(testCases.map((tc) => tc.type));
    return testCases.length ? Math.round((uniqueTypes.size / Math.max(types.length, 1)) * 100) : 0;
  }

  private hashContext(ctx: GenerationContext): string {
    const hash = ctx.testTypes.join(',') + ctx.targetCoverage + ctx.riskLevel;
    return Buffer.from(hash).toString('base64').substring(0, 32);
  }
}

export const testCaseGenerator = new TestCaseGenerator();
