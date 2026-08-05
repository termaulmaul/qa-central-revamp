/**
 * Behavior Classifier: Determines Positive vs Negative behavior from PRD content
 * Uses constraint analysis and error detection to generate negative test scenarios
 */

export type Behavior = 'Positive' | 'Negative'

export interface BehaviorClassification {
  behavior: Behavior
  confidence: number // 0-1
  reasoning: string
  isConstraintBased: boolean
  isErrorBased: boolean
}

export interface NegativeScenario {
  originalBehavior: string
  negativeVariation: string
  type: 'boundary' | 'constraint' | 'error' | 'validation' | 'edge-case'
  rationale: string
}

/**
 * Keywords indicating error/negative scenarios
 */
const NEGATIVE_INDICATORS = [
  'error', 'fail', 'failure', 'failed', 'invalid', 'incorrect', 'wrong',
  'denied', 'reject', 'rejection', 'timeout', 'exception', 'abort',
  'cancel', 'cancelled', 'unavailable', 'offline', 'disconnect', 'unauthorized',
  'forbidden', 'not allowed', 'cannot', 'should not', 'must not',
  'empty', 'null', 'undefined', 'missing', 'not found', '404',
  'exceeds', 'overflow', 'underflow', 'malformed', 'corrupted', 'breach',
  'blocked', 'suspended', 'frozen', 'expired', 'revoked', 'locked', 'disabled', 
  'banned', 'violation', 'compromised', 'warning', 'critical', 'fatal', 'crash'
]

/**
 * Keywords indicating constraint violations
 */
const CONSTRAINT_INDICATORS = [
  'max', 'maximum', 'min', 'minimum', 'only', 'exactly', 'limited',
  'restricted', 'exclusive', 'no more than', 'at least', 'between',
  'range', 'boundary', 'threshold', 'cap', 'ceiling', 'floor',
  'mandatory', 'compulsory', 'prerequisite', 'dependent on', 'depends on', 
  'strictly'
]

/**
 * Keywords indicating validation/validation rules
 */
const VALIDATION_INDICATORS = [
  'validate', 'verify', 'format', 'pattern', 'regex',
  'require', 'required', 'must contain', 'must include', 'must start',
  'must end', 'length', 'alphanumeric', 'numeric', 'alphabetic',
  'valid', 'check', 'ensure', 'match', 'matches'
]

/**
 * Keywords indicating edge cases
 */
const EDGE_CASE_INDICATORS = [
  'edge case', 'boundary', 'extreme', 'corner case', 'special case',
  'unusual', 'rare', 'exceptional', 'critical point', 'boundary value',
  'limit', 'threshold', 'first', 'last', 'empty', 'full',
  'concurrent', 'simultaneous', 'parallel', 'race condition', 'stress'
]

/**
 * Classifies behavior as Positive or Negative
 */
export function classifyBehavior(text: string, isErrorCondition: boolean = false): BehaviorClassification {
  if (!text || text.length < 5) {
    return {
      behavior: 'Positive',
      confidence: 0.3,
      reasoning: 'Text too short for reliable classification',
      isConstraintBased: false,
      isErrorBased: false,
    }
  }

  const lowerText = text.toLowerCase()

  // If explicitly marked as error condition, it's negative
  if (isErrorCondition) {
    return {
      behavior: 'Negative',
      confidence: 0.95,
      reasoning: 'Explicitly marked as error condition',
      isConstraintBased: false,
      isErrorBased: true,
    }
  }

  // Count negative indicators
  let negativeScore = 0
  let negativeMatches = 0

  for (const indicator of NEGATIVE_INDICATORS) {
    if (lowerText.includes(indicator)) {
      negativeScore++
      negativeMatches++
    }
  }

  // Count constraint indicators
  let constraintScore = 0
  for (const indicator of CONSTRAINT_INDICATORS) {
    if (lowerText.includes(indicator)) constraintScore++
  }

  // Count validation indicators
  let validationScore = 0
  for (const indicator of VALIDATION_INDICATORS) {
    if (lowerText.includes(indicator)) validationScore++
  }

  // Determine if it's a negative test case
  const isNegativeTest = negativeScore > 0 || constraintScore > 0 || validationScore > 0

  if (!isNegativeTest) {
    return {
      behavior: 'Positive',
      confidence: 0.85,
      reasoning: 'No negative indicators found; assuming positive flow',
      isConstraintBased: false,
      isErrorBased: false,
    }
  }

  // Determine confidence
  const totalIndicators = NEGATIVE_INDICATORS.length + CONSTRAINT_INDICATORS.length + VALIDATION_INDICATORS.length
  const matchScore = (negativeScore + constraintScore + validationScore) / totalIndicators
  const confidence = Math.min(0.9 + matchScore * 0.1, 1)

  return {
    behavior: 'Negative',
    confidence,
    reasoning: `Found ${negativeMatches} negative indicator${negativeMatches !== 1 ? 's' : ''} and constraint patterns`,
    isConstraintBased: constraintScore > 0,
    isErrorBased: negativeScore > 0,
  }
}

