/**
 * Test Case Generator
 * Generates comprehensive test cases using bahan-page-qaautomation patterns
 * Template: "Verify [what] when user [action]"
 */

import type { Module, Feature } from './prd-parser'

export interface TestCaseStep {
  action: string
  expectedResult: string
  source: string
}

export interface GeneratedTestCase {
  tcId: string
  title: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  behavior: 'Positive' | 'Negative'
  type: string
  precondition: string
  postcondition: string
  steps: TestCaseStep[]
  tags: string[]
  module: string
  relatedFeature: string
}

/**
 * Convert priority levels between systems
 */
function priorityToP(priority: 'Critical' | 'High' | 'Medium' | 'Low'): 'P0' | 'P1' | 'P2' | 'P3' {
  switch (priority) {
    case 'Critical':
      return 'P0'
    case 'High':
      return 'P1'
    case 'Medium':
      return 'P2'
    case 'Low':
      return 'P3'
  }
}

/**
 * Template-based test case scenarios
 * Pattern: "Verify [capability] when user [performs action]"
 */
const testCaseTemplates = [
  // Positive flow - Primary functionality
  {
    pattern: 'accessibility',
    template: (name: string) => ({
      title: `Verify ${name} is accessible and displays correctly when user navigates`,
      precondition: 'User is on the system',
      steps: [
        { action: `Navigate to ${name}`, expectedResult: 'Page/feature loads successfully' },
      ],
    }),
  },

  // Display and data
  {
    pattern: 'display',
    template: (name: string) => ({
      title: `Verify ${name} displays all required information when user views the interface`,
      precondition: 'User is authenticated',
      steps: [{ action: `View ${name} interface`, expectedResult: 'All data elements are visible' }],
    }),
  },

  // Functionality
  {
    pattern: 'functionality',
    template: (name: string, action: string) => ({
      title: `Verify ${name} works correctly when user ${action}`,
      precondition: 'User has required permissions',
      steps: [{ action: `User performs: ${action}`, expectedResult: `${name} functions as expected` }],
    }),
  },

  // Add/Create operations
  {
    pattern: 'add',
    template: (name: string) => ({
      title: `Verify ${name} is added when user clicks the add button and confirms`,
      precondition: 'User is on the list view',
      steps: [
        { action: 'Click add button', expectedResult: 'Dialog or form appears' },
        { action: 'Enter required details', expectedResult: 'Form validates input' },
        { action: 'Click confirm', expectedResult: `New ${name} is created and displayed` },
      ],
    }),
  },

  // Edit/Update operations
  {
    pattern: 'edit',
    template: (name: string) => ({
      title: `Verify ${name} is updated when user edits and saves changes`,
      precondition: `${name} exists in the system`,
      steps: [
        { action: `Click edit on ${name}`, expectedResult: 'Edit form/dialog appears' },
        { action: 'Modify fields', expectedResult: 'Changes are validated' },
        { action: 'Click save', expectedResult: `${name} is updated successfully` },
      ],
    }),
  },

  // Delete operations
  {
    pattern: 'delete',
    template: (name: string) => ({
      title: `Verify ${name} is removed when user clicks delete and confirms`,
      precondition: `${name} exists in the system`,
      steps: [
        { action: `Click delete on ${name}`, expectedResult: 'Confirmation dialog appears' },
        { action: 'Click confirm', expectedResult: `${name} is permanently removed` },
      ],
    }),
  },

  // Search and filter
  {
    pattern: 'filter',
    template: (name: string, criterion: string) => ({
      title: `Verify ${name} results are updated when ${criterion} is applied`,
      precondition: 'List of items exists',
      steps: [
        { action: `Apply filter: ${criterion}`, expectedResult: 'Results table reflects active filter criteria' },
      ],
    }),
  },
  
  // Custom Preset (Save / Rename / Delete)
  {
    pattern: 'preset',
    template: (name: string, action: string) => ({
      title: `Verify ${name} preset is ${action} when user confirms action`,
      precondition: 'Screener configuration is active',
      steps: [
        { action: `${action} preset`, expectedResult: 'System confirms the change' },
      ],
    }),
  },

  // Persistence
  {
    pattern: 'persist',
    template: (name: string) => ({
      title: `Verify ${name} persists across sessions when user saves and closes`,
      precondition: 'User has configured settings',
      steps: [
        { action: 'Save configuration', expectedResult: 'Success confirmation shown' },
        { action: 'Close and reopen session', expectedResult: `${name} configuration is restored` },
      ],
    }),
  },

  // Calculation and accuracy
  {
    pattern: 'calculate',
    template: (name: string, operation: string) => ({
      title: `Verify ${name} is calculated correctly when user performs ${operation}`,
      precondition: 'Required data is available',
      steps: [
        {
          action: `Perform ${operation}`,
          expectedResult: `${name} matches expected calculation`,
        },
      ],
    }),
  },

  // Error handling (Negative)
  {
    pattern: 'error',
    template: (name: string) => ({
      title: `Verify error is shown when user provides invalid input to ${name}`,
      precondition: 'User is on input form',
      steps: [
        { action: 'Enter invalid data', expectedResult: 'Validation error is displayed' },
        { action: 'Review error message', expectedResult: 'Message is clear and actionable' },
      ],
    }),
  },

  // Empty state
  {
    pattern: 'empty',
    template: (name: string) => ({
      title: `Verify empty state is displayed when no ${name} are available`,
      precondition: 'No data exists',
      steps: [{ action: `View ${name} interface`, expectedResult: 'Empty state message appears' }],
    }),
  },

  // Loading state
  {
    pattern: 'loading',
    template: (name: string) => ({
      title: `Verify loading indicator is shown when ${name} is loading`,
      precondition: 'User triggers data fetch',
      steps: [
        { action: 'Request data', expectedResult: 'Loading spinner/indicator appears' },
        { action: 'Wait for completion', expectedResult: 'Data loads and spinner disappears' },
      ],
    }),
  },

  // Pagination
  {
    pattern: 'pagination',
    template: (name: string) => ({
      title: `Verify pagination works correctly when user navigates ${name} pages`,
      precondition: 'Multiple pages of data exist',
      steps: [
        { action: 'Click next page', expectedResult: 'Next page loads' },
        { action: 'Click previous page', expectedResult: 'Previous page loads' },
      ],
    }),
  },

  // Sorting
  {
    pattern: 'sort',
    template: (name: string) => ({
      title: `Verify ${name} is sorted correctly when user clicks column header`,
      precondition: 'List view is displayed',
      steps: [
        { action: 'Click sort column', expectedResult: `${name} is sorted in ascending order` },
        { action: 'Click again', expectedResult: `${name} is sorted in descending order` },
      ],
    }),
  },

  // Permission/gating
  {
    pattern: 'permission',
    template: (name: string, permission: string) => ({
      title: `Verify ${name} is only accessible when user has ${permission} permission`,
      precondition: `User lacks ${permission}`,
      steps: [
        { action: `Attempt to access ${name}`, expectedResult: 'Access is denied' },
        { action: 'Review error message', expectedResult: 'Permission message is clear' },
      ],
    }),
  },
]

