/**
 * Test Type Classifier: Intelligently determines test type based on PRD content
 * Uses pattern matching and heuristic rules for automated classification
 */

export type TestType = 
  | 'Functional·Logic/Flow'
  | 'Functional·Transaction'
  | 'E2E'
  | 'API/Data Integration'
  | 'Security'
  | 'Analytics/Tracking'

export interface ClassificationResult {
  testType: TestType
  confidence: number // 0-1, where 1 is highest confidence
  matchedPatterns: string[]
  reasoning: string
}

/**
 * Patterns for Functional·Logic/Flow test type
 * Happy path workflows, feature validation, standard user flows
 */
const FUNCTIONAL_LOGIC_PATTERNS = [
  /user\s+(?:can|clicks?|selects?|views?|sees?|opens?|navigates?)/i,
  /(?:verify|display|show|renders?|appears?|visible)/i,
  /(?:filter|search|sort|browse|view|display)/i,
  /(?:tab|button|link|menu|dropdown|form|input)/i,
  /(?:workflow|process|flow|sequence|steps?)/i,
  /feature\s+(?:works?|functions?|operates?)/i,
  /(?:standard|normal|typical|regular|common)\s+(?:flow|scenario|case|path)/i,
]

/**
 * Patterns for Functional·Transaction test type
 * Data persistence, state changes, save/update/delete operations
 */
const FUNCTIONAL_TRANSACTION_PATTERNS = [
  /(?:save|update|delete|create|add|remove|persist|store|write)/i,
  /(?:data|record|entry|item|document|state)\s+(?:is\s+)?(?:saved|stored|updated|deleted|created)/i,
  /(?:persist|persistence|storage|database|cache)/i,
  /(?:state|data)\s+(?:changes?|persists?|remains?|is\s+retained)/i,
  /transaction|commit|rollback/i,
  /(?:submit|confirm|finalize|complete)\s+(?:form|process|action)/i,
  /bulk\s+(?:update|delete|operation|action)/i,
]

/**
 * Patterns for E2E test type
 * Multi-step workflows crossing multiple features
 */
const E2E_PATTERNS = [
  /(?:then|followed by|after|subsequently|next|before)\s+/i,
  /(?:multi-step|multi step|end-to-end|end to end|e2e|entire|complete|full|comprehensive)\s+(?:workflow|process|flow|journey)/i,
  /(?:user\s+.*then.*action)/i,
  /(?:initial|first|second|third|step\s+\d)/i,
  /(?:across|multiple|several|various)\s+(?:pages?|screens?|features?|modules?|sections?)/i,
  /workflow.*workflow/i, // Mentions workflow multiple times
  /(?:complete|full|entire)\s+(?:user|customer)\s+(?:journey|experience|scenario)/i,
]

/**
 * Patterns for API/Data Integration test type
 * Real-time data, synchronization, external integrations
 */
const API_DATA_PATTERNS = [
  /(?:api|endpoint|integration|service|call|request|response)/i,
  /(?:real-time|real time|sync|synchronization|update|refresh)/i,
  /(?:data|fetch|retrieve|load|import|export)\s+(?:from|to)\s+(?:api|service|database|external)/i,
  /(?:external|third-party|integration|datasource|source)/i,
  /(?:connect|communicate|interact|exchange)\s+(?:with|to)\s+(?:api|service|system)/i,
  /(?:payload|json|xml|response)\s+(?:format|structure|data)/i,
  /(?:latency|performance|timeout|retry|error handling)/i,
]

/**
 * Patterns for Security test type
 * Authentication, authorization, permissions, feature gating
 */
const SECURITY_PATTERNS = [
  /(?:auth|login|logout|password|credential|session)/i,
  /(?:permission|access|role|privilege|authorization|allowed|denied)/i,
  /(?:feature.*gat|premium|free|tier|subscription|access\s+control)/i,
  /(?:secure|secure|security|encryption|ssl|token|jwt|bearer)/i,
  /(?:unauthorized|forbidden|denied|restricted|limited|blocked)/i,
  /(?:only\s+(?:authenticated|authorized|premium|admin|user))/i,
  /(?:cannot|must\s+(?:not|be))\s+(?:access|view|edit|delete|modify)/i,
]

/**
 * Patterns for Analytics/Tracking test type
 * Event logging, auditing, tracking
 */
const ANALYTICS_PATTERNS = [
  /(?:log|track|event|analytics|telemetry|monitoring|audit)/i,
  /(?:record|capture|report|send)\s+(?:event|data|metric|information)/i,
  /(?:user\s+action|page\s+view|click|interaction)\s+(?:is\s+)?(?:tracked|logged|recorded)/i,
  /(?:analytics|insights|reporting|dashboard|metrics)/i,
  /(?:event.*payload|tracking.*event|event.*timestamp)/i,
]

/**
 * Detects confidence level based on pattern matches and text length
 */
function calculateConfidence(matchCount: number, totalPatterns: number, textLength: number): number {
  // Base confidence from pattern matches
  const patternConfidence = matchCount / totalPatterns

  // Adjust based on text length (longer text = more context = higher confidence)
  const textLengthFactor = Math.min(textLength / 500, 1) * 0.2

  // Combine scores
  const confidence = Math.min(patternConfidence + textLengthFactor, 1)
  return Math.round(confidence * 100) / 100
}

