/**
 * QA Engine v2: Unified orchestration pipeline for PRD to Test Cases
 * Integrates all new classifiers and generators for improved test generation
 * Maintains backward compatibility with existing UI and exports
 */

import {
  analyzePRD as analyzePRDStructure,
  extractCapabilitiesWithRequirements,
  type PRDContent,
} from './prd-analyzer'
import {
  generateTestCasesFromRequirements,
  validateTestCases,
  formatAsMarkdownTable,
  exportForQase,
  type EnrichedTestCase,
  type GenerationResult,
  type RequirementBlock,
} from './unified-test-generator'
import { normalizeTestCaseTitle, extractBehaviorAndCondition, isValidTestCaseTitle, type TestCase } from './qa-engine'

/**
 * Enhanced QA Engine using unified pipeline
 */
export const QAEngineV2 = {
  /**
   * Analyzes PRD and generates enriched test cases using new pipeline
   */
  async generateEnrichedTests(prdText: string): Promise<GenerationResult> {
    // Parse PRD structure
    const prdContent = analyzePRDStructure(prdText)

    // Extract capabilities and requirements
    const capabilitiesWithRequirements = extractCapabilitiesWithRequirements(prdContent)

    // Convert to RequirementBlock format
    const requirements: RequirementBlock[] = capabilitiesWithRequirements.map((item, idx) => ({
      id: `REQ${String(idx + 1).padStart(4, '0')}`,
      title: item.capability,
      content: item.relatedLines.join('\n'),
      sourceSection: item.source.title,
      lineNumber: idx,
    }))

    // Generate test cases using unified pipeline
    const result = generateTestCasesFromRequirements(requirements)

    // Validate generated test cases
    const validationErrors = validateTestCases(result.testCases)

    // Return enriched result with validation info
    return {
      ...result,
      issues: [...result.issues, ...validationErrors],
    }
  },

  /**
   * Converts enriched test cases to legacy TestCase format for UI compatibility
   */
  convertToLegacyFormat(enrichedCases: EnrichedTestCase[]): TestCase[] {
    return enrichedCases.map(tc => ({
      id: tc.id,
      tcId: tc.id,
      suite: tc.sourceReference,
      title: tc.title,
      priority: tc.priority as 'P0' | 'P1' | 'P2' | 'P3',
      behavior: tc.behavior,
      type: tc.testType,
      precondition: tc.precondition,
      postcondition: tc.postcondition,
      steps: tc.steps.map(s => ({
        action: s.action,
        expectedResult: s.expectedResult,
        source: tc.sourceReference,
      })),
      tags: tc.tags,
    }))
  },

  /**
   * Generates markdown formatted output
   */
  generateMarkdown(enrichedCases: EnrichedTestCase[]): string {
    return formatAsMarkdownTable(enrichedCases)
  },

  /**
   * Exports test cases for Qase integration
   */
  exportForQase(enrichedCases: EnrichedTestCase[]): Array<{
    title: string
    priority: string
    behavior: string
    preconditions: string
    postconditions: string
    steps: Array<{ step: string; expected: string }>
    tags: string[]
  }> {
    return exportForQase(enrichedCases)
  },

  /**
   * Generates coverage summary report
   */
  generateCoverageSummary(result: GenerationResult): {
    total: number
    byPriority: Record<'P0' | 'P1' | 'P2', number>
    byBehavior: Record<'Positive' | 'Negative', number>
    byType: Record<string, number>
    hasNegativeTests: boolean
    negativePercentage: number
    p0Percentage: number
  } {
    const { stats } = result
    const negativePercentage = stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0
    const p0Percentage = stats.total > 0 ? Math.round((stats.p0 / stats.total) * 100) : 0

    return {
      total: stats.total,
      byPriority: {
        P0: stats.p0,
        P1: stats.p1,
        P2: stats.p2,
      },
      byBehavior: {
        Positive: stats.positive,
        Negative: stats.negative,
      },
      byType: stats.byType,
      hasNegativeTests: stats.negative > 0,
      negativePercentage,
      p0Percentage,
    }
  },

  /**
   * Full pipeline: PRD text → Enriched test cases → Legacy format
   */
  async fullPipeline(prdText: string): Promise<{
    enrichedCases: EnrichedTestCase[]
    legacyCases: TestCase[]
    coverage: any
    markdown: string
    qaseExport: any
    stats: GenerationResult['stats']
    issues: string[]
  }> {
    // Generate enriched test cases
    const result = await QAEngineV2.generateEnrichedTests(prdText)

    // Convert to legacy format
    const legacyCases = QAEngineV2.convertToLegacyFormat(result.testCases)

    // Generate coverage summary
    const coverage = QAEngineV2.generateCoverageSummary(result)

    // Generate markdown
    const markdown = QAEngineV2.generateMarkdown(result.testCases)

    // Export for Qase
    const qaseExport = QAEngineV2.exportForQase(result.testCases)

    return {
      enrichedCases: result.testCases,
      legacyCases,
      coverage,
      markdown,
      qaseExport,
      stats: result.stats,
      issues: result.issues,
    }
  },
}

/**
 * Backward compatibility wrapper - maintains existing QAEngine interface
 */
export function createCompatibilityQAEngine() {
  return {
    // Legacy methods still supported but enhanced internally
    analyzePRD: async (text: string) => {
      const prdContent = analyzePRDStructure(text)
      const capabilitiesWithRequirements = extractCapabilitiesWithRequirements(prdContent)

      return {
        coverage: capabilitiesWithRequirements.map((item, idx) => ({
          area: `${idx + 1}. ${item.capability}`,
          progress: item.source.title,
        })),
        prdContent,
      }
    },

    // Enhanced test generation using v2 pipeline
    generateTests: async (prdText: string): Promise<TestCase[]> => {
      const result = await QAEngineV2.fullPipeline(prdText)
      return result.legacyCases
    },
  }
}
