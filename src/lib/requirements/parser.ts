import type {
  ParsedRequirement,
  RawRequirement,
  RequirementPlatform,
  RequirementRisk,
  RequirementSource,
  AcceptanceCriterion,
  BusinessRule,
  RequirementMetadata,
} from './types';

// ponytail: timestamp-based ID, replace with ULID/UUID if collision risk at scale
let counter = 0;
function genId(prefix: string): string {
  counter += 1;
  const ts = Date.now();
  const rand = Math.floor((ts + counter) % 100000);
  return `${prefix}-${ts}${String(rand).padStart(5, '0')}`;
}

export function inferPlatform(feature: string, description = ''): RequirementPlatform {
  const lower = `${feature} ${description}`.toLowerCase();
  if (/(ios|iphone|ipad)/.test(lower)) return 'iOS';
  if (/(android|mobile|kotlin|swift)/.test(lower)) return 'Android';
  if (/(api|endpoint|rest|graphql|service|microservice|grpc)/.test(lower)) return 'API';
  if (/(desktop|electron|windows|macos)/.test(lower)) return 'Desktop';
  return 'Web';
}

export function inferRisk(text: string): RequirementRisk {
  const lower = text.toLowerCase();
  const critical = /(critical|security breach|data loss|payment|financial|pii|compliance|gdpr|hipaa|pci)/.test(lower);
  const high = /(security|authentication|authorization|payment|vulnerab|injection|privilege)/.test(lower);
  const low = /(cosmetic|ui|display|label|documentation|logging|non-critical)/.test(lower);
  if (critical) return 'CRITICAL';
  if (high) return 'HIGH';
  if (low) return 'LOW';
  return 'MEDIUM';
}

export function inferSource(raw?: string): RequirementSource {
  if (!raw) return 'Manual Input';
  const s = raw.toLowerCase();
  if (s.includes('jira')) return 'Jira';
  if (s.includes('confluence')) return 'Confluence';
  if (s.includes('azure') || s.includes('devops')) return 'Azure DevOps';
  if (s.includes('github') && s.includes('pr')) return 'GitHub PR';
  if (s.includes('github')) return 'GitHub Issue';
  if (s.includes('gitlab')) return 'GitLab Issue';
  if (s.includes('linear')) return 'Linear';
  if (s.includes('notion')) return 'Notion';
  if (s.includes('google doc')) return 'Google Docs';
  if (s.includes('swagger') || s.includes('openapi')) return 'Swagger/OpenAPI';
  if (s.includes('postman')) return 'Postman Collection';
  if (s.includes('pdf')) return 'PDF';
  if (s.includes('docx')) return 'DOCX';
  if (s.includes('html')) return 'HTML';
  if (s.includes('url') || s.includes('http')) return 'URL';
  if (s.includes('txt')) return 'TXT';
  if (s.includes('markdown') || s.includes('.md')) return 'Markdown';
  return 'Manual Input';
}

export function parseAcceptanceCriterion(
  text: string,
  index: number,
  requirementId: string,
): AcceptanceCriterion {
  const lower = text.toLowerCase();
  const type: AcceptanceCriterion['type'] = /(security|auth|injection|encrypt|permission)/.test(lower)
    ? 'security'
    : /(performance|latency|response time|throughput|sla)/.test(lower)
      ? 'performance'
      : /(accessib|wcag|screen reader|aria|contrast)/.test(lower)
        ? 'accessibility'
        : /(non-functional|scalab|reliab|compatib|usab)/.test(lower)
          ? 'non-functional'
          : 'functional';
  const priority = inferRisk(text) === 'CRITICAL' ? 'P0' : inferRisk(text) === 'HIGH' ? 'P1' : 'P2';
  return {
    id: `${requirementId}-AC-${String(index + 1).padStart(2, '0')}`,
    text,
    type,
    priority: priority as AcceptanceCriterion['priority'],
    testable: !/cannot be tested|manual only|subjective/.test(lower),
    derived_from: requirementId,
  };
}

