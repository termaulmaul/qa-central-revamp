/**
 * PRD Pattern Recognizer: Identifies priorities, constraints, error conditions, and keywords
 * Enhances PRD analysis with intelligent pattern detection for better test generation
 */

export interface PatternAnalysis {
  priority: 'P0' | 'P1' | 'P2' | 'unknown'
  keywords: string[]
  constraints: string[]
  errorConditions: string[]
  preconditions: string[]
  hasNegativeScenarios: boolean
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * Priority keywords indicating MUST TEST (P0)
 */
const P0_KEYWORDS = [
  'must', 'shall', 'required', 'critical', 'essential', 'mandatory',
  'core', 'primary', 'main', 'first', 'immediately', 'blocking',
  'always', 'essential', 'vital', 'urgent'
]

/**
 * Priority keywords indicating SHOULD TEST (P1)
 */
const P1_KEYWORDS = [
  'should', 'important', 'necessary', 'significant', 'substantial',
  'recommended', 'advised', 'preferred', 'expected', 'typically',
  'generally', 'usually', 'commonly'
]

/**
 * Priority keywords indicating COULD TEST (P2)
 */
const P2_KEYWORDS = [
  'may', 'might', 'could', 'optional', 'nice-to-have', 'consider',
  'can', 'possible', 'potential', 'enhancement', 'convenience',
  'if possible', 'when possible', 'as needed'
]

/**
 * Keywords indicating constraint patterns
 */
const CONSTRAINT_KEYWORDS = [
  'max', 'maximum', 'minimum', 'min', 'only', 'exactly', 'required',
  'must be', 'cannot', 'not allowed', 'no more than', 'at least',
  'limited to', 'restricted to', 'exclusive', 'inclusive'
]

/**
 * Keywords indicating error/negative scenarios
 */
const ERROR_KEYWORDS = [
  'error', 'fail', 'failure', 'invalid', 'incorrect', 'wrong',
  'denied', 'reject', 'reject', 'timeout', 'exception', 'abort',
  'cancel', 'unavailable', 'offline', 'disconnect', 'unauthorized',
  'forbidden', 'not allowed', 'cannot', 'should not', 'must not',
  'empty', 'null', 'undefined', 'missing', 'not found'
]

/**
 * Keywords indicating preconditions
 */
const PRECONDITION_KEYWORDS = [
  'must be', 'requires', 'when', 'if', 'before', 'after', 'once',
  'having', 'with', 'assuming', 'given', 'provided', 'only if',
  'prerequisite', 'first', 'initially', 'already'
]

/**
 * Detects priority level from text content
 */
export function detectPriority(text: string): 'P0' | 'P1' | 'P2' | 'unknown' {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)

  // Check for explicit P0/P1/P2 labels
  if (lowerText.includes('p0') || lowerText.includes('priority 0') || lowerText.includes('critical')) {
    return 'P0'
  }
  if (lowerText.includes('p1') || lowerText.includes('priority 1') || lowerText.includes('high')) {
    return 'P1'
  }
  if (lowerText.includes('p2') || lowerText.includes('priority 2') || lowerText.includes('medium')) {
    return 'P2'
  }

  // Count keyword matches
  let p0Count = 0, p1Count = 0, p2Count = 0

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '')
    if (P0_KEYWORDS.includes(cleanWord)) p0Count++
    if (P1_KEYWORDS.includes(cleanWord)) p1Count++
    if (P2_KEYWORDS.includes(cleanWord)) p2Count++
  }

  // Determine priority by highest count
  if (p0Count >= p1Count && p0Count >= p2Count && p0Count > 0) {
    return 'P0'
  }
  if (p1Count >= p2Count && p1Count > 0) {
    return 'P1'
  }
  if (p2Count > 0) {
    return 'P2'
  }

  return 'unknown'
}

/**
 * Determines criticality level based on content analysis
 */
export function determineCriticality(text: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const lowerText = text.toLowerCase()
  
  // Criticality scoring
  let score = 0

  // Core features are more critical
  if (lowerText.match(/core|fundamental|primary|main|essential/)) score += 3
  if (lowerText.match(/must|shall|required|critical/)) score += 2
  if (lowerText.match(/user.*action|feature|capability/)) score += 1
  
  // Lower criticality indicators
  if (lowerText.match(/optional|nice-to-have|enhancement|ui polish/)) score -= 2
  if (lowerText.match(/may|might|could/)) score -= 1

  if (score >= 4) return 'CRITICAL'
  if (score >= 2) return 'HIGH'
  if (score >= 0) return 'MEDIUM'
  return 'LOW'
}

/**
 * Extracts constraints from text
 */
