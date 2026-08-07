import type { QaseCase, QaseSuite } from '../../types/qase';
import type { QaseCaseRaw } from './cases';
import type { QaseSuiteRaw } from './suites';

export const toQaseSuite = (suite: QaseSuiteRaw): QaseSuite => ({
  id: suite.id,
  title: suite.title,
  parentId: suite.parent_id,
  casesCount: suite.cases_count,
});

export const toQaseCase = (testCase: QaseCaseRaw): QaseCase => ({
  id: testCase.id,
  title: testCase.title,
  suiteId: testCase.suite_id,
  severity: testCase.severity,
  priority: testCase.priority,
  type: testCase.type,
  behavior: testCase.behavior,
  automationStatus: testCase.automation,
  status: testCase.status,
  preconditions: testCase.preconditions,
  postconditions: testCase.postconditions,
  steps: (testCase.steps ?? []).map((step) => ({
    action: step.action,
    expectedResult: step.expected_result,
    data: step.data,
  })),
  tags: (testCase.tags ?? []).map((tag) => tag.title),
  updatedAt: testCase.updated_at,
});
