export type RequirementSource =
  | 'Manual Input'
  | 'Jira'
  | 'Confluence'
  | 'Azure DevOps'
  | 'GitHub Issue'
  | 'GitHub PR'
  | 'GitLab Issue'
  | 'Linear'
  | 'Notion'
  | 'Google Docs'
  | 'Swagger/OpenAPI'
  | 'Postman Collection'
  | 'Markdown'
  | 'PDF'
  | 'DOCX'
  | 'TXT'
  | 'HTML'
  | 'URL';

export type RequirementPlatform = 'Web' | 'Android' | 'API' | 'iOS' | 'Desktop';
export type RequirementStatus = 'draft' | 'validated' | 'approved' | 'rejected' | 'archived';
export type RequirementRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RequirementPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface RawRequirement {
  requirement_id?: string;
  feature?: string;
  title?: string;
  description?: string;
  acceptance_criteria?: string[];
  business_rules?: string[];
  risk?: RequirementRisk;
  automation_candidate?: boolean;
  source?: RequirementSource;
  owner?: string;
  platform?: RequirementPlatform;
  metadata?: Record<string, unknown>;
}

export interface ParsedRequirement {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: AcceptanceCriterion[];
  business_rules: BusinessRule[];
  source: RequirementSource;
  owner: string;
  platform: RequirementPlatform;
  status: RequirementStatus;
  coverage: number;
  cases: number;
  updatedAt: string;
  risk: RequirementRisk;
  automation_candidate: boolean;
  traceability: TraceabilityLink[];
  metadata: RequirementMetadata;
}

export interface AcceptanceCriterion {
  id: string;
  text: string;
  type: 'functional' | 'non-functional' | 'security' | 'performance' | 'accessibility' | 'usability';
  priority: RequirementPriority;
  testable: boolean;
  derived_from?: string;
}

export interface BusinessRule {
  id: string;
  text: string;
  category: 'validation' | 'calculation' | 'workflow' | 'authorization' | 'data-integrity' | 'compliance' | 'other';
  priority: RequirementPriority;
  related_acceptance_criteria: string[];
  testable: boolean;
}

export interface RequirementMetadata {
  feature?: string;
  business_goal?: string;
  actors?: string[];
  flows?: string[];
  exceptions?: string[];
  validations?: string[];
  dependencies?: string[];
  negative_cases?: string[];
  edge_cases?: string[];
  hidden_requirements?: string[];
  non_functional?: NonFunctionalRequirement[];
  testability_score?: number;
  automation_score?: number;
  extraction_confidence?: number;
}

export interface NonFunctionalRequirement {
  category: 'security' | 'performance' | 'accessibility' | 'compatibility' | 'compliance' | 'reliability' | 'scalability' | 'maintainability';
  description: string;
  metric?: string;
  threshold?: string;
  priority: RequirementPriority;
}

export interface TraceabilityLink {
  type: 'requirement' | 'acceptance_criterion' | 'business_rule' | 'test_case' | 'automation' | 'execution' | 'defect' | 'fix';
  target_id: string;
  target_type: string;
  relationship: 'covers' | 'derived_from' | 'validates' | 'blocks' | 'depends_on';
}

export interface RequirementGraph {
  nodes: RequirementGraphNode[];
  edges: RequirementGraphEdge[];
}

export interface RequirementGraphNode {
  id: string;
  type: 'requirement' | 'acceptance_criterion' | 'business_rule' | 'test_case' | 'automation' | 'defect';
  label: string;
  data: Record<string, unknown>;
  risk?: RequirementRisk;
  coverage?: number;
}

export interface RequirementGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight?: number;
}

export interface CoverageAnalysis {
  requirement_coverage: number;
  risk_coverage: number;
  scenario_coverage: number;
  negative_coverage: number;
  automation_coverage: number;
  business_rule_coverage: number;
  gaps: CoverageGap[];
}

export interface CoverageGap {
  type: 'requirement' | 'risk' | 'scenario' | 'negative' | 'automation' | 'business_rule';
  requirement_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_test_cases: string[];
}

export interface ExtractionResult {
  requirements: ParsedRequirement[];
  confidence: number;
  warnings: string[];
  source_format: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}