/**
 * Generates negative test scenario from positive behavior
 */
export function generateNegativeScenario(positiveBehavior: string): NegativeScenario | null {
  const lowerBehavior = positiveBehavior.toLowerCase()

  // Boundary/Constraint violation scenarios
  if (lowerBehavior.match(/max|maximum|min|minimum|exactly|limited/i)) {
    // Extract number if present
    const numberMatch = positiveBehavior.match(/\d+/)
    if (numberMatch) {
      const num = parseInt(numberMatch[0])
      return {
        originalBehavior: positiveBehavior,
        negativeVariation: positiveBehavior.replace(/\d+/, (num + 1).toString()),
        type: 'boundary',
        rationale: 'Exceed maximum constraint',
      }
    }
  }

  // Invalid input scenarios
  if (lowerBehavior.match(/valid|format|pattern|alphanumeric/i)) {
    return {
      originalBehavior: positiveBehavior,
      negativeVariation: `Verify ${positiveBehavior.replace(/verify\s+/i, '')} with invalid input`,
      type: 'validation',
      rationale: 'Invalid input should be rejected',
    }
  }

  // Required field scenarios
  if (lowerBehavior.match(/enter|input|provide|fill/i)) {
    return {
      originalBehavior: positiveBehavior,
      negativeVariation: `Verify ${positiveBehavior.replace(/enter|input|provide|fill/i, 'omit').toLowerCase()} is rejected`,
      type: 'validation',
      rationale: 'Required field validation',
    }
  }

  // Permission/Access scenarios
  if (lowerBehavior.match(/access|view|edit|delete|modify|click/i)) {
    return {
      originalBehavior: positiveBehavior,
      negativeVariation: `Verify user cannot ${positiveBehavior.toLowerCase().replace(/verify|when|user\s+/gi, '')}`,
      type: 'error',
      rationale: 'Unauthorized access attempt',
    }
  }

  // Empty/Null scenarios
  if (lowerBehavior.match(/display|show|returns?|results?/i)) {
    return {
      originalBehavior: positiveBehavior,
      negativeVariation: positiveBehavior.replace(/display|show|returns?|results?/i, 'handles empty result'),
      type: 'edge-case',
      rationale: 'Empty or null data handling',
    }
  }

  // Default: Generic negative variation
  return {
    originalBehavior: positiveBehavior,
    negativeVariation: `Verify ${positiveBehavior.replace(/verify\s+/i, '')} fails appropriately`,
    type: 'error',
    rationale: 'Error handling for edge case',
  }
}

/**
 * Extracts negative test requirements from constraints
 */