export function parseBusinessRule(
  text: string,
  index: number,
  requirementId: string,
): BusinessRule {
  const lower = text.toLowerCase();
  const category: BusinessRule['category'] = /(validate|format|input|regex)/.test(lower)
    ? 'validation'
    : /(calculat|formul|sum|total|interest|tax)/.test(lower)
      ? 'calculation'
      : /(workflow|step|process|approve|review|sequence)/.test(lower)
        ? 'workflow'
        : /(auth|permission|role|access|privilege)/.test(lower)
          ? 'authorization'
          : /(consistency|integrity|constraint|referen|duplicate)/.test(lower)
            ? 'data-integrity'
            : /(complian|regulation|legal|gdpr|hipaa|pci)/.test(lower)
              ? 'compliance'
              : 'other';
  return {
    id: `${requirementId}-BR-${String(index + 1).padStart(2, '0')}`,
    text,
    category,
    priority: inferRisk(text) === 'CRITICAL' ? 'P0' : inferRisk(text) === 'HIGH' ? 'P1' : 'P2',
    related_acceptance_criteria: [],
    testable: true,
  };
}

export class RequirementParser {
  parse(raw: RawRequirement, defaultSource: RequirementSource = 'Manual Input', defaultOwner = 'User'): ParsedRequirement {
    const id = raw.requirement_id?.trim() || genId('REQ');
    const title = (raw.title || raw.feature || raw.requirement_id || 'Untitled Requirement').trim();
    const platform = raw.platform || inferPlatform(raw.feature || '', raw.description || '');
    const risk = raw.risk || inferRisk(`${title} ${raw.description || ''}`);
    const source = raw.source || defaultSource;
    const owner = raw.owner || defaultOwner;

    const acceptance_criteria = Array.isArray(raw.acceptance_criteria)
      ? raw.acceptance_criteria.map((ac, i) => parseAcceptanceCriterion(ac, i, id))
      : [];
    const business_rules = Array.isArray(raw.business_rules)
      ? raw.business_rules.map((br, i) => parseBusinessRule(br, i, id))
      : [];

    const metadata: RequirementMetadata = {
      feature: raw.feature,
      actors: extractActors(`${title} ${raw.description || ''}`),
      flows: extractFlows(raw.description || ''),
      exceptions: extractExceptions(raw.description || ''),
      validations: extractValidations(raw.description || ''),
      extraction_confidence: 1,
    };

    return {
      id,
      title,
      description: raw.description || '',
      acceptance_criteria,
      business_rules,
      source,
      owner,
      platform,
      status: 'draft',
      coverage: 0,
      cases: 0,
      updatedAt: new Date().toISOString(),
      risk,
      automation_candidate: raw.automation_candidate ?? true,
      traceability: [],
      metadata,
    };
  }

  parseMany(raws: RawRequirement[], source?: RequirementSource, owner?: string): ParsedRequirement[] {
    return raws.map((r) => this.parse(r, source, owner));
  }
}

function extractActors(text: string): string[] {
  const patterns = [
    /system admin/gi,
    /administrator/gi,
    /user/gi,
    /customer/gi,
    /guest/gi,
    /api client/gi,
    /third[- ]party/gi,
    /reviewer/gi,
    /approver/gi,
    /manager/gi,
  ];
  const found = new Set<string>();
  for (const p of patterns) {
    const m = text.match(p);
    if (m) found.add(m[0].toLowerCase());
  }
  return Array.from(found);
}

function extractFlows(text: string): string[] {
  return splitSentences(text).filter((s) =>
    /(when|if|on |upon|after|during|step|first|then|next|finally)/.test(s.toLowerCase()),
  );
}

function extractExceptions(text: string): string[] {
  return splitSentences(text).filter((s) =>
    /(except|error|fail|invalid|timeout|reject|denied|unauthorized|not found|exception)/.test(s.toLowerCase()),
  );
}

function extractValidations(text: string): string[] {
  return splitSentences(text).filter((s) =>
    /(must|should|validate|verify|ensure|required|allowed|format)/.test(s.toLowerCase()),
  );
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseRawRequirement(
  raw: RawRequirement,
  source?: RequirementSource,
  owner?: string,
): ParsedRequirement {
  return new RequirementParser().parse(raw, source, owner);
}
