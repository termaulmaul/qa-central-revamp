/**
 * Priority Engine: Assigns P0/P1/P2 priorities based on requirement criticality
 * Uses feature importance, test type, and behavior to determine test priority
 */

export type Priority = 'P0' | 'P1' | 'P2'

export interface PriorityResult {
  priority: Priority
  score: number // 0-100
  factors: {
    criticalityScore: number
    importanceScore: number
    typeScore: number
    behaviorScore: number
  }
  reasoning: string
}

/**
 * Test type criticality scores
 */
const TEST_TYPE_CRITICALITY: Record<string, number> = {
  'Functional·Logic/Flow': 25,           // Lower - common functionality
  'Functional·Transaction': 30,          // Medium-High - data persistence critical
  'E2E': 35,                             // High - cross-feature workflows critical
  'API/Data Integration': 20,            // Low - external integration
  'Security': 40,                        // Highest - security critical
  'Analytics/Tracking': 10,              // Lowest - non-critical
}

/**
 * Keywords indicating critical features (P0)
 */
const CRITICAL_FEATURE_KEYWORDS = [
  'core', 'fundamental', 'primary', 'main', 'essential',
  'critical', 'blocking', 'mandatory', 'must-have',
  'screening', 'filtering', 'results', 'display', 'navigate',
  'user access', 'login', 'logout', 'authentication'
]

/**
 * Keywords indicating important features (P1)
 */
const IMPORTANT_FEATURE_KEYWORDS = [
  'feature', 'capability', 'function', 'enhancement', 'improvement',
  'preset', 'template', 'builder', 'advanced', 'custom',
  'save', 'load', 'export', 'import', 'configure'
]

/**
 * Keywords indicating nice-to-have features (P2)
 */const NICE_TO_HAVE_KEYWORDS = [
  'optional', 'nice-to-have', 'convenience', 'polish', 'ui',
  'localization', 'i18n', 'analytics', 'tracking', 'logging',
  'enhancement', 'could', 'might', 'consider', 'if possible'
]

/**
 * Determines feature importance score (0-100)
 */