export function extractNegativeTestsFromConstraints(constraints: string[]): NegativeScenario[] {
  const scenarios: NegativeScenario[] = []

  for (const constraint of constraints) {
    const lowerConstraint = constraint.toLowerCase()

    // Pattern: "max X items"
    if (lowerConstraint.match(/max|maximum/i)) {
      const numberMatch = constraint.match(/\d+/)
      if (numberMatch) {
        const maxNum = parseInt(numberMatch[0])
        scenarios.push({
          originalBehavior: `User adds ${maxNum} items`,
          negativeVariation: `User attempts to add ${maxNum + 1} items`,
          type: 'boundary',
          rationale: `Exceed maximum limit of ${maxNum}`,
        })
      }
    }

    // Pattern: "min X items"
    if (lowerConstraint.match(/min|minimum/i)) {
      scenarios.push({
        originalBehavior: constraint,
        negativeVariation: `User attempts to proceed with less than required items`,
        type: 'boundary',
        rationale: 'Below minimum requirement',
      })
    }

    // Pattern: "only X allowed"
    if (lowerConstraint.match(/only|exclusive/i)) {
      scenarios.push({
        originalBehavior: constraint,
        negativeVariation: `User attempts to use disallowed option`,
        type: 'constraint',
        rationale: 'Violate exclusive constraint',
      })
    }

    // Pattern: "must be"
    if (lowerConstraint.match(/must\s+be/i)) {
      scenarios.push({
        originalBehavior: constraint,
        negativeVariation: `User provides value that violates "${constraint}"`,
        type: 'validation',
        rationale: 'Validation rule violation',
      })
    }
  }

  return scenarios
}

/**
 * Extracts negative test requirements from error conditions
 */
export function extractNegativeTestsFromErrors(errorConditions: string[]): NegativeScenario[] {
  const scenarios: NegativeScenario[] = []

  for (const condition of errorConditions) {
    // Already in error condition format
    scenarios.push({
      originalBehavior: `Expected successful operation`,
      negativeVariation: `Verify system handles: ${condition}`,
      type: 'error',
      rationale: `Test error scenario: ${condition}`,
    })
  }

  return scenarios
}

/**
 * Generates comprehensive negative tests from analysis
 */
export function generateComprehensiveNegativeTests(
  positiveBehaviors: string[],
  constraints: string[],
  errorConditions: string[],
): NegativeScenario[] {
  const scenarios: NegativeScenario[] = []

  // Generate from constraints
  scenarios.push(...extractNegativeTestsFromConstraints(constraints))

  // Generate from error conditions
  scenarios.push(...extractNegativeTestsFromErrors(errorConditions))

  // Generate from positive behaviors
  for (const behavior of positiveBehaviors) {
    const scenario = generateNegativeScenario(behavior)
    if (scenario) {
      scenarios.push(scenario)
    }
  }

  // Deduplicate
  const uniqueScenarios = new Map<string, NegativeScenario>()
  for (const scenario of scenarios) {
    uniqueScenarios.set(scenario.negativeVariation, scenario)
  }

  return Array.from(uniqueScenarios.values())
}

/**
 * Suggests edge cases for testing
 */
export function suggestEdgeCases(text: string): NegativeScenario[] {
  const edgeCases: NegativeScenario[] = []

  // Empty/null cases
  if (text.match(/list|array|collection|items?|results?/i)) {
    edgeCases.push({
      originalBehavior: text,
      negativeVariation: 'Verify system handles empty collection',
      type: 'edge-case',
      rationale: 'Empty collection should be handled gracefully',
    })
  }

  // Large data cases
  if (text.match(/process|load|display|show/i)) {
    edgeCases.push({
      originalBehavior: text,
      negativeVariation: 'Verify system handles large dataset',
      type: 'edge-case',
      rationale: 'Performance with large data volume',
    })
  }

  // Special character cases
  if (text.match(/input|enter|search|filter/i)) {
    edgeCases.push({
      originalBehavior: text,
      negativeVariation: 'Verify system handles special characters',
      type: 'edge-case',
      rationale: 'XSS and injection prevention',
    })
  }

  // Duplicate cases
  if (text.match(/add|create|save|submit/i)) {
    edgeCases.push({
      originalBehavior: text,
      negativeVariation: 'Verify system prevents duplicate entries',
      type: 'edge-case',
      rationale: 'Duplicate prevention and idempotency',
    })
  }

  return edgeCases
}
