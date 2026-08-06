/**
 * Unified Test Generator: Orchestrates the complete PRD to Test Cases pipeline
 * Integrates all classifiers and generators into a single, coherent flow
 */

import { analyzePatterns, type PatternAnalysis } from './prd-pattern-recognizer'
import { classifyTestType, type TestType, type ClassificationResult } from './test-type-classifier'
import { classifyBehavior, generateNegativeScenario, generateComprehensiveNegativeTests, type Behavior } from './behavior-classifier'
import { determinePriority, type Priority } from './priority-engine'

export interface EnrichedTestCase {
  id: string
  title: string
  behavior: Behavior
  testType: TestType
  priority: Priority
  sourceReference: string
  precondition: string
  postcondition: string
  steps: Array<{
    action: string
    expectedResult: string
  }>
  tags: string[]
  confidence: {
    typeConfidence: number
    behaviorConfidence: number
  }
  metadata: {
    isNegativeGenerated: boolean
    constraintBased: boolean
    errorBased: boolean
  }
}

export interface GenerationResult {
  testCases: EnrichedTestCase[]
  stats: {
    total: number
    positive: number
    negative: number
    p0: number
    p1: number
    p2: number
    byType: Record<TestType, number>
    generationTimeMs: number
  }
  issues: string[]
}

export interface RequirementBlock {
  id: string
  title: string
  content: string
  sourceSection: string
  lineNumber?: number
}

/**
 * Generates test cases from requirement blocks
 */