/**
 * Classifies text into a test type
 */
export function classifyTestType(text: string): ClassificationResult {
  if (!text || text.length < 5) {
    return {
      testType: 'Functional·Logic/Flow',
      confidence: 0,
      matchedPatterns: [],
      reasoning: 'Text too short for reliable classification',
    }
  }

  const textLength = text.length
  const scores: Record<TestType, { count: number; patterns: string[] }> = {
    'Functional·Logic/Flow': { count: 0, patterns: [] },
    'Functional·Transaction': { count: 0, patterns: [] },
    'E2E': { count: 0, patterns: [] },
    'API/Data Integration': { count: 0, patterns: [] },
    'Security': { count: 0, patterns: [] },
    'Analytics/Tracking': { count: 0, patterns: [] },
  }

  // Check each pattern
  for (const pattern of FUNCTIONAL_LOGIC_PATTERNS) {
    if (pattern.test(text)) {
      scores['Functional·Logic/Flow'].count++
      scores['Functional·Logic/Flow'].patterns.push(pattern.source)
    }
  }

  for (const pattern of FUNCTIONAL_TRANSACTION_PATTERNS) {
    if (pattern.test(text)) {
      scores['Functional·Transaction'].count++
      scores['Functional·Transaction'].patterns.push(pattern.source)
    }
  }

  for (const pattern of E2E_PATTERNS) {
    if (pattern.test(text)) {
      scores['E2E'].count++
      scores['E2E'].patterns.push(pattern.source)
    }
  }

  for (const pattern of API_DATA_PATTERNS) {
    if (pattern.test(text)) {
      scores['API/Data Integration'].count++
      scores['API/Data Integration'].patterns.push(pattern.source)
    }
  }

  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.test(text)) {
      scores['Security'].count++
      scores['Security'].patterns.push(pattern.source)
    }
  }

  for (const pattern of ANALYTICS_PATTERNS) {
    if (pattern.test(text)) {
      scores['Analytics/Tracking'].count++
      scores['Analytics/Tracking'].patterns.push(pattern.source)
    }
  }

  // Find the type with highest score
  let bestType: TestType = 'Functional·Logic/Flow'
  let bestScore = 0

  for (const [type, data] of Object.entries(scores)) {
    if (data.count > bestScore) {
      bestScore = data.count
      bestType = type as TestType
    }
  }

  // If no strong match, default to Functional·Logic/Flow
  if (bestScore === 0) {
    return {
      testType: 'Functional·Logic/Flow',
      confidence: 0.3,
      matchedPatterns: [],
      reasoning: 'No specific patterns matched; defaulting to Functional·Logic/Flow',
    }
  }

  // Calculate confidence
  const totalPatterns = 
    FUNCTIONAL_LOGIC_PATTERNS.length +
    FUNCTIONAL_TRANSACTION_PATTERNS.length +
    E2E_PATTERNS.length +
    API_DATA_PATTERNS.length +
    SECURITY_PATTERNS.length +
    ANALYTICS_PATTERNS.length

  const confidence = calculateConfidence(bestScore, totalPatterns, textLength)

  return {
    testType: bestType,
    confidence,
    matchedPatterns: scores[bestType].patterns,
    reasoning: `Matched ${bestScore} pattern${bestScore !== 1 ? 's' : ''} for ${bestType}`,
  }
}

/**
 * Batch classify multiple texts
 */
export function classifyMultiple(texts: Array<{ id: string; content: string }>): Array<{
  id: string
  result: ClassificationResult
}> {
  return texts.map(item => ({
    id: item.id,
    result: classifyTestType(item.content),
  }))
}

/**
 * Suggests alternative test types based on confidence threshold
 */
export function suggestAlternativeTypes(text: string, confidenceThreshold: number = 0.5): TestType[] {
  const results: Array<{ type: TestType; score: number }> = []

  // Try each type
  const types: TestType[] = [
    'Functional·Logic/Flow',
    'Functional·Transaction',
    'E2E',
    'API/Data Integration',
    'Security',
    'Analytics/Tracking',
  ]

  for (const type of types) {
    // Count pattern matches for each type
    let count = 0
    let patterns: RegExp[] = []

    if (type === 'Functional·Logic/Flow') patterns = FUNCTIONAL_LOGIC_PATTERNS
    else if (type === 'Functional·Transaction') patterns = FUNCTIONAL_TRANSACTION_PATTERNS
    else if (type === 'E2E') patterns = E2E_PATTERNS
    else if (type === 'API/Data Integration') patterns = API_DATA_PATTERNS
    else if (type === 'Security') patterns = SECURITY_PATTERNS
    else if (type === 'Analytics/Tracking') patterns = ANALYTICS_PATTERNS

    for (const pattern of patterns) {
      if (pattern.test(text)) count++
    }

    const totalPatterns = patterns.length
    const confidence = totalPatterns > 0 ? count / totalPatterns : 0

    if (confidence >= confidenceThreshold) {
      results.push({ type, score: confidence })
    }
  }

  // Sort by score descending
  return results
    .sort((a, b) => b.score - a.score)
    .map(r => r.type)
}
