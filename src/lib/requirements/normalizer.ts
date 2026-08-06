import type {
  RawRequirement,
  RequirementRisk,
  RequirementPlatform,
} from './types';

export interface NormalizationRule {
  name: string;
  apply: (raw: RawRequirement) => RawRequirement;
}

const trimStrings = (r: RawRequirement): RawRequirement => ({
  ...r,
  requirement_id: r.requirement_id?.trim(),
  feature: r.feature?.trim(),
  title: r.title?.trim(),
  description: r.description?.trim(),
  source: r.source,
  owner: r.owner?.trim(),
});

const deduplicateAcceptanceCriteria = (r: RawRequirement): RawRequirement => ({
  ...r,
  acceptance_criteria: [...new Set(r.acceptance_criteria?.map((s) => s.trim()).filter(Boolean) ?? [])],
});

const deduplicateBusinessRules = (r: RawRequirement): RawRequirement => ({
  ...r,
  business_rules: [...new Set(r.business_rules?.map((s) => s.trim()).filter(Boolean) ?? [])],
});

const normalizeRisk = (r: RawRequirement): RawRequirement => {
  const v = r.risk?.toString().toUpperCase().trim();
  const valid: RequirementRisk[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return { ...r, risk: valid.includes(v as RequirementRisk) ? (v as RequirementRisk) : 'MEDIUM' };
};

const normalizePlatform = (r: RawRequirement): RawRequirement => {
  const v = r.platform?.toString().trim();
  const valid: RequirementPlatform[] = ['Web', 'Android', 'API', 'iOS', 'Desktop'];
  if (v && valid.includes(v as RequirementPlatform)) return r;
  // remove invalid platform, let parser infer
  const rest = { ...r };
  delete rest.platform;
  return rest;
};

const fillTitleFromFeature = (r: RawRequirement): RawRequirement => {
  if (!r.title && r.feature) return { ...r, title: r.feature };
  if (!r.feature && r.title) return { ...r, feature: r.title };
  return r;
};

const DEFAULT_RULES: NormalizationRule[] = [
  { name: 'trim-strings', apply: trimStrings },
  { name: 'deduplicate-ac', apply: deduplicateAcceptanceCriteria },
  { name: 'deduplicate-br', apply: deduplicateBusinessRules },
  { name: 'normalize-risk', apply: normalizeRisk },
  { name: 'normalize-platform', apply: normalizePlatform },
  { name: 'fill-title-feature', apply: fillTitleFromFeature },
];

export class RequirementNormalizer {
  private rules: NormalizationRule[];

  constructor(rules: NormalizationRule[] = DEFAULT_RULES) {
    this.rules = rules;
  }

  normalize(raw: RawRequirement): RawRequirement {
    let result = { ...raw };
    for (const rule of this.rules) {
      try {
        result = rule.apply(result);
      } catch {
        // skip failing rule, continue normalization
      }
    }
    return result;
  }

  normalizeMany(raws: RawRequirement[]): RawRequirement[] {
    return raws.map((r) => this.normalize(r));
  }
}

export const requirementNormalizer = new RequirementNormalizer();
