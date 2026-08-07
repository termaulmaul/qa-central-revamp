export const pipelineMetrics = {
  bugsFound: 36,
  automatedSpecs: 124,
  passedRuns: 89,
  failedRuns: 5,
  coverage: '85%',
  coverageFocus: 'Master Data / Pengaturan Akademik'
};

export const pipelineSteps = [
  'Requirement',
  'Test Case Generation',
  'UI Inspection',
  'Page Object',
  'Spec',
  'Fixture',
  'Cypress Run',
  'Mochawesome Report',
  'Bug Tracker',
  'Developer Output'
];

export const mockBugs = [
  { id: 'BUG-001', module: 'Auth', feature: 'Login', severity: 'Critical', status: 'Open' },
  { id: 'BUG-002', module: 'Academic', feature: 'Settings', severity: 'Medium', status: 'In Progress' }
];