export function generateTestCasesFromRequirements(
  requirements: RequirementBlock[],
): GenerationResult {
  const startTime = Date.now()
  const testCases: EnrichedTestCase[] = []
  const issues: string[] = []
  let testIdCounter = 1

  for (const requirement of requirements) {
    try {
      // Step 1: Analyze patterns in requirement text
      const patterns = analyzePatterns(requirement.content)

      // Step 2: Classify test type
      const typeClassification = classifyTestType(requirement.content)

      // Step 3: Generate positive test case
      const positiveBehavior = extractBehaviorStatement(requirement)
      if (positiveBehavior) {
        const behaviorClassification = classifyBehavior(requirement.content, false)

        // Determine priority
        const priorityResult = determinePriority({
          text: requirement.content,
          featureName: requirement.title,
          testType: typeClassification.testType,
          behavior: 'Positive',
          detectedPriority: patterns.priority === 'unknown' ? 'P1' : patterns.priority,
        })

        // Create positive test case
        const positiveTestCase: EnrichedTestCase = {
          id: `TC${String(testIdCounter).padStart(4, '0')}`,
          title: formatTestCaseTitle(positiveBehavior),
          behavior: 'Positive',
          testType: typeClassification.testType,
          priority: priorityResult.priority,
          sourceReference: requirement.sourceSection,
          precondition: extractPrecondition(requirement, patterns),
          postcondition: extractPostcondition(requirement, patterns),
          steps: generateSteps(positiveBehavior),
          tags: extractTags(requirement, patterns, typeClassification.testType),
          confidence: {
            typeConfidence: typeClassification.confidence,
            behaviorConfidence: behaviorClassification.confidence,
          },
          metadata: {
            isNegativeGenerated: false,
            constraintBased: false,
            errorBased: false,
          },
        }
        testCases.push(positiveTestCase)
        testIdCounter++
      }

      // Step 4: Generate negative test cases (if applicable)
      if (patterns.hasNegativeScenarios && patterns.constraints.length > 0) {
        const negativeScenarios = generateComprehensiveNegativeTests(
          [positiveBehavior || requirement.title],
          patterns.constraints,
          patterns.errorConditions,
        )

        for (const scenario of negativeScenarios.slice(0, 2)) {
          // Limit to 2 negative cases per requirement to avoid explosion
          const negativeBehaviorClassification = classifyBehavior(scenario.negativeVariation, true)

          const negPriorityResult = determinePriority({
            text: scenario.negativeVariation,
            featureName: requirement.title,
            testType: typeClassification.testType,
            behavior: 'Negative',
            detectedPriority: patterns.priority === 'unknown' ? 'P1' : patterns.priority,
          })

          const negativeTestCase: EnrichedTestCase = {
            id: `TC${String(testIdCounter).padStart(4, '0')}`,
            title: formatTestCaseTitle(scenario.negativeVariation),
            behavior: 'Negative',
            testType: typeClassification.testType,
            priority: negPriorityResult.priority,
            sourceReference: requirement.sourceSection,
            precondition: extractPrecondition(requirement, patterns),
            postcondition: `System displays appropriate ${scenario.type} error`,
            steps: generateSteps(scenario.negativeVariation),
            tags: [
              ...extractTags(requirement, patterns, typeClassification.testType),
              `negative-${scenario.type}`,
            ],
            confidence: {
              typeConfidence: typeClassification.confidence,
              behaviorConfidence: negativeBehaviorClassification.confidence,
            },
            metadata: {
              isNegativeGenerated: true,
              constraintBased: scenario.type === 'constraint' || scenario.type === 'boundary',
              errorBased: scenario.type === 'error',
            },
          }
          testCases.push(negativeTestCase)
          testIdCounter++
        }
      }
    } catch (error) {
      issues.push(`Failed to process requirement "${requirement.title}": ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate statistics
  const stats = calculateStats(testCases)
  stats.generationTimeMs = Date.now() - startTime

  return {
    testCases,
    stats,
    issues,
  }
}

/**
 * Extracts behavior statement from requirement
 */
function extractBehaviorStatement(requirement: RequirementBlock): string | null {
  const content = requirement.content
  
  // Look for "Verify" patterns
  const verifyMatch = content.match(/Verify\s+(.+?)(?:\s+when|\.|$)/i)
  if (verifyMatch) return verifyMatch[1]

  // Look for "User can" patterns
  const userCanMatch = content.match(/[Uu]ser\s+can\s+(.+?)(?:\.|\s+when|$)/i)
  if (userCanMatch) return userCanMatch[1]

  // Look for "System should" patterns
  const systemMatch = content.match(/[Ss]ystem\s+(?:should|must)\s+(.+?)(?:\.|\s+when|$)/i)
  if (systemMatch) return systemMatch[1]

  // Default: use first line
  const firstSentence = content.split(/\n/)[0]
  return firstSentence.length > 10 ? firstSentence : null
}

/**
 * Formats test case title to "Verify [Behavior] when [Condition]" format
 */
function formatTestCaseTitle(statement: string): string {
  const trimmed = statement.trim()

  // Already in format
  if (trimmed.toLowerCase().includes(' when ')) {
    if (trimmed.toLowerCase().startsWith('verify')) {
      return trimmed
    }
    return `Verify ${trimmed}`
  }

  // Add Verify prefix
  return `Verify ${trimmed}`
}

/**
 * Extracts precondition from requirement
 */
function extractPrecondition(requirement: RequirementBlock, patterns: PatternAnalysis): string {
  if (patterns.preconditions.length > 0) {
    return patterns.preconditions[0]
  }

  // Default preconditions based on typical scenarios
  return 'User is logged in and on the appropriate page'
}

/**
 * Extracts postcondition from requirement
 */
function extractPostcondition(requirement: RequirementBlock, patterns: PatternAnalysis): string {
  const content = requirement.content.toLowerCase()

  if (content.includes('display') || content.includes('show')) {
    return 'Expected data is displayed correctly'
  }
  if (content.includes('save') || content.includes('update')) {
    return 'Changes are persisted successfully'
  }
  if (content.includes('error') || content.includes('fail')) {
    return 'Error message is displayed to user'
  }

  return 'Action completes as expected'
}

/**
 * Generates test steps from behavior
 */
function generateSteps(behavior: string): Array<{ action: string; expectedResult: string }> {
  // Simple heuristic-based step generation
  const steps: Array<{ action: string; expectedResult: string }> = []

  // Step 1: Navigate/Access
  steps.push({
    action: 'Navigate to the required page/feature',
    expectedResult: 'Page loads successfully',
  })

  // Step 2: Main action
  steps.push({
    action: `Perform action: ${behavior.substring(0, 100)}`,
    expectedResult: 'Action completes without errors',
  })

  // Step 3: Verification
  steps.push({
    action: 'Verify result against expected behavior',
    expectedResult: behavior,
  })

  return steps
}

/**
 * Extracts tags for test case
 */
function extractTags(
  requirement: RequirementBlock,
  patterns: PatternAnalysis,
  testType: TestType,
): string[] {
  const tags: string[] = []

  // Add type tag
  tags.push(`type:${testType.toLowerCase()}`)

  // Add priority tag
  tags.push(`priority:${patterns.priority}`)

  // Add criticality tag
  tags.push(`criticality:${patterns.criticality.toLowerCase()}`)

  // Add keyword tags
  if (patterns.keywords.length > 0) {
    tags.push(...patterns.keywords.slice(0, 3).map(k => `keyword:${k.toLowerCase()}`))
  }

  // Add constraint tag if applicable
  if (patterns.constraints.length > 0) {
    tags.push('constraint-testing')
  }

  // Add error tag if applicable
  if (patterns.errorConditions.length > 0) {
    tags.push('error-handling')
  }

  return tags
}

/**
 * Calculates statistics from test cases
 */
function calculateStats(testCases: EnrichedTestCase[]): GenerationResult['stats'] {
  const stats = {
    total: testCases.length,
    positive: testCases.filter(tc => tc.behavior === 'Positive').length,
    negative: testCases.filter(tc => tc.behavior === 'Negative').length,
    p0: testCases.filter(tc => tc.priority === 'P0').length,
    p1: testCases.filter(tc => tc.priority === 'P1').length,
    p2: testCases.filter(tc => tc.priority === 'P2').length,
    byType: {} as Record<TestType, number>,
    generationTimeMs: 0,
  }

  // Count by type
  const testTypes: TestType[] = [
    'Functional·Logic/Flow',
    'Functional·Transaction',
    'E2E',
    'API/Data Integration',
    'Security',
    'Analytics/Tracking',
  ]

  for (const type of testTypes) {
    stats.byType[type] = testCases.filter(tc => tc.testType === type).length
  }

  return stats
}

/**
 * Validates generated test cases
 */
export function validateTestCases(testCases: EnrichedTestCase[]): string[] {
  const errors: string[] = []

  for (const tc of testCases) {
    // Check required fields
    if (!tc.id || !tc.title || !tc.behavior || !tc.testType || !tc.priority) {
      errors.push(`Test case missing required field: ${tc.id}`)
    }

    // Check title format
    if (!tc.title.toLowerCase().startsWith('verify')) {
      errors.push(`Test case ${tc.id} title doesn't start with "Verify": ${tc.title}`)
    }

    // Check source reference
    if (!tc.sourceReference) {
      errors.push(`Test case ${tc.id} missing source reference`)
    }

    // Check steps
    if (tc.steps.length < 2) {
      errors.push(`Test case ${tc.id} has insufficient steps`)
    }
  }

  return errors
}

/**
 * Formats test cases as markdown table
 */
export function formatAsMarkdownTable(testCases: EnrichedTestCase[]): string {
  let table = '| ID | Title | Type | Priority | Behavior | Source |\n'
  table += '|---|---|---|---|---|---|\n'

  for (const tc of testCases) {
    table += `| ${tc.id} | ${tc.title} | ${tc.testType} | ${tc.priority} | ${tc.behavior} | ${tc.sourceReference} |\n`
  }

  return table
}

/**
 * Exports test cases for Qase
 */
export function exportForQase(testCases: EnrichedTestCase[]): Array<{
  title: string
  priority: string
  behavior: string
  preconditions: string
  postconditions: string
  steps: Array<{ step: string; expected: string }>
  tags: string[]
}> {
  return testCases.map(tc => ({
    title: tc.title,
    priority: tc.priority,
    behavior: tc.behavior,
    preconditions: tc.precondition,
    postconditions: tc.postcondition,
    steps: tc.steps.map(step => ({
      step: step.action,
      expected: step.expectedResult,
    })),
    tags: tc.tags,
  }))
}
