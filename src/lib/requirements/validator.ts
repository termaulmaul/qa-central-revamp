import type { ValidationResult, ValidationError, ValidationWarning, RawRequirement, ParsedRequirement } from './types';

export interface ValidationRule {
  name: string;
  severity: 'error' | 'warning';
  check: (req: RawRequirement | ParsedRequirement) => string | null; // null = pass
}

const acText = (ac: string | { text?: string }): string =>
  typeof ac === 'string' ? ac : (ac.text ?? '');
const feature = (r: RawRequirement | ParsedRequirement): string | undefined =>
  'feature' in r ? r.feature : undefined;

const requiredFields: ValidationRule[] = [
  { name: 'feature-title', severity: 'error', check: (r) => !feature(r) && !r.title ? 'Missing feature or title' : null },
  { name: 'description', severity: 'warning', check: (r) => !r.description?.trim() ? 'Empty description reduces AI extraction quality' : null },
];

const contentQuality: ValidationRule[] = [
  {
    name: 'ac-too-few',
    severity: 'warning',
    check: (r) => Array.isArray(r.acceptance_criteria) && r.acceptance_criteria.length < 2
      ? 'Only 1 acceptance criterion — consider adding more for full coverage'
      : null,
  },
  {
    name: 'ac-too-vague',
    severity: 'warning',
    check: (r) => {
      if (!Array.isArray(r.acceptance_criteria)) return null;
      const vague = r.acceptance_criteria.filter((ac) => acText(ac).length < 15);
      return vague.length > 0 ? `${vague.length} vague (short) acceptance criteria — may not be testable` : null;
    },
  },
  {
    name: 'no-business-rules',
    severity: 'warning',
    check: (r) => !r.business_rules?.length ? 'No business rules defined — logic may be untested' : null,
  },
  {
    name: 'negative-cases',
    severity: 'warning',
    check: (r) => {
      if (!Array.isArray(r.acceptance_criteria)) return null;
      const hasNegative = r.acceptance_criteria.some((ac) =>
        /(error|fail|invalid|reject|timeout|denied|exception|wrong)/i.test(acText(ac)));
      return hasNegative ? null : 'No negative acceptance criteria — edge case coverage may be weak';
    },
  },
  {
    name: 'security-concern',
    severity: 'warning',
    check: (r) => {
      const text = `${feature(r) || ''} ${r.title || ''} ${r.description || ''}`.toLowerCase();
      const securityKeywords = /(auth|login|password|token|permission|role|payment|pii)/.test(text);
      if (!securityKeywords) return null;
      const hasSecurityAc = Array.isArray(r.acceptance_criteria) && r.acceptance_criteria.some((ac) =>
        /(security|auth|injection|encrypt|permission|unauthorized)/i.test(acText(ac)));
      return securityKeywords && !hasSecurityAc ? 'Feature involves auth/security but no security-related acceptance criteria' : null;
    },
  },
];

const ALL_RULES = [...requiredFields, ...contentQuality];

export class RequirementValidator {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[] = ALL_RULES) {
    this.rules = rules;
  }

  validate(req: RawRequirement | ParsedRequirement): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules) {
      try {
        const msg = rule.check(req);
        if (!msg) continue;
        const entry = { field: rule.name, message: msg, code: `VAL-${rule.name}` };
        if (rule.severity === 'error') errors.push(entry);
        else warnings.push(entry as ValidationWarning);
      } catch {
        // skip failing rule
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateMany(reqs: (RawRequirement | ParsedRequirement)[]): ValidationResult[] {
    return reqs.map((r) => this.validate(r));
  }
}

export const requirementValidator = new RequirementValidator();
