import type {
  AcceptanceCriterion,
  BusinessRule,
  ParsedRequirement,
} from '../requirements/types';

export type TestCaseType =
  | 'Functional'
  | 'Regression'
  | 'Integration'
  | 'API'
  | 'UI'
  | 'UX'
  | 'Accessibility'
  | 'Security'
  | 'Performance'
  | 'Boundary'
  | 'Negative'
  | 'Exploratory'
  | 'Smoke'
  | 'Sanity'
  | 'Compatibility'
  | 'Localization'
  | 'Database'
  | 'Concurrency'
  | 'Recovery'
  | 'Chaos'
  | 'Role-Based'
  | 'Permission'
  | 'Workflow'
  | 'End-to-End';

export type TestCasePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type TestCaseSeverity = 'Critical' | 'Major' | 'Minor' | 'Cosmetic';
export type TestCaseStatus = 'Draft' | 'AI Generated' | 'Under Review' | 'Reviewed' | 'Approved' | 'Synced' | 'Rejected' | 'Blocked';

export interface TestCaseStep {
  step: number;
  action: string;
  expected: string;
  data?: Record<string, unknown>;
  attachments?: string[];
}

export interface TestDataSet {
  name: string;
  type: 'valid' | 'invalid' | 'boundary' | 'edge' | 'negative';
  values: Record<string, unknown>;
  description: string;
}

export interface Precondition {
  id: string;
  description: string;
  verified: boolean;
}

export interface TestCase {
  id: string;
  requirementId: string;
  title: string;
  description?: string;
  type: TestCaseType;
  priority: TestCasePriority;
  severity: TestCaseSeverity;
  automation_candidate: boolean;
  preconditions: Precondition[];
  testData: TestDataSet[];
  steps: TestCaseStep[];
  expectedResult: string;
  cleanup?: string[];
  tags: string[];
  traceability: TraceabilityLink[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedDuration: number; // minutes
  status: TestCaseStatus;
  qase_id?: string | null;
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  generatedBy: 'AI' | 'Manual' | 'Hybrid';
  reviewNotes?: string;
  approvalHistory: ApprovalRecord[];
}

export interface TraceabilityLink {
  type: 'requirement' | 'acceptance_criterion' | 'business_rule' | 'test_case' | 'automation' | 'execution' | 'defect' | 'fix';
  target_id: string;
  target_type: string;
  relationship: 'covers' | 'derived_from' | 'validates' | 'blocks' | 'depends_on';
}

export interface ApprovalRecord {
  action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'synced';
  by: string;
  at: string;
  comment?: string;
}

export interface GenerationContext {
  requirement: ParsedRequirement;
  businessRules: BusinessRule[];
  acceptanceCriteria: AcceptanceCriterion[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  platform: 'Web' | 'Android' | 'API' | 'iOS' | 'Desktop';
  testTypes: TestCaseType[];
  targetCoverage: 'basic' | 'standard' | 'comprehensive';
  includeNegative: boolean;
  includeSecurity: boolean;
  includePerformance: boolean;
  includeAccessibility: boolean;
  includeCompatibility: boolean;
}

export interface GenerationResult {
  testCases: TestCase[];
  coverage: number;
  warnings: string[];
  metadata: {
    generatedAt: string;
    model: string;
    promptVersion: string;
    contextHash: string;
  };
}

export interface TestDesignStrategy {
  name: string;
  testTypes: TestCaseType[];
  priority: TestCasePriority[];
  coverageTargets: {
    functional: number;
    negative: number;
    boundary: number;
    security: number;
    performance: number;
    accessibility: number;
  };
  minCasesPerRequirement: number;
}