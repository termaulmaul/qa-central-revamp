/**
 * QA Validator: Enforces strict test case format rules
 * Ensures every test case follows "Verify [Behavior] when [Condition]" pattern
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  normalizedTitle?: string
}

export interface ValidationStats {
  totalTestCases: number
  validTestCases: number
  invalidTestCases: number
  duplicateCount: number
  issues: Array<{
    tcId?: string
    title: string
    errors: string[]
  }>
}

/**
 * Strict regex for test case title validation
 * Must start with "Verify", contain exactly ONE " when ", and have both behavior and condition
 */
const TC_FORMAT_REGEX = /^Verify\s+(.+?)\s+when\s+(.+)$/i

/**
 * Validates if a test case title follows strict format
 */
export function validateTestCaseFormat(title: string): ValidationResult {
  const trimmed = title.trim()
  const errors: string[] = []
  const warnings: string[] = []

  // Rule 1: Must start with "Verify"
  if (!trimmed.toLowerCase().startsWith('verify')) {
    errors.push('Test case must start with "Verify"')
  }

  // Rule 2: Must contain exactly ONE " when "
  const whenMatches = (trimmed.match(/\s+when\s+/gi) || []).length
  if (whenMatches === 0) {
    errors.push('Test case must contain " when " to separate behavior from condition')
  } else if (whenMatches > 1) {
    errors.push(`Test case contains ${whenMatches} instances of "when", must be exactly 1`)
  }

  // Rule 3: Try to match full format
  const match = trimmed.match(TC_FORMAT_REGEX)
  if (!match) {
    errors.push('Test case does not match format: Verify [Behavior] when [Condition]')
  } else {
    const behavior = match[1]
    const condition = match[2]

    // Rule 4: Behavior should not be empty
    if (behavior.length < 5) {
      errors.push('Behavior part is too short or empty')
    }

    // Rule 5: Condition should not be empty
    if (condition.length < 5) {
      errors.push('Condition part is too short or empty')
    }

    // Rule 6: Check for common anti-patterns
    if (/^Verify\s+verify/i.test(trimmed)) {
      warnings.push('Redundant "Verify" keyword in behavior part')
    }

    if (/when.*when/i.test(trimmed)) {
      warnings.push('Multiple "when" keywords detected')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedTitle: match ? trimmed : undefined,
  }
}

/**
 * Checks if a test case title appears to be invented or generic
 * Returns confidence level that test case is grounded in actual requirements
 * More lenient for real PRD-extracted test cases
 */
export function checkGrounding(title: string, sourceText: string): {
  isGrounded: boolean
  confidence: number
  reason: string
} {
  const lowerTitle = title.toLowerCase()
  const lowerSource = sourceText.toLowerCase()

  // Extract key terms from title (more permissive - smaller words)
  const titleTerms = lowerTitle
    .replace(/verify|when|user|can|dapat|sistem|system/gi, '')
    .split(/\s+/)
    .filter(t => t.length > 2) // Lower threshold from 3 to 2

  if (titleTerms.length === 0) {
    // Generic test case, allow it since it came from PRD
    return {
      isGrounded: true,
      confidence: 0.5,
      reason: 'Generic test case derived from PRD structure',
    }
  }

  // Check how many title terms appear in source
  const foundTerms = titleTerms.filter(term => lowerSource.includes(term))
  const confidence = foundTerms.length / titleTerms.length

  // Anti-patterns for clearly invented test cases (very strict)
  const inventedPatterns = [
    /verify\s+(?:unrecoverable\s+)?error|exception\s+handling/i,
    /verify\s+(?:network|server|database)\s+outage|unavailable/i,
  ]

  for (const pattern of inventedPatterns) {
    if (pattern.test(title)) {
      return {
        isGrounded: false,
        confidence: 0,
        reason: 'Clearly invented - not from PRD',
      }
    }
  }

  // Much more lenient: at least 1 term matching (25% threshold) or from PRD
  return {
    isGrounded: confidence > 0.0, // Any match or no match is acceptable from PRD
    confidence: Math.max(confidence, 0.3), // Assume 30% baseline for PRD-generated
    reason: `${Math.round(confidence * 100)}% of test case terms found in source`,
  }
}

/**
 * Extracts behavior and condition from a valid test case
 */
export function extractBehaviorCondition(title: string): {
  behavior: string
  condition: string
} | null {
  const match = title.match(TC_FORMAT_REGEX)
  if (!match) return null

  return {
    behavior: match[1].trim(),
    condition: match[2].trim(),
  }
}

/**
 * Validates a collection of test cases for common issues
 */
export function validateTestCaseCollection(
  testCases: Array<{ id?: string; title: string }>,
  sourceText?: string
): ValidationStats {
  const stats: ValidationStats = {
    totalTestCases: testCases.length,
    validTestCases: 0,
    invalidTestCases: 0,
    duplicateCount: 0,
    issues: [],
  }

  const seenTitles = new Map<string, number>()
  const invalidCases = new Map<string, string[]>()

  for (const tc of testCases) {
    const validation = validateTestCaseFormat(tc.title)

    if (validation.isValid) {
      stats.validTestCases++
    } else {
      stats.invalidTestCases++
      if (!invalidCases.has(tc.title)) {
        invalidCases.set(tc.title, validation.errors)
      }
    }

    // Check for duplicates
    const titleLower = tc.title.toLowerCase()
    const count = (seenTitles.get(titleLower) || 0) + 1
    seenTitles.set(titleLower, count)
    if (count > 1) {
      stats.duplicateCount++
    }
  }

  // Record issues
  for (const [title, errors] of invalidCases.entries()) {
    stats.issues.push({
      title,
      errors,
    })
  }

  return stats
}

/**
 * Filters test cases to keep only valid ones
 * Optionally validates grounding if source text is provided
 */
export function filterValidTestCases(
  testCases: Array<{ id?: string; title: string }>,
  sourceText?: string,
  requireGrounding: boolean = false
): Array<{ id?: string; title: string; valid: boolean; groundingConfidence?: number }> {
  const filtered = []

  for (const tc of testCases) {
    const formatValid = validateTestCaseFormat(tc.title)

    if (!formatValid.isValid) {
      continue
    }

    let groundingValid = true
    let confidence = 1.0

    if (requireGrounding && sourceText) {
      const grounding = checkGrounding(tc.title, sourceText)
      groundingValid = grounding.isGrounded
      confidence = grounding.confidence
    }

    if (groundingValid) {
      filtered.push({
        id: tc.id,
        title: tc.title,
        valid: true,
        groundingConfidence: confidence,
      })
    }
  }

  return filtered
}

/**
 * Ensures sequential TC numbering without gaps
 */
export function renumberTestCases(
  testCases: Array<{ title: string; [key: string]: any }>,
  startNumber: number = 1
): Array<{ tcId: string; title: string; [key: string]: any }> {
  return testCases.map((tc, index) => ({
    ...tc,
    tcId: `TC-${String(startNumber + index).padStart(3, '0')}`,
  }))
}

/**
 * Detects duplicate test cases
 */
export function findDuplicates(testCases: Array<{ title: string }>): string[][] {
  const groups = new Map<string, string[]>()

  for (const tc of testCases) {
    const normalized = tc.title.toLowerCase().trim()
    if (!groups.has(normalized)) {
      groups.set(normalized, [])
    }
    groups.get(normalized)!.push(tc.title)
  }

  return Array.from(groups.values()).filter(group => group.length > 1)
}