export function extractConstraints(text: string): string[] {
  const constraints: string[] = []
  const lines = text.split(/\n+/)
  const lowerText = text.toLowerCase()

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue

    // Pattern: "max X", "minimum Y", "only Z items"
    const numberMatch = trimmed.match(/(?:max|maximum|min|minimum|exactly|limited to|no more than|at least)\s+(\d+|\w+)/i)
    if (numberMatch) {
      constraints.push(trimmed)
      continue
    }

    // Pattern: "must be", "cannot", "required"
    if (trimmed.match(/(?:must be|cannot|not allowed|must not|should not)/i)) {
      constraints.push(trimmed)
      continue
    }

    // Pattern: "only X", "exclusive", "inclusive"
    if (trimmed.match(/(?:only|exclusive|inclusive)\s+/i)) {
      constraints.push(trimmed)
    }
  }

  return [...new Set(constraints)]
}

/**
 * Extracts error conditions from text
 */
export function extractErrorConditions(text: string): string[] {
  const conditions: string[] = []
  const lines = text.split(/\n+/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue

    const lowerLine = trimmed.toLowerCase()
    
    // Check if line contains error keywords
    const hasError = ERROR_KEYWORDS.some(keyword => lowerLine.includes(keyword))
    
    if (hasError) {
      conditions.push(trimmed)
    }
  }

  return [...new Set(conditions)]
}

/**
 * Extracts preconditions from text
 */
export function extractPreconditions(text: string): string[] {
  const conditions: string[] = []
  const lines = text.split(/\n+/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue

    const lowerLine = trimmed.toLowerCase()
    
    // Check if line contains precondition keywords
    const hasPrecondition = PRECONDITION_KEYWORDS.some(keyword => lowerLine.includes(keyword))
    
    if (hasPrecondition) {
      conditions.push(trimmed)
    }
  }

  return [...new Set(conditions)]
}

/**
 * Identifies if text has negative/error scenarios
 */
export function hasNegativeScenarios(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  // Check for any error-related keywords
  const hasErrors = ERROR_KEYWORDS.some(keyword => lowerText.includes(keyword))
  
  // Check for explicit negative test indicators
  const hasNegativeIndicators = lowerText.match(/invalid|error|fail|deny|reject|cannot|must not|should not/i)
  
  return hasErrors || !!hasNegativeIndicators
}

/**
 * Extracts important keywords from text
 */
export function extractKeywords(text: string): string[] {
  const keywords: string[] = []
  const lines = text.split(/\n+/)

  for (const line of lines) {
    // Extract capitalized phrases (potential feature/capability names)
    const capitalizedMatches = line.match(/\b[A-Z][a-zA-Z0-9\s]*\b/g) || []
    keywords.push(...capitalizedMatches)

    // Extract phrases after colons (common pattern in PRDs)
    const colonMatches = line.match(/:\s*([^.!?]+)/g) || []
    keywords.push(...colonMatches.map(p => p.replace(':', '').trim()))
  }

  // Filter and deduplicate
  return [...new Set(keywords.filter(k => k.length > 3 && k.length < 100))]
}

/**
 * Analyzes text and returns comprehensive pattern analysis
 */
export function analyzePatterns(text: string): PatternAnalysis {
  return {
    priority: detectPriority(text),
    criticality: determineCriticality(text),
    keywords: extractKeywords(text),
    constraints: extractConstraints(text),
    errorConditions: extractErrorConditions(text),
    preconditions: extractPreconditions(text),
    hasNegativeScenarios: hasNegativeScenarios(text),
  }
}

/**
 * Batch analyzes multiple text sections
 */
export function analyzeMultiplePatterns(sections: Array<{ title: string; content: string }>): Array<{
  title: string
  analysis: PatternAnalysis
}> {
  return sections.map(section => ({
    title: section.title,
    analysis: analyzePatterns(section.content),
  }))
}

/**
 * Scores text relevance for negative test generation
 * Higher score = more likely to generate negative test cases
 */
export function scoreNegativeTestRelevance(text: string): number {
  let score = 0
  const lowerText = text.toLowerCase()

  // Error conditions significantly increase score
  if (lowerText.match(/error|fail|invalid|denied|unauthorized/)) score += 3
  
  // Constraints indicate boundary testing
  if (lowerText.match(/max|min|maximum|minimum|only|exactly|limited/)) score += 2
  
  // Validation patterns
  if (lowerText.match(/validate|verify|check|must be|required|cannot/)) score += 1
  
  // Negative patterns
  if (lowerText.match(/should not|must not|cannot|no more than/)) score += 2
  
  return Math.min(score, 10) // Cap at 10
}
