import type { RequirementRisk, RequirementPriority, ParsedRequirement } from './types';

export interface RiskFactor {
  name: string;
  weight: number;
  evaluate: (req: ParsedRequirement) => number; // 0-1 score
}

export interface RiskAssessment {
  overallRisk: RequirementRisk;
  riskScore: number; // 0-100
  factors: { name: string; score: number; weight: number; contribution: number }[];
  mitigationSuggestions: string[];
}

const RISK_FACTORS: RiskFactor[] = [
  {
    name: 'explicit-risk-rating',
    weight: 0.25,
    evaluate: (req) => {
      const map: Record<RequirementRisk, number> = { LOW: 0.1, MEDIUM: 0.4, HIGH: 0.7, CRITICAL: 0.95 };
      return map[req.risk] ?? 0.4;
    },
  },
  {
    name: 'security-sensitivity',
    weight: 0.2,
    evaluate: (req) => {
      const text = `${req.title} ${req.description} ${req.acceptance_criteria.map((ac) => ac.text).join(' ')}`.toLowerCase();
      const keywords = ['auth', 'password', 'token', 'payment', 'pii', 'credit', 'ssn', 'encryption', 'authorization', 'privilege', 'compliance', 'gdpr', 'hipaa', 'pci'];
      const hits = keywords.filter((k) => text.includes(k)).length;
      return Math.min(hits * 0.15, 1);
    },
  },
  {
    name: 'complexity-indicators',
    weight: 0.15,
    evaluate: (req) => {
      const text = `${req.description} ${req.business_rules.map((br) => br.text).join(' ')}`.toLowerCase();
      const indicators = ['workflow', 'multi-step', 'dependency', 'integration', 'third-party', 'async', 'concurrent', 'distributed', 'orchestration'];
      const hits = indicators.filter((i) => text.includes(i)).length;
      return Math.min(hits * 0.12, 1);
    },
  },
  {
    name: 'acceptance-criteria-coverage',
    weight: 0.15,
    evaluate: (req) => {
      const acCount = req.acceptance_criteria.length;
      const brCount = req.business_rules.length;
      const total = acCount + brCount;
      if (total === 0) return 0.9; // high risk if nothing specified
      if (total < 3) return 0.6;
      if (total < 6) return 0.3;
      return 0.1;
    },
  },
  {
    name: 'automation-candidate',
    weight: 0.1,
    evaluate: (req) => (req.automation_candidate ? 0.1 : 0.5),
  },
  {
    name: 'non-functional-requirements',
    weight: 0.1,
    evaluate: (req) => {
      const nfrCount = req.metadata.non_functional?.length ?? 0;
      return nfrCount >= 3 ? 0.1 : nfrCount >= 1 ? 0.4 : 0.7;
    },
  },
];

const RISK_THRESHOLDS = [
  { max: 0.25, risk: 'LOW' as RequirementRisk },
  { max: 0.5, risk: 'MEDIUM' as RequirementRisk },
  { max: 0.75, risk: 'HIGH' as RequirementRisk },
  { max: 1, risk: 'CRITICAL' as RequirementRisk },
];

export class RiskAnalyzer {
  private factors: RiskFactor[];

  constructor(factors: RiskFactor[] = RISK_FACTORS) {
    this.factors = factors;
  }

  analyze(req: ParsedRequirement): RiskAssessment {
    const factorResults = this.factors.map((f) => {
      const score = f.evaluate(req);
      return {
        name: f.name,
        score,
        weight: f.weight,
        contribution: score * f.weight,
      };
    });

    const riskScore = factorResults.reduce((sum, f) => sum + f.contribution, 0) * 100;
    const overallRisk = RISK_THRESHOLDS.find((t) => riskScore / 100 <= t.max)?.risk ?? 'CRITICAL';
    const mitigations = this.generateMitigations(factorResults);

    return { overallRisk, riskScore, factors: factorResults, mitigationSuggestions: mitigations };
  }

  private generateMitigations(factors: RiskAssessment['factors']): string[] {
    const mitigations: string[] = [];
    for (const f of factors) {
      if (f.contribution >= f.weight * 0.7) {
        switch (f.name) {
          case 'explicit-risk-rating':
            mitigations.push('Review risk rating with stakeholders — CRITICAL items need explicit sign-off');
            break;
          case 'security-sensitivity':
            mitigations.push('Add security-specific acceptance criteria (auth bypass, injection, data leakage)');
            mitigations.push('Schedule penetration testing for this requirement');
            break;
          case 'complexity-indicators':
            mitigations.push('Break into smaller requirements with independent testability');
            mitigations.push('Add integration test cases for each dependency');
            break;
          case 'acceptance-criteria-coverage':
            mitigations.push('Define at least 3 acceptance criteria + 2 business rules');
            mitigations.push('Add negative and boundary test conditions');
            break;
          case 'automation-candidate':
            mitigations.push('Design test cases for automation from the start');
            break;
          case 'non-functional-requirements':
            mitigations.push('Define performance, security, accessibility criteria explicitly');
            break;
        }
      }
    }
    return [...new Set(mitigations)];
  }

  static calculatePriority(risk: RequirementRisk, businessImpact: 'low' | 'medium' | 'high' = 'medium'): RequirementPriority {
    if (risk === 'CRITICAL' || businessImpact === 'high') return 'P0';
    if (risk === 'HIGH') return 'P1';
    if (risk === 'MEDIUM') return 'P2';
    return 'P3';
  }
}

export const riskAnalyzer = new RiskAnalyzer();