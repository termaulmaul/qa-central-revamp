import type { TestCaseStep, TestDataSet, Precondition } from './types';

export const STEP_TEMPLATES: Record<string, (target: string, platform: string) => TestCaseStep[]> = {
  Functional: (t, p) => [
    { step: 1, action: `Navigate to ${p} - ${t} page`, expected: `${p} page loads within SLA` },
    { step: 2, action: `Execute ${t} workflow`, expected: 'Workflow completes without errors' },
    { step: 3, action: 'Verify expected outcome', expected: 'Outcome matches acceptance criteria' },
  ],
  Negative: (t) => [
    { step: 1, action: `Navigate to form for ${t}`, expected: 'Form loads' },
    { step: 2, action: 'Submit invalid/empty input', expected: 'Validation error shown' },
    { step: 3, action: 'Verify system state unchanged', expected: 'No partial updates' },
  ],
  Security: (t) => [
    { step: 1, action: `Attempt ${t} with unauthorized role`, expected: 'Access denied (403)' },
    { step: 2, action: 'Try SQL injection on input fields', expected: 'Input sanitized' },
    { step: 3, action: `Attempt privilege escalation in ${t}`, expected: 'Escalation blocked' },
  ],
  API: (t) => [
    { step: 1, action: `Send API request for ${t}`, expected: '200/201 response received' },
    { step: 2, action: 'Validate response schema', expected: 'Response matches swagger spec' },
    { step: 3, action: 'Verify error response for bad request', expected: '400/422 returned' },
  ],
};

export const PRECONDITION_TEMPLATES: Record<string, Precondition[]> = {
  standard: [
    { id: 'PC-01', description: 'Environment is deployed to target', verified: false },
    { id: 'PC-02', description: 'Test data seeded', verified: false },
  ],
  api: [
    { id: 'PC-API-01', description: 'API endpoint is reachable', verified: false },
    { id: 'PC-API-02', description: 'Auth token generated', verified: false },
  ],
};

export const TEST_DATA_TEMPLATES: Record<string, TestDataSet[]> = {
  standard: [
    { name: 'Positive Case', type: 'valid', values: { input: 'valid' }, description: 'Standard positive test' },
    { name: 'Negative Case', type: 'invalid', values: { input: '' }, description: 'Empty/null value test' },
    { name: 'Boundary Case', type: 'boundary', values: { input: 1 }, description: 'Boundary value test' },
  ],
};