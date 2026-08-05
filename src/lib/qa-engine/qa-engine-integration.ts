/**
 * QA Engine Integration: Bridges new v2 engine with legacy UI components
 * Provides enhanced coverage metrics and test case enrichment
 */

import { QAEngineV2 } from './qa-engine-v2'
import { type CoverageItem, type TestCase } from './qa-engine'
import { type EnrichedTestCase, type GenerationResult } from './unified-test-generator'

export interface EnhancedCoverageItem extends CoverageItem {
  testCount?: number
  p0Count?: number
  p1Count?: number
  p2Count?: number
  positiveCount?: number
  negativeCount?: number
}

export interface EnhancedAnalysisResult {
  coverage: EnhancedCoverageItem[]
  statistics: {
    total: number
    p0: number
    p1: number
    p2: number
    positive: number
    negative: number
    byType: Record<string, number>
  }
  generationTimeMs: number
}

export interface TestCaseWithEnrichment extends TestCase {
  enrichmentData?: {
    typeConfidence: number
    behaviorConfidence: number
    isNegativeGenerated: boolean
    constraintBased: boolean
    errorBased: boolean
  }
}

/**
 * Analyzes PRD with enhanced metrics
 */
export async function enhancedAnalyzePRD(prdText: string): Promise<EnhancedAnalysisResult> {
  try {
    // Generate test cases to get statistics
    const result = await QAEngineV2.generateEnrichedTests(prdText)

    // Group by source to calculate per-area stats
    const areaStats = new Map<string, {
      count: number
      p0: number
      p1: number
      p2: number
      positive: number
      negative: number
    }>()

    for (const testCase of result.testCases) {
      if (!areaStats.has(testCase.sourceReference)) {
        areaStats.set(testCase.sourceReference, {
          count: 0,
          p0: 0,
          p1: 0,
          p2: 0,
          positive: 0,
          negative: 0,
        })
      }

      const stats = areaStats.get(testCase.sourceReference)!
      stats.count++

      if (testCase.priority === 'P0') stats.p0++
      if (testCase.priority === 'P1') stats.p1++
      if (testCase.priority === 'P2') stats.p2++

      if (testCase.behavior === 'Positive') stats.positive++
      if (testCase.behavior === 'Negative') stats.negative++
    }

    // Build enhanced coverage items
    const coverage: EnhancedCoverageItem[] = Array.from(areaStats.entries()).map(([area, stats]) => ({
      area,
      progress: `${stats.count} cases`,
      testCount: stats.count,
      p0Count: stats.p0,
      p1Count: stats.p1,
      p2Count: stats.p2,
      positiveCount: stats.positive,
      negativeCount: stats.negative,
    }))

    return {
      coverage,
      statistics: {
        total: result.stats.total,
        p0: result.stats.p0,
        p1: result.stats.p1,
        p2: result.stats.p2,
        positive: result.stats.positive,
        negative: result.stats.negative,
        byType: result.stats.byType,
      },
      generationTimeMs: result.stats.generationTimeMs,
    }
  } catch (error) {
    console.error('[QA Engine Integration] Error in enhancedAnalyzePRD:', error)
    // Return minimal coverage on error
    return {
      coverage: [],
      statistics: {
        total: 0,
        p0: 0,
        p1: 0,
        p2: 0,
        positive: 0,
        negative: 0,
        byType: {},
      },
      generationTimeMs: 0,
    }
  }
}

/**
 * Generates test cases with enrichment data for UI display
 */
export async function generateEnrichedTestsForUI(prdText: string): Promise<TestCaseWithEnrichment[]> {
  try {
    const result = await QAEngineV2.fullPipeline(prdText)

    return result.enrichedCases.map((enriched: any, idx: number) => {
      const legacyCase = result.legacyCases[idx]

      return {
        ...legacyCase,
        enrichmentData: {
          typeConfidence: enriched.confidence.typeConfidence,
          behaviorConfidence: enriched.confidence.behaviorConfidence,
          isNegativeGenerated: enriched.metadata.isNegativeGenerated,
          constraintBased: enriched.metadata.constraintBased,
          errorBased: enriched.metadata.errorBased,
        },
      }
    })
  } catch (error) {
    console.error('[QA Engine Integration] Error generating enriched tests:', error)
    return []
  }
}

/**
 * Gets coverage statistics for dashboard display
 */