/**
 * Extract domain-specific keywords from feature description
 */
function extractKeywords(featureName: string, description: string): string[] {
  const text = `${featureName} ${description}`.toLowerCase()
  const keywords: string[] = []

  // Action keywords
  if (text.includes('create') || text.includes('add')) keywords.push('create')
  if (text.includes('update') || text.includes('edit')) keywords.push('edit')
  if (text.includes('delete') || text.includes('remove')) keywords.push('delete')
  if (text.includes('filter') || text.includes('search')) keywords.push('filter')
  if (text.includes('sort')) keywords.push('sort')
  if (text.includes('export') || text.includes('download')) keywords.push('export')
  if (text.includes('import') || text.includes('upload')) keywords.push('import')
  if (text.includes('calculate') || text.includes('compute')) keywords.push('calculate')
  if (text.includes('validate') || text.includes('verify')) keywords.push('validation')
  if (text.includes('save') || text.includes('persist')) keywords.push('persist')

  return keywords
}

/**
 * Generate test cases for a single feature
 */
export function generateTestCasesForFeature(
  feature: Feature,
  module: Module,
  tcIdPrefix: string
): GeneratedTestCase[] {
  const testCases: GeneratedTestCase[] = []
  const keywords = extractKeywords(feature.name, feature.description)
  let tcNumber = 1

  // Generate positive test cases based on keywords
  for (const keyword of keywords) {
    const templateDef = testCaseTemplates.find((t) => t.pattern === keyword)
    if (templateDef) {
      const template =
        templateDef.pattern === 'admin'
          ? (templateDef.template as any)(feature.name, 'admin')
          : templateDef.pattern === 'calculate'
            ? (templateDef.template as any)(feature.name, 'calculation')
            : (templateDef.template as any)(feature.name)

      testCases.push({
        tcId: `${tcIdPrefix}-${tcNumber}`,
        title: template.title,
        priority: priorityToP(module.priority),
        behavior: 'Positive',
        type: 'Functional',
        precondition: template.precondition || 'User is logged in',
        postcondition: `${feature.name} state is verified`,
        steps: template.steps.map((step: any) => ({
          action: step.action,
          expectedResult: step.expectedResult,
          source: feature.id,
        })),
        tags: [
          'functional',
          keyword,
          module.priority.toLowerCase(),
          feature.id.toLowerCase(),
        ],
        module: module.id,
        relatedFeature: feature.id,
      })

      tcNumber++
    }
  }

  // Add error handling test (negative case)
  if (tcNumber <= module.estimatedTestCases) {
    testCases.push({
      tcId: `${tcIdPrefix}-${tcNumber}`,
      title: `Verify error handling for ${feature.name} when user provides invalid input`,
      priority: priorityToP(module.priority === 'Critical' ? 'High' : module.priority),
      behavior: 'Negative',
      type: 'Functional',
      precondition: 'User is on input interface',
      postcondition: 'Error state is properly handled',
      steps: [
        {
          action: 'Provide invalid input to ' + feature.name,
          expectedResult: 'Error message is displayed',
          source: feature.id,
        },
      ],
      tags: ['error-handling', 'negative', feature.id.toLowerCase()],
      module: module.id,
      relatedFeature: feature.id,
    })

    tcNumber++
  }

  // Add edge case test
  if (tcNumber <= module.estimatedTestCases) {
    testCases.push({
      tcId: `${tcIdPrefix}-${tcNumber}`,
      title: `Verify edge case handling for ${feature.name}`,
      priority: 'P2',
      behavior: 'Positive',
      type: 'Functional',
      precondition: 'System is in a valid state',
      postcondition: `${feature.name} handles edge case gracefully`,
      steps: [
        {
          action: 'Execute boundary condition for ' + feature.name,
          expectedResult: 'System behaves as expected',
          source: feature.id,
        },
      ],
      tags: ['edge-case', 'boundary', feature.id.toLowerCase()],
      module: module.id,
      relatedFeature: feature.id,
    })
  }

  return testCases
}

