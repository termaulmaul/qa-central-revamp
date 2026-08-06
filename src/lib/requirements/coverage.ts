import type {
  ParsedRequirement,
  CoverageAnalysis,
  CoverageGap,
} from './types';

export class CoverageAnalyzer {
  analyze(requirements: ParsedRequirement[]): CoverageAnalysis {
    if (!requirements.length) return { requirement_coverage: 0, risk_coverage: 0, scenario_coverage: 0, negative_coverage: 0, automation_coverage: 0, business_rule_coverage: 0, gaps: [] };
    const gaps: CoverageGap[] = [];

    const requirementCoverage = requirements.reduce((sum, r) => {
      const acCount = r.acceptance_criteria.filter((ac) => ac.testable).length;
      const brCount = r.business_rules.filter((br) => br.testable).length;
      return sum + (acCount + brCount) / Math.max(r.acceptance_criteria.length + r.business_rules.length, 1);
    }, 0) / requirements.length;

    const riskCoverage = this.calcRiskCoverage(requirements);
    const scenarioCoverage = this.calcScenarioCoverage(requirements);
    const negativeCoverage = this.calcNegativeCoverage(requirements);
    const automationCoverage = this.calcAutomationCoverage(requirements);
    const businessRuleCoverage = this.calcBusinessRuleCoverage(requirements);

    if (requirementCoverage < 0.5) gaps.push(this.gap('requirement', requirements[0].id, 'Critical acceptance criteria missing', 'high', [`Define ${3 - Math.round(requirementCoverage * 3)} testable acceptance criteria`, 'Add negative test cases']));
    if (riskCoverage < 0.6) gaps.push(this.gap('risk', requirements[0].id, 'Risk assessment incomplete', 'medium', ['Add risk rating to requirement', 'Define security-specific acceptance criteria']));
    if (scenarioCoverage < 0.3) gaps.push(this.gap('scenario', requirements[0].id, 'Scenario coverage weak', 'medium', ['Add functional acceptance criteria', 'Define typical user flows', 'Add edge cases']));
    if (negativeCoverage < 0.1) gaps.push(this.gap('negative', requirements[0].id, 'Negative test cases missing', 'high', ['Add error/edge case acceptance criteria', 'Define invalid input scenarios', 'Test failure modes']));
    if (automationCoverage < 0.5) gaps.push(this.gap('automation', requirements[0].id, 'Automation potential low', 'medium', ['Mark requirement as automation_candidate: true', 'Add structured test case templates']));
    if (businessRuleCoverage < 0.3) gaps.push(this.gap('business_rule', requirements[0].id, 'Business rule coverage incomplete', 'medium', ['Add business rule extraction', 'Define validation and workflow rules']));

    if (gaps.length === 0) gaps.push(this.gap('requirement', requirements[0].id, 'Add comprehensive test planning', 'low', ['Define 5+ acceptance criteria per requirement', 'Add both positive and negative cases']));

    return {
      requirement_coverage: Math.min(requirementCoverage, 1),
      risk_coverage: Math.min(riskCoverage, 1),
      scenario_coverage: Math.min(scenarioCoverage, 1),
      negative_coverage: Math.min(negativeCoverage, 1),
      automation_coverage: Math.min(automationCoverage, 1),
      business_rule_coverage: Math.min(businessRuleCoverage, 1),
      gaps,
    };
  }

  private calcRiskCoverage(reqs: ParsedRequirement[]): number {
    if (!reqs.length) return 0;
    const risky = reqs.filter((r) => r.risk !== 'LOW');
    if (!risky.length) return 1;
    const riskWithin = risky.filter((r) => r.acceptance_criteria.some((ac) => /(security|auth|high|risk)/i.test(ac.text))).length;
    return riskWithin / Math.max(risky.length, 1);
  }

  private calcScenarioCoverage(reqs: ParsedRequirement[]): number {
    if (!reqs.length) return 0;
    const acCount = reqs.reduce((sum, r) => sum + r.acceptance_criteria.filter((ac) => ac.type === 'functional').length, 0);
    const businessRuleCount = reqs.reduce((sum, r) => sum + r.business_rules.filter((br) => br.category === 'workflow').length, 0);
    const total = acCount + businessRuleCount;
    return Math.min(total / 6, 1);
  }

  private calcNegativeCoverage(reqs: ParsedRequirement[]): number {
    if (!reqs.length) return 0;
    const acCount = reqs.reduce((sum, r) => sum + r.acceptance_criteria.filter((ac) => /(error|fail|invalid|reject)/i.test(ac.text)).length, 0);
    return Math.min(acCount / 2, 1);
  }

  private calcAutomationCoverage(reqs: ParsedRequirement[]): number {
    if (!reqs.length) return 0;
    const automated = reqs.filter((r) => r.automation_candidate).length;
    return automated / Math.max(reqs.length, 1);
  }

  private calcBusinessRuleCoverage(reqs: ParsedRequirement[]): number {
    if (!reqs.length) return 0;
    const totalRules = reqs.reduce((sum, r) => sum + r.business_rules.length, 0);
    const testableRules = reqs.reduce((sum, r) => sum + r.business_rules.filter((br) => br.testable).length, 0);
    return totalRules ? testableRules / totalRules : 0;
  }

  private gap(type: CoverageGap['type'], reqId: string, description: string, severity: CoverageGap['severity'], suggestions: string[]): CoverageGap {
    return {
      type,
      requirement_id: reqId,
      description,
      severity,
      suggested_test_cases: suggestions,
    };
  }

  calculateCoverageScore(coverage: CoverageAnalysis): number {
    const weights = { requirement_coverage: 0.25, risk_coverage: 0.15, scenario_coverage: 0.2, negative_coverage: 0.2, automation_coverage: 0.1, business_rule_coverage: 0.1 };
    return Object.entries(coverage)
      .filter(([k]) => k !== 'gaps')
      .reduce((sum, [k, v]) => sum + (v as number) * (weights[k as keyof typeof weights] || 0), 0) * 100;
  }

  suggestAdditionalTestCases(req: ParsedRequirement): string[] {
    const suggestions: string[] = [];
    const hasNegative = req.acceptance_criteria.some((ac) => /(error|fail|invalid|reject)/i.test(ac.text));
    const hasSecurity = req.acceptance_criteria.some((ac) => /(security|auth)/i.test(ac.text));
    const hasBoundary = req.business_rules.some((br) => /(format|validation|length|range)/i.test(br.text));

    if (!hasNegative) suggestions.push('Add negative test for invalid inputs/errors');
    if (!hasSecurity) suggestions.push('Include security acceptance criteria');
    if (!hasBoundary) suggestions.push('Define boundary limits and validation rules');
    if (!req.business_rules.length) suggestions.push('Add business rule extraction if applicable');
    if (req.acceptance_criteria.length < 3) suggestions.push('Expand acceptance criteria for better coverage');

    return suggestions;
  }
}

export const coverageAnalyzer = new CoverageAnalyzer();