export function getCoverageStatistics(coverage: EnhancedCoverageItem[]): {
  totalAreas: number
  totalTests: number
  avgTestsPerArea: number
  p0Tests: number
  p1Tests: number
  p2Tests: number
  positiveRatio: number
  negativeRatio: number
  recommendation: string
} {
  const totalTests = coverage.reduce((sum, c) => sum + (c.testCount || 0), 0)
  const totalP0 = coverage.reduce((sum, c) => sum + (c.p0Count || 0), 0)
  const totalP1 = coverage.reduce((sum, c) => sum + (c.p1Count || 0), 0)
  const totalP2 = coverage.reduce((sum, c) => sum + (c.p2Count || 0), 0)
  const totalPositive = coverage.reduce((sum, c) => sum + (c.positiveCount || 0), 0)
  const totalNegative = coverage.reduce((sum, c) => sum + (c.negativeCount || 0), 0)

  const avgTestsPerArea = coverage.length > 0 ? Math.round(totalTests / coverage.length) : 0

  // Generate recommendation
  let recommendation = '✓ Coverage looks good'
  const p0Ratio = totalTests > 0 ? totalP0 / totalTests : 0
  if (p0Ratio < 0.15) {
    recommendation = '⚠ Consider increasing P0 tests for critical functionality'
  } else if (p0Ratio > 0.5) {
    recommendation = '⚠ Consider balancing priorities - may have too many P0 tests'
  }

  if (totalNegative === 0 && totalTests > 0) {
    recommendation = '💡 Consider adding negative test cases for better coverage'
  }

  return {
    totalAreas: coverage.length,
    totalTests,
    avgTestsPerArea,
    p0Tests: totalP0,
    p1Tests: totalP1,
    p2Tests: totalP2,
    positiveRatio: totalTests > 0 ? Math.round((totalPositive / totalTests) * 100) : 0,
    negativeRatio: totalTests > 0 ? Math.round((totalNegative / totalTests) * 100) : 0,
    recommendation,
  }
}

/**
 * Gets priority distribution chart data
 */
export function getPriorityDistribution(coverage: EnhancedCoverageItem[]): {
  p0: number
  p1: number
  p2: number
  p0Percentage: number
  p1Percentage: number
  p2Percentage: number
} {
  const p0 = coverage.reduce((sum, c) => sum + (c.p0Count || 0), 0)
  const p1 = coverage.reduce((sum, c) => sum + (c.p1Count || 0), 0)
  const p2 = coverage.reduce((sum, c) => sum + (c.p2Count || 0), 0)
  const total = p0 + p1 + p2

  return {
    p0,
    p1,
    p2,
    p0Percentage: total > 0 ? Math.round((p0 / total) * 100) : 0,
    p1Percentage: total > 0 ? Math.round((p1 / total) * 100) : 0,
    p2Percentage: total > 0 ? Math.round((p2 / total) * 100) : 0,
  }
}

/**
 * Gets test type distribution chart data
 */
export function getTestTypeDistribution(stats: EnhancedAnalysisResult['statistics']): Array<{
  type: string
  count: number
  percentage: number
}> {
  const types = [
    'Functional·Logic/Flow',
    'Functional·Transaction',
    'E2E',
    'API/Data Integration',
    'Security',
    'Analytics/Tracking',
  ]

  const total = stats.byType ? Object.values(stats.byType).reduce((a, b) => a + b, 0) : 0

  return types
    .map(type => ({
      type,
      count: stats.byType?.[type] || 0,
      percentage: total > 0 ? Math.round(((stats.byType?.[type] || 0) / total) * 100) : 0,
    }))
    .filter(item => item.count > 0)
}

/**
 * Filters test cases by priority
 */
export function filterTestsByPriority(
  tests: TestCase[],
  priority: 'P0' | 'P1' | 'P2' | 'all',
): TestCase[] {
  if (priority === 'all') return tests
  return tests.filter(t => t.priority === priority)
}

/**
 * Filters test cases by behavior
 */
export function filterTestsByBehavior(
  tests: TestCase[],
  behavior: 'Positive' | 'Negative' | 'all',
): TestCase[] {
  if (behavior === 'all') return tests
  return tests.filter(t => t.behavior === behavior)
}

/**
 * Filters test cases by type
 */
export function filterTestsByType(
  tests: TestCase[],
  type: string | 'all',
): TestCase[] {
  if (type === 'all') return tests
  return tests.filter(t => t.type.includes(type))
}

/**
 * Groups test cases by module/suite
 */
export function groupTestsBySuite(tests: TestCase[]): Record<string, TestCase[]> {
  return tests.reduce(
    (acc, tc) => {
      if (!acc[tc.suite]) acc[tc.suite] = []
      acc[tc.suite].push(tc)
      return acc
    },
    {} as Record<string, TestCase[]>,
  )
}

/**
 * Gets suite statistics
 */
export function getSuiteStatistics(tests: TestCase[]): Array<{
  suite: string
  count: number
  p0: number
  p1: number
  p2: number
  positive: number
  negative: number
}> {
  const grouped = groupTestsBySuite(tests)

  return Object.entries(grouped).map(([suite, cases]) => ({
    suite,
    count: cases.length,
    p0: cases.filter(c => c.priority === 'P0').length,
    p1: cases.filter(c => c.priority === 'P1').length,
    p2: cases.filter(c => c.priority === 'P2').length,
    positive: cases.filter(c => c.behavior === 'Positive').length,
    negative: cases.filter(c => c.behavior === 'Negative').length,
  }))
}