/**
 * Generate all test cases from modules and features
 */
export function generateAllTestCases(
  modules: Module[],
  features: Feature[]
): GeneratedTestCase[] {
  const allTestCases: GeneratedTestCase[] = []

  for (const module of modules) {
    // Get features related to this module
    const moduleFeatures = features.filter((f) => module.relatedFeatures.includes(f.id))

    // If no specific features linked, use all features
    if (moduleFeatures.length === 0) {
      const featuresToUse = features.slice(0, Math.min(3, features.length))
      for (const feature of featuresToUse) {
        const tcIdPrefix = `${module.id}-${feature.id}`
        const testCases = generateTestCasesForFeature(feature, module, tcIdPrefix)
        allTestCases.push(...testCases)
      }
    } else {
      for (const feature of moduleFeatures) {
        const tcIdPrefix = `${module.id}-${feature.id}`
        const testCases = generateTestCasesForFeature(feature, module, tcIdPrefix)
        allTestCases.push(...testCases)
      }
    }
  }

  return allTestCases
}

/**
 * Generate summary statistics
 */
export function generateTestSummary(testCases: GeneratedTestCase[]): {
  total: number
  byPriority: Record<string, number>
  byBehavior: Record<string, number>
  byType: Record<string, number>
} {
  return {
    total: testCases.length,
    byPriority: {
      P0: testCases.filter((tc) => tc.priority === 'P0').length,
      P1: testCases.filter((tc) => tc.priority === 'P1').length,
      P2: testCases.filter((tc) => tc.priority === 'P2').length,
      P3: testCases.filter((tc) => tc.priority === 'P3').length,
    },
    byBehavior: {
      Positive: testCases.filter((tc) => tc.behavior === 'Positive').length,
      Negative: testCases.filter((tc) => tc.behavior === 'Negative').length,
    },
    byType: {
      Functional: testCases.filter((tc) => tc.type === 'Functional').length,
    },
  }
}