function calculateFeatureImportance(text: string, featureName: string): number {
  let score = 50 // Base score

  const lowerText = text.toLowerCase()
  const lowerFeature = featureName.toLowerCase()

  // Check for critical feature keywords
  for (const keyword of CRITICAL_FEATURE_KEYWORDS) {
    if (lowerText.includes(keyword) || lowerFeature.includes(keyword)) {
      score += 25
    }
  }

  // Check for important feature keywords
  for (const keyword of IMPORTANT_FEATURE_KEYWORDS) {
    if (lowerText.includes(keyword) || lowerFeature.includes(keyword)) {
      score += 15
    }
  }

  // Check for nice-to-have keywords
  for (const keyword of NICE_TO_HAVE_KEYWORDS) {
    if (lowerText.includes(keyword) || lowerFeature.includes(keyword)) {
      score -= 20
    }
  }

  // Frequency of mentions indicates importance
  const mentionCount = (text.match(/\b(this|that|the)\s+(?:feature|capability|function)/gi) || []).length
  score += Math.min(mentionCount * 5, 15)

  // Cap and return
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculates criticality score (0-100) based on:
 * - Whether feature impacts core functionality
 * - Whether it's blocking for other features
 * - Whether it's security-related
 */
function calculateCriticalityScore(text: string): number {
  let score = 0

  const lowerText = text.toLowerCase()

  // Core functionality
  if (lowerText.match(/core|fundamental|primary|main/i)) score += 30
  
  // Critical to user flow
  if (lowerText.match(/must|shall|required|essential/i)) score += 20
  
  // Security related
  if (lowerText.match(/security|auth|permission|access|role/i)) score += 25
  
  // Data integrity
  if (lowerText.match(/data|persist|save|transaction|consistency/i)) score += 15
  
  // Performance critical
  if (lowerText.match(/performance|speed|optimization|latency/i)) score += 10
  
  return Math.min(score, 100)
}

/**
 * Calculates behavior score (0-100)
 * Negative tests are generally less critical than positive
 */
function calculateBehaviorScore(behavior: 'Positive' | 'Negative'): number {
  return behavior === 'Positive' ? 60 : 40
}

/**
 * Determines priority based on comprehensive scoring
 */
export function determinePriority(options: {
  text: string
  featureName: string
  testType: string
  behavior: 'Positive' | 'Negative'
  detectedPriority?: 'P0' | 'P1' | 'P2'
}): PriorityResult {
  // If priority is explicitly detected, give it high weight
  if (options.detectedPriority) {
    const priorityScores = {
      P0: 85,
      P1: 65,
      P2: 35,
    }
    return {
      priority: options.detectedPriority,
      score: priorityScores[options.detectedPriority],
      factors: {
        criticalityScore: priorityScores[options.detectedPriority],
        importanceScore: 0,
        typeScore: 0,
        behaviorScore: 0,
      },
      reasoning: `Explicitly marked as ${options.detectedPriority}`,
    }
  }

  // Calculate component scores
  const importanceScore = calculateFeatureImportance(options.text, options.featureName)
  const criticalityScore = calculateCriticalityScore(options.text)
  const typeScore = TEST_TYPE_CRITICALITY[options.testType] || 25
  const behaviorScore = calculateBehaviorScore(options.behavior)

  // Weighted calculation
  const totalScore =
    importanceScore * 0.35 +
    criticalityScore * 0.30 +
    typeScore * 0.20 +
    behaviorScore * 0.15

  // Determine priority based on score
  let priority: Priority = 'P2'
  if (totalScore >= 75) {
    priority = 'P0'
  } else if (totalScore >= 55) {
    priority = 'P1'
  }

  // Adjust priority if it's a negative test (generally lower priority)
  if (options.behavior === 'Negative' && priority === 'P0') {
    priority = 'P1'
  }

  return {
    priority,
    score: Math.round(totalScore),
    factors: {
      criticalityScore: Math.round(criticalityScore),
      importanceScore: Math.round(importanceScore),
      typeScore,
      behaviorScore,
    },
    reasoning: `Score: ${Math.round(totalScore)} from criticality(${Math.round(criticalityScore)}), ` +
               `importance(${Math.round(importanceScore)}), type(${typeScore}), behavior(${Math.round(behaviorScore)})`,
  }
}

/**
 * Batch determines priorities for multiple test cases
 */
export function determinePrioritiesBatch(
  testCases: Array<{
    id: string
    text: string
    featureName: string
    testType: string
    behavior: 'Positive' | 'Negative'
    detectedPriority?: 'P0' | 'P1' | 'P2'
  }>,
): Array<{
  id: string
  result: PriorityResult
}> {
  return testCases.map(tc => ({
    id: tc.id,
    result: determinePriority({
      text: tc.text,
      featureName: tc.featureName,
      testType: tc.testType,
      behavior: tc.behavior,
      detectedPriority: tc.detectedPriority,
    }),
  }))
}

/**
 * Calculates priority distribution from test cases
 */
export function calculatePriorityDistribution(testCases: PriorityResult[]): {
  p0Count: number
  p1Count: number
  p2Count: number
  p0Percentage: number
  p1Percentage: number
  p2Percentage: number
  recommendation: string
} {
  const total = testCases.length
  const p0Count = testCases.filter(tc => tc.priority === 'P0').length
  const p1Count = testCases.filter(tc => tc.priority === 'P1').length
  const p2Count = testCases.filter(tc => tc.priority === 'P2').length

  const p0Percentage = total > 0 ? Math.round((p0Count / total) * 100) : 0
  const p1Percentage = total > 0 ? Math.round((p1Count / total) * 100) : 0
  const p2Percentage = total > 0 ? Math.round((p2Count / total) * 100) : 0

  // Generate recommendation based on distribution
  let recommendation = ''
  if (p0Percentage < 20) {
    recommendation = 'Consider increasing P0 tests for critical functionality'
  } else if (p0Percentage > 50) {
    recommendation = 'Consider reviewing P0 classifications - may have too many'
  } else {
    recommendation = 'Priority distribution looks balanced'
  }

  return {
    p0Count,
    p1Count,
    p2Count,
    p0Percentage,
    p1Percentage,
    p2Percentage,
    recommendation,
  }
}

/**
 * Priority labels for display
 */
export function getPriorityLabel(priority: Priority): string {
  const labels = {
    P0: 'MUST TEST',
    P1: 'SHOULD TEST',
    P2: 'COULD TEST',
  }
  return labels[priority]
}

/**
 * Priority color for UI display
 */
export function getPriorityColor(priority: Priority): string {
  const colors = {
    P0: 'bg-red-100 text-red-800',      // Red for critical
    P1: 'bg-yellow-100 text-yellow-800', // Yellow for important
    P2: 'bg-blue-100 text-blue-800',    // Blue for nice-to-have
  }
  return colors[priority]
}

/**
 * Adjusts priority based on release stage
 */
export function adjustPriorityForReleaseStage(
  priority: Priority,
  stage: 'alpha' | 'beta' | 'rc' | 'production',
): Priority {
  // In alpha, focus on core P0
  // In beta, add P1s
  // In RC/production, all tests required

  if (stage === 'alpha') {
    return priority === 'P0' ? 'P0' : 'P2'
  }
  if (stage === 'beta') {
    return priority !== 'P2' ? priority : 'P2'
  }

  return priority
}
