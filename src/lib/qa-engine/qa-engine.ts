import getEnhancedTestCasesFn from './strict-prd-parser-enhanced'
import { buildScopeAuthSteps } from './auth-steps'
import { genId } from './id'
import {
  analyzePRD as analyzePRDStructure,
  extractCapabilitiesWithRequirements,
  extractBehaviorsFromCapability,
  type PRDContent,
} from './prd-analyzer'
import {
  validateTestCaseFormat,
  checkGrounding,
  filterValidTestCases,
  renumberTestCases,
  findDuplicates,
} from './qa-validator'
import {
  formatTestCatalogue,
  groupByCapability,
  generateCoverageStats,
  sanitizeCapabilityName,
  validateCatalogueFormat,
} from './test-catalog-formatter'
import { generateExecutableSteps } from './step-generator'
import { evaluateTestCaseQuality, deduceSuiteRecommendation } from './logic-engine'

// Import priority criteria from strict parser
import { PRIORITY_CRITERIA } from './strict-prd-parser'

// Re-export for external use
export { PRIORITY_CRITERIA }

/**
 * Normalizes a test case title to enforce strict "Verify [Behavior] when [Condition]" format.
 * - Must start with "Verify"
 * - Must contain "when" to separate behavior from condition
 * - If already has "Verify", keeps it as-is
 * - If lacks "when", attempts to split the title intelligently
 * Ensures consistent high-level test scenario naming.
 */
export function normalizeTestCaseTitle(title: string): string {
  const trimmed = title.trim()
  
  // If already properly formatted, return as-is
  if (trimmed.toLowerCase().includes(' when ')) {
    if (trimmed.toLowerCase().startsWith('verify')) {
      return trimmed
    }
    // Has "when" but missing "Verify" prefix
    if (trimmed.toLowerCase().startsWith('when ')) {
      return `Verify ${trimmed.slice(5)}`
    }
    // Has "when" in the middle but doesn't start with "Verify"
    return `Verify ${trimmed}`
  }
  
  // No "when" found — try to intelligently split
  // Look for common condition patterns to identify the split point
  const lowerTitle = trimmed.toLowerCase()
  const conditionMarkers = [' on ', ' at ', ' from ', ' to ', ' by ', ' via ', ' after ', ' before ', ' during ', ' while ']
  
  let splitIndex = -1
  for (const marker of conditionMarkers) {
    const idx = lowerTitle.indexOf(marker)
    if (idx > 0) {
      splitIndex = idx
      break
    }
  }
  
  if (splitIndex > 0) {
    const behavior = trimmed.slice(0, splitIndex).trim()
    const condition = trimmed.slice(splitIndex + 1).trim()
    return `Verify ${behavior} when ${condition}`
  }
  
  // If starts with "Verify", just ensure "when" is inserted intelligently
  if (lowerTitle.startsWith('verify ')) {
    // For titles like "Verify user can do X", default to suggesting
    // we'd need more context, so just capitalize and return
    return trimmed
  }
  
  // Last resort: prepend "Verify" and hope for clarity
  return `Verify ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`
}

/**
 * Validates if a title follows the strict "Verify [Behavior] when [Condition]" format.
 * Returns true only if it starts with "Verify" and contains " when ".
 */
export function isValidTestCaseTitle(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.toLowerCase().startsWith('verify') && trimmed.toLowerCase().includes(' when ')
}

/**
 * Extracts the behavior and condition from a properly formatted title.
 * Returns null if the title doesn't follow the format.
 * Example: "Verify Stock Screener opens from Market page when user clicks Stock Screener link"
 * Returns: { behavior: "Stock Screener opens from Market page", condition: "user clicks Stock Screener link" }
 */
export function extractBehaviorAndCondition(title: string): { behavior: string; condition: string } | null {
  const trimmed = title.trim()
  const match = trimmed.match(/^Verify\s+(.+?)\s+when\s+(.+)$/i)
  if (!match) return null
  return { behavior: match[1], condition: match[2] }
}

export interface TestCase {
  id: string
  tcId: string
  suite: string
  title: string
  priority: string // P0: MUST TEST, P1: SHOULD TEST, P2: COULD TEST, P3: OPTIONAL
  behavior: 'Positive' | 'Negative'
  type: string
  precondition: string
  postcondition: string
  steps: Array<{ order?: number; action: string; expectedResult: string; expected?: string; source: string; data?: string; sharedStepId?: string; requirementId?: string; }>
  tags: string[]
  requirementId?: string
  qualityScore?: number
}

export interface CoverageItem {
  area: string
  progress: string
}

// Store parsed PRD content globally for access between steps
import { loadQAGuidelinesState } from '../qa-guidelines-store'

const qaGuidelines = loadQAGuidelinesState()
const systemPrompt = `You are a QA expert. Use these RAG guidelines: ${JSON.stringify(qaGuidelines)}`
console.log('System Prompt Initialized:', systemPrompt)

let cachedPRDContent: PRDContent | null = null

/**
 * Build feature-specific pre-condition based on module
 */
function buildPrecondition(moduleNum: number, moduleName: string): string {
  const preconditions: Record<number, string> = {
    1: 'User is logged in and on Market page. Navigation menu is visible.',
    2: 'User is on Popular tab. All filter controls are visible and responsive.',
    3: 'User is on Popular tab. Fundamental data is loaded for all stocks.',
    4: 'User is on Technical tab. All preset options are displayed.',
    5: 'User is on Technical tab. Preset save functionality is accessible.',
    6: 'User is on Technical tab. Condition builder interface is open.',
    7: 'User is on Technical tab. Universe selection dropdown is available.',
    8: 'User is on screening interface. Period selector is visible.',
    9: 'User has completed screening. Result table is displayed.',
    10: 'User has screening results. Backtest button is accessible.',
    11: 'User has initiated backtest. Backtest results page is loaded.',
    12: 'User has screening results. Export option is available.',
    13: 'User has saved screeners. Save/Load interface is accessible.',
    14: 'User is on screener. Data type toggle is visible.',
    15: 'User views screener results. Data values are displayed.',
    16: 'User is on screener interface. Alert option is accessible.',
    17: 'User is on any screener page. UI elements are visible.',
    18: 'User is logged in. Account tier (Free/Premium) is determined.',
    19: 'User has used screener features. Analytics tracking is enabled.',
  }
  
  return preconditions[moduleNum] || `User is on ${moduleName} interface. All required controls are visible and responsive.`
}

/**
 * Build feature-specific post-condition based on module
 */
function buildPostcondition(moduleNum: number, moduleName: string): string {
  const postconditions: Record<number, string> = {
    1: 'Stock Screener page loads. Popular tab displays fundamental data.',
    2: 'Filters are added/removed. Result count updates.',
    3: 'Fundamental data is displayed correctly. All fields are visible.',
    4: 'Preset is applied. Results update based on preset criteria.',
    5: 'Custom preset is saved. Preset persists in user profile.',
    6: 'Conditions are configured. Screening runs with new conditions.',
    7: 'Universe is selected. Results filter to selected universe.',
    8: 'Period is selected. Data refreshes for selected period.',
    9: 'Results display in table. Sorting and pagination work.',
    10: 'Basket is configured. Backtest can be executed.',
    11: 'Backtest results display. Statistics and chart are visible.',
    12: 'File is downloaded. Export format is correct.',
    13: 'Screener is saved. Configuration persists across sessions.',
    14: 'Data type is toggled. Status indicator updates.',
    15: 'Data values match source. Calculations are correct.',
    16: 'Alert is created. Notification rule is active.',
    17: 'UI state displays correctly. Text is in selected language.',
    18: 'Features are gated. User can only access permitted features.',
    19: 'Action is logged. Analytics event is recorded.',
  }
  
  return postconditions[moduleNum] || `${moduleName} state is updated. Changes are reflected in UI and persisted.`
}

/**
 * Determine test type based on module functionality
 */
function getTestType(moduleNum: number, moduleName: string): string {
  if ([10, 11, 14].includes(moduleNum)) return 'Functional · Transaction'
  if ([15, 18].includes(moduleNum)) return 'Functional · Validation'
  if ([19].includes(moduleNum)) return 'Functional · Logging'
  return 'Functional · Logic/Flow'
}

/**
 * Extract action from test case title
 */
function extractAction(title: string): string {
  // Extract the part after "when user"
  const match = title.match(/when\s+user\s+(.+?)(?:\s*$)/i)
  return match ? `User ${match[1]}` : title
}

/**
 * Extract expected result from test case title
 */
function extractExpectedResult(title: string): string {
  // Extract the part between "Verify" and "when"
  const match = title.match(/verify\s+(.+?)\s+when/i)
  if (match) {
    const behavior = match[1]
    return `System ${behavior} successfully. Result is observable in UI.`
  }
  return 'Expected behavior is verified.'
}

/**
 * Extract all features from PRD text matching F1 — Feature Name pattern
 * Handles all 21 features (F1-F21) from Stock Screener PRD
 */
function extractFeaturesFromText(prdText: string): Array<{
  featureId: string
  name: string
  description: string
  details: string[]
}> {
  const features: Array<{
    featureId: string
    name: string
    description: string
    details: string[]
  }> = []

  // Split by "Use Cases (Feature List)" section
  const featureSection = prdText.includes('Use Cases')
    ? prdText.split('Use Cases')[1].split('Diagram')[0]
    : prdText

  // Find all features with pattern: F1 — Name:, F2 — Name:, etc.
  const lines = featureSection.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Match pattern like "1. F1 — Name:" or "F1 — Name:"
    const match = line.match(/(?:\d+\.\s+)?(F\d+)\s*(?:—|–|-)\s*([^:]+):\s*(.*?)$/i)
    
    if (match) {
      const featureId = match[1]
      const name = match[2].trim()
      let description = match[3].trim()

      // Collect description from next lines until we hit another feature or end
      const descLines = description ? [description] : []
      let j = i + 1
      
      while (j < lines.length) {
        const nextLine = lines[j].trim()
        
        // Stop if we encounter next feature
        if (/^\d+\.\s+F\d+\s*(?:—|–|-)/.test(nextLine) || /^F\d+\s*(?:—|–|-)/.test(nextLine)) {
          break
        }
        
        // Stop if we encounter new section
        if (/^(Diagram|Design|Flow|Aliran|2A\.|2B\.|3\.|4\.|5\.)/.test(nextLine)) {
          break
        }
        
        if (nextLine.length > 0) {
          descLines.push(nextLine)
        }
        j++
      }

      description = descLines.join(' ').trim()

      // Extract user story keywords for later test case generation
      const details = description
        .split('.')
        .map(d => d.trim())
        .filter(d => d.length > 5 && /^(user|User|sebagai|dapat|dapat melihat|dapat|dapat klik)/i.test(d))
        .slice(0, 5)

      features.push({
        featureId,
        name,
        description,
        details,
      })
    }
  }

  return features
}

/**
 * Generate comprehensive test scenarios for each feature (8-10 scenarios per feature = ~170 total)
 */
function generateTestScenariosFromFeature(
  feature: {
    featureId: string
    name: string
    description: string
    details: string[]
  },
  moduleNum: number
): Array<{
  behavior: string
  condition: string
  action: string
  expectedResult: string
  isCritical: boolean
  source: string
}> {
  const scenarios: Array<{
    behavior: string
    condition: string
    action: string
    expectedResult: string
    isCritical: boolean
    source: string
  }> = []

  const fullText = `${feature.name}. ${feature.description} ${feature.details.join(' ')}`
  const keywords = fullText.toLowerCase()

  // S1: Main feature entry/opening (CRITICAL)
  scenarios.push({
    behavior: `${feature.name} interface is displayed`,
    condition: `user accesses ${feature.name}`,
    action: `Navigate to ${feature.name} feature`,
    expectedResult: `System displays ${feature.name} interface with all controls visible and ready for interaction. No errors or blank states.`,
    isCritical: true,
    source: feature.featureId,
  })

  // S2: Primary user action/capability
  if (keywords.includes('dapat') || keywords.includes('can')) {
    const canMatch = fullText.match(/(?:dapat|can)\s+([^,]+)/i)
    if (canMatch) {
      scenarios.push({
        behavior: `${canMatch[1].trim()} is executed successfully`,
        condition: `user performs primary action`,
        action: `Execute: ${canMatch[1].trim()}`,
        expectedResult: `System completes the action and displays confirmation in UI. Result is persisted in backend.`,
        isCritical: true,
        source: feature.featureId,
      })
    }
  }

  // S3: Data display/retrieval
  scenarios.push({
    behavior: `correct data is displayed and formatted`,
    condition: `user views ${feature.name}`,
    action: `Verify all data fields are present, formatted correctly, and match backend values`,
    expectedResult: `System displays all required data fields with accurate values matching source system. No missing or malformed data.`,
    isCritical: true,
    source: feature.featureId,
  })

  // S4: Selection/Choice
  if (keywords.includes('select') || keywords.includes('pilih') || keywords.includes('memilih')) {
    scenarios.push({
      behavior: `selection is applied and persisted`,
      condition: `user makes a selection`,
      action: `Select an option from available choices and confirm`,
      expectedResult: `System marks selected item visually. Results update to reflect new selection. State is saved for next session.`,
      isCritical: true,
      source: feature.featureId,
    })
  }

  // S5: Search/Filter
  if (keywords.includes('search') || keywords.includes('filter') || keywords.includes('mencari')) {
    scenarios.push({
      behavior: `search/filter results are accurate and complete`,
      condition: `user enters search or filter criteria`,
      action: `Enter search term or apply filter criteria`,
      expectedResult: `System immediately filters results. Table displays only matching items. Count badge updates to show filtered result total.`,
      isCritical: true,
      source: feature.featureId,
    })
  }

  // S6: Deletion/Removal
  if (keywords.includes('delete') || keywords.includes('hapus') || keywords.includes('remove') || keywords.includes('menghapus')) {
    scenarios.push({
      behavior: `item is successfully deleted and removed from UI`,
      condition: `user deletes an item`,
      action: `Click delete button and confirm deletion action`,
      expectedResult: `System removes item from UI table. Database record is deleted. Toast confirmation "Item deleted" appears.`,
      isCritical: false,
      source: feature.featureId,
    })
  }

  // S7: Modification/Editing
  if (keywords.includes('edit') || keywords.includes('rename') || keywords.includes('ubah') || keywords.includes('ganti') || keywords.includes('mengubah')) {
    scenarios.push({
      behavior: `modifications are saved and reflected immediately`,
      condition: `user edits existing item`,
      action: `Modify item details and click save button`,
      expectedResult: `System saves changes to backend. UI updates to show new values. Toast "Saved" appears. Changes persist across sessions.`,
      isCritical: false,
      source: feature.featureId,
    })
  }

  // S8: Persistence/Cross-session storage
  if (keywords.includes('tersimpan') || keywords.includes('persist') || keywords.includes('save') || keywords.includes('antar sesi')) {
    scenarios.push({
      behavior: `data persists across sessions`,
      condition: `user closes and reopens application`,
      action: `Save data, close application completely, reopen and navigate back to feature`,
      expectedResult: `System loads and displays saved data exactly as it was. No data loss. State is fully recovered.`,
      isCritical: true,
      source: feature.featureId,
    })
  }

  // S9: Limitation/Constraint enforcement
  if (keywords.includes('maksimal') || keywords.includes('maximum') || keywords.includes('max') || keywords.includes('limit')) {
    const limitMatch = fullText.match(/(?:maksimal|maximum|max|up to)\s+(\d+)/i)
    if (limitMatch) {
      scenarios.push({
        behavior: `limit of ${limitMatch[1]} is enforced and user cannot exceed`,
        condition: `user attempts to exceed limit of ${limitMatch[1]}`,
        action: `Attempt to create or add more than ${limitMatch[1]} items. Click add button at limit.`,
        expectedResult: `System disables add button or shows error message in red: "Maximum ${limitMatch[1]} allowed". Action is blocked.`,
        isCritical: true,
        source: feature.featureId,
      })
    }
  }

  // S10: Sorting/Ordering
  if (keywords.includes('sort') || keywords.includes('mengurutkan') || keywords.includes('order') || keywords.includes('arrange')) {
    scenarios.push({
      behavior: `items are sorted correctly according to selected column`,
      condition: `user selects sort option`,
      action: `Click column header or sort dropdown to change sort order`,
      expectedResult: `System immediately reorders table rows. Sort indicator appears on column. Results reflect new order correctly.`,
      isCritical: false,
      source: feature.featureId,
    })
  }

  // S11: Pagination
  if (keywords.includes('halaman') || keywords.includes('pagination') || keywords.includes('page') || keywords.includes('per halaman')) {
    scenarios.push({
      behavior: `pagination navigates correctly between pages`,
      condition: `user navigates between pages`,
      action: `Click next/previous page buttons or select page number`,
      expectedResult: `System loads correct page subset. Table displays new set of 10 results. Page number is highlighted. All pagination controls work.`,
      isCritical: false,
      source: feature.featureId,
    })
  }

  return scenarios
}

/**
 * Extract features from generic PRD structure (when F1 — pattern not found)
 * Works with any PRD that has sections, capabilities, requirements, or features
 */
function extractFeaturesFromGenericPRD(prdContent: PRDContent, prdText: string): Array<{
  featureId: string
  name: string
  description: string
  details: string[]
}> {
  const features: Array<{
    featureId: string
    name: string
    description: string
    details: string[]
  }> = []

  const processSection = (section: any, prefix: string) => {
    // Check if section contains numbered items like "1. ", "2. ", etc. at the start of lines
    const items = section.content.split(/(?=\n\d+\.\s+)/)
    
    if (items.length > 1) {
      items.forEach((item: string, i: number) => {
        const itemText = item.trim()
        if (!itemText) return
        
        // Use first line or sentence as name
        let nameMatch = itemText.match(/^(?:(?:\d+\.\s+)?)([^.\n]+)/)
        let subName = nameMatch ? nameMatch[1].trim() : `Item ${i+1}`
        if (subName.length > 60) subName = subName.substring(0, 60) + '...'
        
        features.push({
          featureId: `${prefix}.${i+1}`,
          name: subName,
          description: itemText,
          details: itemText.split('\n'),
        })
      })
    } else {
      const name = section.title.replace(/^(Functional Requirements?|F\d+\s*[-–—]?|.*:\s*|User Stories?|Story|Use Cases?|Scenarios?|Business Rules?|Rules?)/i, '').trim()
      features.push({
        featureId: prefix,
        name: name || `Feature ${prefix}`,
        description: section.content,
        details: section.lines,
      })
    }
  }

  // Strategy 1: Use functional requirements if available
  if (prdContent.functionalRequirements.length > 0) {
    prdContent.functionalRequirements.forEach((section, idx) => {
      processSection(section, `F${idx + 1}`)
    })
    if (features.length > 0) return features
  }

  // Strategy 2: Use user stories if no functional requirements
  if (features.length === 0 && prdContent.userStories.length > 0) {
    prdContent.userStories.forEach((section, idx) => {
      processSection(section, `F${idx + 1}`)
    })
    if (features.length > 0) return features
  }

  // Strategy 3: Use use cases if available
  if (features.length === 0 && prdContent.useCases.length > 0) {
    prdContent.useCases.forEach((section, idx) => {
      processSection(section, `F${idx + 1}`)
    })
    if (features.length > 0) return features
  }

  // Strategy 4: Use business rules and acceptance criteria
  if (features.length === 0 && prdContent.businessRules.length > 0) {
    prdContent.businessRules.forEach((section, idx) => {
      processSection(section, `F${idx + 1}`)
    })
    if (features.length > 0) return features
  }

  // Strategy 5: If still empty, extract capabilities from all sections
  if (features.length === 0 && prdContent.allSections.length > 0) {
    prdContent.allSections.forEach((section, idx) => {
      if (section.content.trim().length > 0) {
        processSection(section, `F${idx + 1}`)
      }
    })
    if (features.length > 0) return features
  }

  // Strategy 6: If absolutely nothing, fallback to generic discovery from raw text
  if (features.length === 0) {
    const lines = prdText
      .split('\n')
      .filter(line => line.trim().length > 10)
      .slice(0, 10)

    lines.forEach((line, idx) => {
      const cleanedLine = line.replace(/^#+\s*/, '').trim()
      if (cleanedLine.length > 5 && cleanedLine.length < 100) {
        features.push({
          featureId: `F${idx + 1}`,
          name: cleanedLine,
          description: `Extracted capability: ${cleanedLine}`,
          details: [cleanedLine],
        })
      }
    })
    if (features.length > 0) return features
  }

  // Ensure we always return at least one feature
  if (features.length === 0) {
    features.push({
      featureId: 'F1',
      name: 'System Requirements',
      description: 'Core system functionality from PRD',
      details: ['System requirement discovery'],
    })
  }

  return features
}

export const QAEngine = {
  analyzePRD: async (text: string) => {
    // Parse PRD structure from actual PDF text
    const prdContent = analyzePRDStructure(text)
    
    // Cache for later use
    cachedPRDContent = prdContent
    
    // Extract features from text - supports both Stock Screener (F1 —) and generic PRDs
    let features = extractFeaturesFromText(text)
    
    // If no features found from stock screener pattern, try to extract capabilities from generic PRD structure
    if (features.length === 0) {
      features = extractFeaturesFromGenericPRD(prdContent, text)
    }
    
    // Create coverage items from features
    const coverage: CoverageItem[] = features.map((feat, idx) => ({
      area: `Module ${idx + 1} - ${feat.name}`,
      progress: `${feat.featureId || `F${idx + 1}`}`,
    }))
    
    return {
      coverage,
      prdContent,
    }
  },

  generateTests: async (prdText: string, prdContent?: PRDContent): Promise<TestCase[]> => {
    // --- DYNAMIC RAG PROMPT BUILDER ---
    const guidelines = loadQAGuidelinesState().guidelinesText;
    const systemPrompt = `[SYSTEM]
You are a Principal QA Architect. Your job is to map PRD requirements into High-Level Test Scenarios.

[CONTEXT - QA GUIDELINES (RAG)]
${guidelines || 'No specific company guidelines provided. Use standard best practices.'}

[USER]
Analyze this PRD and generate test cases:
${prdText.substring(0, 500)}... (truncated for preview)`;

    console.log("%c[AI Engine] Compiled Dynamic RAG Prompt:\n", "color: #3b82f6; font-weight: bold", systemPrompt);
    // ----------------------------------

    // Check if this is Stock Screener PRD - use enhanced parser with BOTH positive and negative cases
    const isStockScreener = prdText.toLowerCase().includes('stock screener') || prdText.toLowerCase().includes('F1 —')
    
    if (isStockScreener) {
      // Import and use enhanced test mapping with negative cases and all test types
      const getEnhancedTestCases = getEnhancedTestCasesFn
      const modules = getEnhancedTestCases()
      const generatedTests: TestCase[] = []

      // Convert enhanced modules to TestCase format following QA standards
      for (const module of modules) {
        for (const testCase of module.testCases) {
          const precondition = buildPrecondition(module.moduleNum, module.name)
          const postcondition = buildPostcondition(module.moduleNum, module.name)

          const suiteRecommendation = deduceSuiteRecommendation(module.name);
          const candidateTc: TestCase = {
            id: genId(),
            tcId: testCase.tcId,
            suite: `${suiteRecommendation.suite} - ${suiteRecommendation.subSuite}`,
            title: testCase.title,
            priority: testCase.priority,
            behavior: testCase.behavior, // Positive or Negative from enhanced parser
            type: testCase.testType, // E2E, Security, API/Data Integration, Analytics/Tracking, etc.
            precondition,
            postcondition,
            steps: generateExecutableSteps(module.moduleNum, module.name, testCase.title, testCase.behavior),
            tags: [
              'from-prd-enhanced',
              module.name.toLowerCase().replace(/\s+/g, '-'),
              testCase.priority.toLowerCase(),
              testCase.behavior.toLowerCase(),
              testCase.testType.toLowerCase().replace(/\s+/g, '-'),
            ],
            requirementId: `FR-${module.moduleNum}`,
          }

          const quality = evaluateTestCaseQuality(candidateTc)
          candidateTc.qualityScore = quality.total
          
          if (quality.passed) {
            generatedTests.push(candidateTc)
          } else {
            console.warn(`[Logic Engine] Rejected Test Case ${testCase.tcId} due to low quality score: ${quality.total}`, quality.feedback)
          }
        }
      }

      console.log(`[v0] Generated ${generatedTests.length} enhanced test cases (Positive + Negative) from Stock Screener PRD`)
      console.log(`[v0] Test Types: Functional·Logic/Flow, Functional·Transaction, E2E, API/Data Integration, Security, Analytics/Tracking`)
      return generatedTests
    }

    // Fallback: Generate from extracted features for other PRDs
    const generatedTests: TestCase[] = []
    let tcCounter = 1
    let features = extractFeaturesFromText(prdText)
    
    if (features.length === 0 && prdContent) {
      features = extractFeaturesFromGenericPRD(prdContent, prdText)
    }
    
    console.log(`[v0] Extracted ${features.length} features from PRD`)

    for (let featureIdx = 0; featureIdx < features.length; featureIdx++) {
      const feature = features[featureIdx]
      const scenarios = generateTestScenariosFromFeature(feature, featureIdx + 1)
      
      for (const scenario of scenarios) {
        const title = `Verify ${scenario.behavior} when ${scenario.condition}`
        if (!title.toLowerCase().startsWith('verify') || !title.includes(' when ')) {
          continue
        }

        let priority: string = 'High'
        if (scenario.isCritical) {
          priority = 'Critical'
        } else if (scenario.behavior.includes('delete') || scenario.behavior.includes('persistence')) {
          priority = 'High'
        } else {
          priority = 'Medium'
        }

        const suiteRecommendation = deduceSuiteRecommendation(feature.name);
        const candidateTc: TestCase = {
          id: genId(),
          tcId: `TC-${String(tcCounter).padStart(3, '0')}`,
          suite: `${suiteRecommendation.suite} - ${suiteRecommendation.subSuite}`,
          title,
          priority,
          behavior: 'Positive',
          type: 'Functional · Logic/Flow',
          precondition: `User is on ${feature.name} interface. All required controls visible.`,
          postcondition: `${feature.name} state updated. Changes reflected in UI.`,
          steps: generateExecutableSteps(featureIdx + 1, feature.name, title, 'Positive'),
          tags: ['from-prd', feature.featureId.toLowerCase(), priority.toLowerCase()],
          requirementId: feature.featureId,
        }

        const quality = evaluateTestCaseQuality(candidateTc)
        candidateTc.qualityScore = quality.total
        
        if (quality.passed) {
          generatedTests.push(candidateTc)
          tcCounter++
        } else {
          console.warn(`[Logic Engine] Rejected fallback TC due to low quality score: ${quality.total}`, quality.feedback)
        }
      }
    }

    console.log(`[v0] Generated ${generatedTests.length} test cases from ${features.length} features`)
    return generatedTests
  },

  // Keep existing tests as fallback for demonstration (will be removed once real parsing works)
  _generateTestsLegacy: async (): Promise<TestCase[]> => {
    await new Promise((r) => setTimeout(r, 1500))

    return [
      {
        id: genId(),
        tcId: 'TC-001',
        suite: 'F1 - Popular Screener',
        title: 'Verify Stock Screener opens from Market page when user clicks Stock Screener link',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User is logged in and navigated to Market page',
        postcondition: 'Stock Screener page opens with Popular tab displayed',
        steps: [
          {
            action: 'On Market page, click "Stock Screener" link in the navigation menu',
            expectedResult:
              'System navigates to Stock Screener and displays Popular tab with data table (ticker, harga terakhir, perubahan, volume)',
            source: 'PRD F1',
          },
        ],
        tags: ['navigation', 'F1'],
      },
      {
        id: genId(),
        tcId: 'TC-002',
        suite: 'F1 - Popular Screener',
        title:
          'Verify Popular Screener displays fundamental data table with search capability when page loads',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Transaction',
        precondition:
          'User is on Stock Screener Popular tab and real-time/delayed data feed is active (accuracy ≥ 99.9%)',
        postcondition:
          'Data table displays with columns: Ticker, Harga Terakhir, Perubahan (Rp & %), Volume, P/E Ratio, dividend yield sesuai spesifikasi',
        steps: [
          {
            action: 'Open Stock Screener Popular tab',
            expectedResult:
              'System displays table dengan 900+ emiten IDX, sorted by default criteria, maksimum 10 per halaman',
            source: 'PRD F1',
          },
          {
            action: 'Enter stock ticker (e.g., "BBCA") in Search stock column',
            expectedResult:
              'System filters table real-time dan menampilkan hanya baris BBCA dengan data fundamental terkini',
            source: 'PRD F1',
          },
        ],
        tags: ['popular', 'search', 'F1'],
      },
      {
        id: genId(),
        tcId: 'TC-003',
        suite: 'F1 - Popular Screener',
        title: 'Verify clicking stock row navigates to Stock Detail with full fundamental information',
        priority: 'High',
        behavior: 'Positive',
        type: 'End-to-End (E2E)',
        precondition:
          'User is on Stock Screener Popular tab and table is displaying dengan minimal 1 hasil',
        postcondition:
          'Stock Detail page opens menampilkan complete fundamental data untuk saham terpilih (net income, sector, industry, market cap)',
        steps: [
          {
            action: 'Click any stock row (e.g., BBCA) in the Popular tab table',
            expectedResult:
              'System navigates to Stock Detail page dan displays full fundamental information: sektor, industri, market cap, P/E ratio, dividend yield, net income',
            source: 'PRD F1',
          },
        ],
        tags: ['popular', 'navigation', 'F1'],
      },
      {
        id: genId(),
        tcId: 'TC-004',
        suite: 'F2 - Add Filter (Fundamental)',
        title:
          'Verify user can add maximum 10 fundamental filters with field selection and min-max range input',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User is on Stock Screener Popular tab dan filter builder interface tersedia',
        postcondition:
          'System applies up to 10 active filters dan results table updates dengan hasil screening yang sesuai kriteria',
        steps: [
          {
            action: 'Click "Add Filter" button',
            expectedResult:
              'System displays filter builder dengan dropdown field options: Sector, Industry, Market Cap, P/E Ratio (yearly), P/E Ratio (quarterly), Price per Lot, Day Change (%)',
            source: 'PRD F2',
          },
          {
            action: 'Select "Market Cap" dari dropdown dan input min: 1T, max: 5T',
            expectedResult:
              'System adds Market Cap filter dengan range Rp 1 Triliun - Rp 5 Triliun, menampilkan badge "1 filter aktif"',
            source: 'PRD F2',
          },
          {
            action: 'Click "Add Filter" lagi dan add "P/E Ratio (yearly)" dengan min: 10, max: 25',
            expectedResult:
              'System menampilkan 2 filters active, hasil table di-update menampilkan saham yang match kedua kriteria',
            source: 'PRD F2',
          },
          {
            action: 'Add filters hingga mencapai 10 filter',
            expectedResult:
              'System memungkinkan hingga 10 filter aktif; jika user coba add filter ke-11, tombol "Add Filter" disabled atau menampilkan warning "Maximum 10 filters"',
            source: 'PRD F2',
          },
        ],
        tags: ['filter', 'fundamental', 'F2'],
      },
      {
        id: genId(),
        tcId: 'TC-005',
        suite: 'F2 - Add Filter (Fundamental)',
        title:
          'Verify user can modify and remove filters dan filter count badge updates correctly',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User has 3 active fundamental filters applied',
        postcondition:
          'Filters are modified/removed, hasil table refreshes, filter badge menampilkan jumlah aktif yang tepat',
        steps: [
          {
            action:
              'Modify existing Market Cap filter range dari 1T-5T menjadi 2T-10T dan klik Apply/Save',
            expectedResult:
              'System updates filter dan results table refresh dengan criteria baru, badge tetap menunjukkan "3 filters aktif"',
            source: 'PRD F2',
          },
          {
            action: 'Click delete/remove icon pada salah satu filter (e.g., P/E Ratio)',
            expectedResult:
              'System removes filter, results table refreshes, filter badge updates menjadi "2 filters aktif"',
            source: 'PRD F2',
          },
        ],
        tags: ['filter', 'fundamental', 'F2'],
      },
      {
        id: genId(),
        tcId: 'TC-006',
        suite: 'F3 - Technical Screener Preset',
        title:
          'Verify Technical Screener displays preset strategies dan user dapat scroll untuk melihat semua preset',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User navigated to Stock Screener Technical tab',
        postcondition:
          'Preset strategies ditampilkan dalam scrollable list dengan 7+ predefined strategies (RSI Oversold, RSI Overbought, MACD Bullish, Stoch Oversold, Volume Surge, Strong Trend, MACD Crossover)',
        steps: [
          {
            action: 'Open Stock Screener Technical tab',
            expectedResult:
              'System displays preset screener list dengan kartu/badge untuk setiap preset: RSI Oversold, RSI Overbought, MACD Bullish, Stoch Oversold, Volume Surge, Strong Trend, MACD Crossover',
            source: 'PRD F3',
          },
          {
            action: 'Scroll horizontally atau vertical di preset list untuk melihat lebih banyak',
            expectedResult:
              'System memungkinkan user scroll dan menampilkan semua preset strategies yang tersedia tanpa truncation',
            source: 'PRD F3',
          },
        ],
        tags: ['technical', 'preset', 'F3'],
      },
      {
        id: genId(),
        tcId: 'TC-007',
        suite: 'F4 - Custom Preset Management',
        title: 'Verify user dapat save kombinasi kondisi teknikal sebagai custom preset dengan nama',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User has custom technical conditions configured (3 kondisi maximum)',
        postcondition:
          'Custom preset disimpan dengan nama unik dan tersedia di preset list untuk digunakan ulang antar sesi (Free: max 1, Premium: unlimited)',
        steps: [
          {
            action: 'On Technical tab dengan 3 kondisi configured, klik "Save preset" button',
            expectedResult:
              'System opens modal dialog untuk input preset name (text field dengan placeholder "Contoh: My Strategy")',
            source: 'PRD F4',
          },
          {
            action: 'Input preset name "RSI + MACD Bullish" dan klik Save',
            expectedResult:
              'System saves preset, closes modal, dan preset baru muncul di preset list dengan nama yang sesuai',
            source: 'PRD F4',
          },
        ],
        tags: ['preset', 'custom', 'F4'],
      },
      {
        id: genId(),
        tcId: 'TC-008',
        suite: 'F4 - Custom Preset Management',
        title: 'Verify user dapat rename dan delete custom preset',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition:
          'User memiliki 1+ custom preset tersimpan (Free: 1 preset, Premium: multiple presets)',
        postcondition:
          'Preset direname atau dihapus sesuai aksi user, list di-update, dan perubahan persist antar sesi',
        steps: [
          {
            action:
              'Right-click atau hover pada custom preset card dan klik "Rename" option (atau pada menu dropdown)',
            expectedResult:
              'System displays inline edit field atau modal dengan current preset name yang editable',
            source: 'PRD F4',
          },
          {
            action: 'Change name dari "RSI + MACD Bullish" menjadi "Trend Strategy v2" dan confirm',
            expectedResult:
              'System updates preset name di list dan database, changes persist setelah aplikasi di-reload',
            source: 'PRD F4',
          },
          {
            action:
              'On same preset, klik "Delete" option dan confirm deletion di confirmation dialog',
            expectedResult:
              'System menghapus preset dari list dan database, user tidak bisa akses preset tersebut lagi',
            source: 'PRD F4',
          },
        ],
        tags: ['preset', 'custom', 'F4'],
      },
      {
        id: genId(),
        tcId: 'TC-009',
        suite: 'F5 - Condition Builder (Technical)',
        title:
          'Verify user dapat membuat custom technical conditions (max 3) dengan field, operator, dan value selection',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition:
          'User is on Technical tab dan condition builder interface tersedia dengan 0 kondisi active',
        postcondition:
          'User dapat add hingga 3 custom technical conditions; system validate max 3 dan jalankan screening dengan conditions terpenuhi',
        steps: [
          {
            action: 'Click "Add Condition" button di condition builder',
            expectedResult:
              'System displays first condition row dengan 3 fields: Condition Field dropdown, Operator dropdown (<, >, <=, >=, =), Value input',
            source: 'PRD F5',
          },
          {
            action:
              'Select "RSI" dari Condition Field dropdown, select ">" operator, input value "70"',
            expectedResult:
              'System adds condition "RSI > 70" dan displays \'Add Condition\' button untuk kondisi ke-2',
            source: 'PRD F5',
          },
          {
            action: 'Add kondisi ke-2: "MACD Line" > "Signal Line" dan kondisi ke-3: "Volume" > "50000"',
            expectedResult:
              'System displays 3 kondisi, disables "Add Condition" button, dan ready untuk "Run Screen"',
            source: 'PRD F5',
          },
          {
            action: 'Klik "Run Screen" button',
            expectedResult:
              'System screens universe berdasarkan 3 kondisi: RSI > 70 AND MACD Bullish AND Volume > 50000, menampilkan hasil dalam table',
            source: 'PRD F5',
          },
        ],
        tags: ['technical', 'condition', 'F5'],
      },
      {
        id: genId(),
        tcId: 'TC-010',
        suite: 'F6 - Universe Selection',
        title:
          'Verify user dapat memilih universe (Index, Watchlist, Portfolio) melalui sub-tabs dan dropdown',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition:
          'User is on Stock Screener Technical atau Popular tab dengan universe selector visible',
        postcondition:
          'Universe dipilih dengan benar; screening results hanya menampilkan saham dari universe terpilih',
        steps: [
          {
            action: 'Click "Universe" tab / section di screener interface',
            expectedResult:
              'System displays 3 sub-tabs: Index, Watchlist, Portfolio (user dapat switch antar tabs)',
            source: 'PRD F6',
          },
          {
            action: 'Click "Index" sub-tab dan pilih "LQ45" dari dropdown list',
            expectedResult:
              'System sets universe ke LQ45, indicator menampilkan "LQ45 selected", screening menggunakan 45 saham dari LQ45 index',
            source: 'PRD F6',
          },
          {
            action:
              'Click "Watchlist" sub-tab dan pilih watchlist "Tech Stocks" yang user sudah buat sebelumnya',
            expectedResult:
              'System changes universe ke "Tech Stocks" watchlist, screening results hanya menampilkan saham yang ada di watchlist tersebut',
            source: 'PRD F6',
          },
        ],
        tags: ['universe', 'index', 'watchlist', 'F6'],
      },
      {
        id: genId(),
        tcId: 'TC-011',
        suite: 'Module 5 - Screening Result',
        title: 'Verify screening result accuracy matches all configured filter conditions',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User has applied 3+ filters (Market Cap 1T-5T, P/E 10-25, dividend > 2%)',
        postcondition: 'Result table hanya menampilkan saham yang match ALL filter criteria',
        steps: [
          {
            action: 'Apply 3 filters: Market Cap 1T-5T, P/E Ratio 10-25, Dividend Yield > 2% dan Run Screen',
            expectedResult:
              'System returns only stocks where: 1T <= Market Cap <= 5T AND 10 <= P/E <= 25 AND Dividend > 2%',
            source: 'Module 5',
          },
        ],
        tags: ['result', 'accuracy', 'module5'],
      },
      {
        id: genId(),
        tcId: 'TC-012',
        suite: 'Module 5 - Screening Result',
        title: 'Verify stale data, delayed data and realtime badge handling when market feed changes',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User is viewing screening results dengan Free tier (delayed) atau Premium (realtime)',
        postcondition: 'Badge indicator (Realtime/Delayed) displays correctly, data updates sesuai subscription',
        steps: [
          {
            action: 'Premium user views result table - observe "Realtime" badge indicator',
            expectedResult: 'System displays "Realtime" badge, data updates within 1-5 second dari market feed',
            source: 'Module 5',
          },
        ],
        tags: ['result', 'data', 'badge', 'module5'],
      },
      {
        id: genId(),
        tcId: 'TC-013',
        suite: 'Module 6 - Save Preset',
        title: 'Verify Save, Rename, Delete and Load Preset persist across user sessions',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Persistence',
        precondition: 'User has configured screening filters dan ready to save as preset',
        postcondition: 'Preset disimpan, dapat di-load kapan saja, dan persist setelah logout/login',
        steps: [
          {
            action: 'Click "Save Preset" button dengan 3 filters configured, input name "My First Screen"',
            expectedResult: 'System saves preset, closes modal, preset muncul di "My Presets" list',
            source: 'Module 6',
          },
        ],
        tags: ['preset', 'save', 'persistence', 'module6'],
      },
      {
        id: genId(),
        tcId: 'TC-014',
        suite: 'Module 6 - Save Preset',
        title: 'Verify preset limitation and server-side validation for Free vs Premium users',
        priority: 'High',
        behavior: 'Negative',
        type: 'Permission · Validation',
        precondition: 'Free user dengan 1 preset saved, coba save preset ke-2; Premium user unlimited',
        postcondition: 'Free user blocked dengan upgrade prompt, Premium user dapat save unlimited presets',
        steps: [
          {
            action: 'Free user dengan 1 saved preset, configure new filter dan click "Save Preset"',
            expectedResult: 'System displays modal: "Maximum 1 preset reached. Upgrade to Premium" dengan upgrade CTA',
            source: 'Module 6',
          },
        ],
        tags: ['preset', 'limitation', 'gating', 'module6'],
      },
      {
        id: genId(),
        tcId: 'TC-015',
        suite: 'Module 7 - Period Selection',
        title:
          'Verify screening period selection updates calculation correctly without losing existing conditions',
        priority: 'Medium',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User has active filters dan select period dropdown visible',
        postcondition: 'Period changed, calculations update, existing filters preserved, results refresh',
        steps: [
          {
            action: 'User has 3 active filters dengan period "1 Year", click period dropdown dan select "6 Months"',
            expectedResult:
              'System updates period, recalculates metrics using 6-month data, filters tetap active',
            source: 'Module 7',
          },
        ],
        tags: ['period', 'calculation', 'module7'],
      },
      {
        id: genId(),
        tcId: 'TC-016',
        suite: 'Module 8 - Backtest',
        title: 'Verify Backtest initialization loads screening result into basket correctly',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'End-to-End (E2E)',
        precondition: 'User has screening results ready (10+ stocks) dan click "Backtest" button',
        postcondition: 'Backtest module opens, basket automatically populated dengan all screening results',
        steps: [
          {
            action: 'User on result page dengan 15 hasil screening, click "Backtest" button',
            expectedResult: 'System navigates ke Backtest page, basket displays 15 stocks pre-loaded, equal weight',
            source: 'Module 8',
          },
        ],
        tags: ['backtest', 'basket', 'module8'],
      },
      {
        id: genId(),
        tcId: 'TC-017',
        suite: 'Module 8 - Backtest',
        title:
          'Verify basket adjustment (add/remove/reset stock) behaves correctly according to user entitlement',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User dalam Backtest page, Premium unlimited, Free user max 5 stocks',
        postcondition: 'Basket adjusted sesuai user actions, weight recalculated, Free user blocked untuk add > 5',
        steps: [
          {
            action: 'Premium user dalam basket dengan 10 stocks, click "Add Stock" dan select 3 additional',
            expectedResult: 'System adds 3 stocks, basket total = 13, weights auto-rebalance ke equal weight',
            source: 'Module 8',
          },
        ],
        tags: ['backtest', 'basket', 'gating', 'module8'],
      },
      {
        id: genId(),
        tcId: 'TC-018',
        suite: 'Module 8 - Backtest',
        title: 'Verify strategy editor correctly reflects screening conditions and supports editing',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition: 'User dalam Backtest page setelah load dari Screener dengan conditions displayed',
        postcondition: 'Strategy conditions readable, user dapat edit parameter, changes reflected dalam calculation',
        steps: [
          {
            action: 'View "Strategy" section, observe displayed conditions dari Screener',
            expectedResult: 'System displays readonly summary dari screening conditions yang digunakan',
            source: 'Module 8',
          },
        ],
        tags: ['backtest', 'strategy', 'module8'],
      },
      {
        id: genId(),
        tcId: 'TC-019',
        suite: 'Module 8 - Backtest',
        title:
          'Verify Backtest calculation generates correct statistics, equity curve and transaction history',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Calculation',
        precondition:
          'User configured basket 5 stocks equal weight, selected period 1 Year, click "Run Backtest"',
        postcondition:
          'System generates equity curve chart, statistics (Return, Volatility, Sharpe Ratio) accurate',
        steps: [
          {
            action: 'User dengan equal-weight basket 5 stocks, select "1 Year" period, click "Run Backtest"',
            expectedResult:
              'System calculates backtest: equity curve chart displays, statistics shows Return %, Volatility %, Sharpe Ratio',
            source: 'Module 8',
          },
        ],
        tags: ['backtest', 'calculation', 'chart', 'module8'],
      },
      {
        id: genId(),
        tcId: 'TC-020',
        suite: 'Module 8 - Backtest',
        title:
          'Verify Backtest does not introduce look-ahead bias and historical calculation remains reproducible',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Logic/Flow',
        precondition:
          'User running backtest dengan historical period 1 Year, verify calculation integrity',
        postcondition:
          'Backtest results reproducible (same input = same output), no look-ahead bias dalam calculation',
        steps: [
          {
            action: 'Run Backtest twice dengan same basket/period/conditions, compare hasil',
            expectedResult:
              'System produces identical results antar runs, reproducible calculations tanpa randomness',
            source: 'Module 8',
          },
        ],
        tags: ['backtest', 'reproducibility', 'module8'],
      },
      {
        id: genId(),
        tcId: 'TC-021',
        suite: 'Module 9 - Export',
        title:
          'Verify Export CSV/Excel generates complete and accurate screening result for Premium users',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Export',
        precondition: 'Premium user viewing result table dengan 20+ hasil screening',
        postcondition:
          'CSV/Excel file generated dengan complete data: ticker, price, change%, volume, P/E, dividend, fundamental',
        steps: [
          {
            action: 'Premium user viewing result table 20 stocks, click "Export" button, select "CSV" format',
            expectedResult:
              'System generates CSV dengan columns: Ticker, Harga, Perubahan, Volume, P/E, Dividend - complete untuk 20 stocks',
            source: 'Module 9',
          },
        ],
        tags: ['export', 'csv', 'premium', 'module9'],
      },
      {
        id: genId(),
        tcId: 'TC-022',
        suite: 'Module 9 - Export',
        title: 'Verify Export restriction for Free users is enforced server-side with upgrade prompt',
        priority: 'High',
        behavior: 'Negative',
        type: 'Permission · Security',
        precondition: 'Free user viewing result table dengan export button visible',
        postcondition: 'Export button disabled atau shows upgrade prompt, server-side validation blocks export',
        steps: [
          {
            action: 'Free user viewing result table, click "Export" button',
            expectedResult:
              'System displays modal: "Export feature available untuk Premium users only. Upgrade now" dengan CTA',
            source: 'Module 9',
          },
        ],
        tags: ['export', 'restriction', 'gating', 'module9'],
      },
      {
        id: genId(),
        tcId: 'TC-023',
        suite: 'Module 10 - Subscription / Feature Gating',
        title:
          'Verify Free and Premium feature gating is consistently enforced across all restricted features',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Permission · Integration',
        precondition: 'Free dan Premium users accessing various features (Backtest, Export, Custom Preset)',
        postcondition:
          'All Premium features consistently blocked/enabled berdasarkan subscription, UI indicator jelas',
        steps: [
          {
            action:
              'Free user navigate Screener: observe Export button disabled, Backtest max 5, preset max 1',
            expectedResult:
              'System displays lock icons/disabled states, all Premium features consistently restricted',
            source: 'Module 10',
          },
        ],
        tags: ['gating', 'subscription', 'module10'],
      },
      {
        id: genId(),
        tcId: 'TC-024',
        suite: 'Module 10 - Subscription / Feature Gating',
        title: 'Verify realtime and delayed market data visibility follows subscription entitlement',
        priority: 'High',
        behavior: 'Positive',
        type: 'Permission · Data',
        precondition:
          'Free dan Premium users during market hours viewing real-time stock price data',
        postcondition:
          'Free user sees 15-min delayed data dengan badge, Premium user sees realtime data',
        steps: [
          {
            action: 'Free user during market hours (9:00-15:30 WIB): view stock price di result table',
            expectedResult:
              'System displays "Delayed (15 min)" badge, prices adalah 15 menit behind actual market',
            source: 'Module 10',
          },
        ],
        tags: ['data', 'subscription', 'module10'],
      },
      {
        id: genId(),
        tcId: 'TC-025',
        suite: 'Module 11 - Data Accuracy',
        title:
          'Verify price, change percentage, tick size and market data calculations match official market data',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Validation',
        precondition:
          'System displaying screening result durante market hours dengan official IDX market data',
        postcondition:
          'All displayed prices, changes, volumes match official IDX data ≥ 99.9% accuracy',
        steps: [
          {
            action:
              'Sample 10 random stocks dari result table, verify harga terakhir vs official IDX market feed',
            expectedResult:
              'All 10 stocks prices match IDX ±0.1%, tick size correct (Rp 1 untuk < 100, Rp 5 untuk 100-5000)',
            source: 'Module 11',
          },
        ],
        tags: ['accuracy', 'data', 'module11'],
      },
      {
        id: genId(),
        tcId: 'TC-026',
        suite: 'Module 11 - Data Accuracy',
        title:
          'Verify fundamental metrics and technical indicators are calculated consistently',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Functional · Calculation',
        precondition:
          'System calculating P/E ratio, dividend yield, RSI, MACD dari market data',
        postcondition:
          'All fundamental metrics dan technical indicators calculated consistent dengan industry standard',
        steps: [
          {
            action: 'Select stock BBCA, verify P/E Ratio: Market Cap / Net Income, dividend: Dividend / Price * 100',
            expectedResult:
              'P/E dan dividend yield match official broker data, consistent calculation across app',
            source: 'Module 11',
          },
        ],
        tags: ['accuracy', 'calculation', 'module11'],
      },
      {
        id: genId(),
        tcId: 'TC-027',
        suite: 'Module 12 - Error Handling',
        title:
          'Verify loading, empty result, API failure and system error states are handled gracefully',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'Error Handling · UX',
        precondition:
          'User perform various screener actions saat network issues atau server unavailable',
        postcondition:
          'Graceful error states displayed: loading spinner, empty state message, retry button, no crash',
        steps: [
          {
            action: 'User click "Run Screen" saat network disconnected',
            expectedResult:
              'System displays "Network error. Please check connection dan try again" dengan retry button',
            source: 'Module 12',
          },
        ],
        tags: ['error', 'handling', 'ux', 'module12'],
      },
      {
        id: genId(),
        tcId: 'TC-028',
        suite: 'Module 12 - Error Handling',
        title: 'Verify delayed fallback is used when realtime feed is unavailable',
        priority: 'High',
        behavior: 'Positive',
        type: 'Error Handling · Resilience',
        precondition: 'Premium user dengan realtime feed unavailable sementara',
        postcondition:
          'System gracefully fallback ke delayed feed (15 min), badge updates, data tetap available',
        steps: [
          {
            action: 'Premium user during market hours ketika realtime provider down, observe result table',
            expectedResult:
              'System displays "Delayed (15 min)" badge (fallback), data tetap populate dengan delayed prices',
            source: 'Module 12',
          },
        ],
        tags: ['error', 'fallback', 'resilience', 'module12'],
      },
      {
        id: genId(),
        tcId: 'TC-029',
        suite: 'Module 13 - Security & Permission',
        title: 'Verify unauthorized API access cannot bypass Premium restrictions',
        priority: 'Critical',
        behavior: 'Negative',
        type: 'Security · API',
        precondition: 'Free user coba manipulate API request untuk access Premium features',
        postcondition:
          'API request rejected, server validates subscription server-side, no data leaked, 403 Forbidden',
        steps: [
          {
            action: 'Free user modify browser localStorage untuk fake Premium status, call export API',
            expectedResult:
              'Server validates actual subscription token, rejects request: 403 Forbidden "Insufficient permissions"',
            source: 'Module 13',
          },
        ],
        tags: ['security', 'permission', 'api', 'module13'],
      },
      {
        id: genId(),
        tcId: 'TC-030',
        suite: 'Module 13 - Security & Permission',
        title: 'Verify server-side entitlement validation cannot be bypassed through API manipulation',
        priority: 'Critical',
        behavior: 'Negative',
        type: 'Security · Authorization',
        precondition:
          'Attacker coba bypass subscription checks through API parameter tampering',
        postcondition:
          'All API calls validate authorization server-side using valid JWT, no bypass possible',
        steps: [
          {
            action: 'Free user modify API request body: set "isPremium": true manually',
            expectedResult:
              'Server ignores client-side data, validates dari JWT/database subscription, request rejected',
            source: 'Module 13',
          },
        ],
        tags: ['security', 'authorization', 'module13'],
      },
      {
        id: genId(),
        tcId: 'TC-031',
        suite: 'Module 14 - Persistence',
        title:
          'Verify saved screener, preset and user preference persist after logout/login and restart',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Persistence',
        precondition:
          'User configure screener dengan filters, save preset, set preferences, logout',
        postcondition:
          'After login dan page reload, semua saved data tetap intact: preset list, filter history',
        steps: [
          {
            action:
              'User configure 5 filters, save preset "My Screen", set language Indonesian, theme Dark, logout',
            expectedResult: 'All data saved ke database successfully',
            source: 'Module 14',
          },
        ],
        tags: ['persistence', 'preference', 'module14'],
      },
      {
        id: genId(),
        tcId: 'TC-032',
        suite: 'Module 15 - Audit & Analytics',
        title:
          'Verify screening, backtest, save/load preset and export actions generate audit logs',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Logging',
        precondition: 'User perform various actions: run screen, save preset, backtest, export',
        postcondition:
          'System logs all actions ke audit log dengan timestamp, user_id, action_type, parameters',
        steps: [
          {
            action: 'User run screening, save preset, run backtest, export - observe backend logs',
            expectedResult:
              'Backend audit log recorded: user_id, action, timestamp, parameters logged correctly',
            source: 'Module 15',
          },
        ],
        tags: ['audit', 'logging', 'analytics', 'module15'],
      },
      {
        id: genId(),
        tcId: 'TC-033',
        suite: 'Module 16 - Localization',
        title:
          'Verify labels, disclaimer and application states are displayed correctly in English and Indonesian',
        priority: 'Medium',
        behavior: 'Positive',
        type: 'Localization · UX',
        precondition:
          'User set language English atau Indonesian via preference',
        postcondition:
          'All UI labels, buttons, messages, disclaimer displayed dalam selected language, no mixing',
        steps: [
          {
            action:
              'Set language ke English, navigate Screener dan verify semua labels dalam English',
            expectedResult:
              'All UI strings dalam English, correct terminology, professional translation',
            source: 'Module 16',
          },
        ],
        tags: ['localization', 'language', 'module16'],
      },
      {
        id: genId(),
        tcId: 'TC-034',
        suite: 'Module 17 - Disclaimer',
        title:
          'Verify market data disclaimer and non-advice disclaimer appear consistently across Screener and Backtest',
        priority: 'High',
        behavior: 'Positive',
        type: 'Compliance · UX',
        precondition:
          'User navigating Screener dan Backtest feature',
        postcondition:
          'Legal disclaimer consistently displayed: delayed data notice, non-advice disclaimer',
        steps: [
          {
            action: 'On Popular Screener page, scroll down untuk observe disclaimer footer',
            expectedResult:
              'System displays disclaimer: "Market data delayed untuk Free users", "Non-advice disclaimer"',
            source: 'Module 17',
          },
        ],
        tags: ['disclaimer', 'compliance', 'module17'],
      },
      {
        id: genId(),
        tcId: 'TC-035',
        suite: 'Module 18 - Performance',
        title:
          'Verify screening performance meets SLA under normal filter combinations and large universe',
        priority: 'High',
        behavior: 'Positive',
        type: 'Performance · Benchmark',
        precondition:
          'User run screening dengan 5 filters pada 900+ emiten universe',
        postcondition:
          'Screening completes within SLA: < 2 seconds untuk UI response',
        steps: [
          {
            action:
              'Run screening dengan 5 filters pada full universe 900+ stocks, measure time',
            expectedResult:
              'System responds within < 2 seconds, result table populated, no UI lag',
            source: 'Module 18',
          },
        ],
        tags: ['performance', 'sla', 'benchmark', 'module18'],
      },
      {
        id: genId(),
        tcId: 'TC-036',
        suite: 'Module 18 - Performance',
        title: 'Verify Backtest performance remains acceptable for maximum supported historical period',
        priority: 'Medium',
        behavior: 'Positive',
        type: 'Performance · Benchmark',
        precondition:
          'User run backtest dengan maximum period (e.g., 10 years), 10 stocks basket',
        postcondition:
          'Backtest calculation completes dengan acceptable time (< 10 seconds)',
        steps: [
          {
            action: 'Run backtest dengan basket 10 stocks, select "10 Years" period, measure time',
            expectedResult:
              'Backtest calculation completes within < 10 seconds, equity curve rendered',
            source: 'Module 18',
          },
        ],
        tags: ['performance', 'backtest', 'module18'],
      },
      {
        id: genId(),
        tcId: 'TC-037',
        suite: 'Module 19 - Recovery',
        title:
          'Verify user can recover and continue screening after temporary network interruption',
        priority: 'High',
        behavior: 'Positive',
        type: 'Resilience · Recovery',
        precondition:
          'User running screening saat tiba-tiba network connection putus',
        postcondition:
          'User dapat click "Retry" untuk reconnect dan resume screening',
        steps: [
          {
            action: 'User click "Run Screen", mid-process network disconnect, observe error message',
            expectedResult:
              'System displays: "Connection lost. Retry to continue" dengan Retry button',
            source: 'Module 19',
          },
        ],
        tags: ['recovery', 'resilience', 'module19'],
      },
      {
        id: genId(),
        tcId: 'TC-038',
        suite: 'Module 20 - Concurrency',
        title: 'Verify duplicate Run Screen and Backtest requests are prevented during concurrent actions',
        priority: 'High',
        behavior: 'Positive',
        type: 'Functional · Concurrency',
        precondition:
          'User rapidly click "Run Screen" button multiple times',
        postcondition:
          'Only single request submitted, subsequent clicks ignored/debounced',
        steps: [
          {
            action: 'User rapidly click "Run Screen" button 3x dalam 100ms window',
            expectedResult:
              'System processes hanya 1 request, button disabled saat loading',
            source: 'Module 20',
          },
        ],
        tags: ['concurrency', 'debounce', 'module20'],
      },
      {
        id: genId(),
        tcId: 'TC-039',
        suite: 'Module 21 - End-to-End Business Flow',
        title:
          'Verify complete Premium user journey from Screener → Save Preset → Backtest → Export → Reload',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'End-to-End (E2E)',
        precondition: 'Premium user starting from Screener page',
        postcondition:
          'Complete workflow successful: Screener configured, Preset saved, Backtest run, Results exported',
        steps: [
          {
            action: 'Configure 3 filters, click Run Screen',
            expectedResult: 'Results table displays 30+ matching stocks',
            source: 'Module 21',
          },
          {
            action: 'Click "Save Preset", input name, save successfully',
            expectedResult: 'Preset appears di My Presets list',
            source: 'Module 21',
          },
          {
            action: 'Click "Backtest" dari result page, run backtest',
            expectedResult:
              'Backtest calculates, displays equity curve + statistics',
            source: 'Module 21',
          },
          {
            action: 'Click "Export" button, select CSV format, download',
            expectedResult:
              'CSV file generated dengan complete data untuk 30+ stocks',
            source: 'Module 21',
          },
          {
            action: 'Navigate back, load preset dari My Presets',
            expectedResult:
              'All filters restored, results repopulate dengan same 30+ stocks',
            source: 'Module 21',
          },
        ],
        tags: ['e2e', 'workflow', 'premium', 'module21'],
      },
      {
        id: genId(),
        tcId: 'TC-040',
        suite: 'Module 21 - End-to-End Business Flow',
        title:
          'Verify complete Free user journey with proper feature restrictions, delayed data and upgrade prompts',
        priority: 'Critical',
        behavior: 'Positive',
        type: 'End-to-End (E2E)',
        precondition: 'Free user starting from Screener page',
        postcondition:
          'Free tier limitations properly enforced: delayed data, max 1 preset, max 5 backtest, export blocked',
        steps: [
          {
            action: 'Configure 2 filters, run screening, observe "Delayed (15 min)" badge',
            expectedResult:
              'Results display dengan 15-min delayed data, badge clearly shown',
            source: 'Module 21',
          },
          {
            action: 'Click "Save Preset", save first preset, try save second',
            expectedResult:
              'Second save blocked: "Maximum 1 preset untuk Free tier" dengan upgrade CTA',
            source: 'Module 21',
          },
          {
            action: 'Click "Backtest", basket shows 10 stocks, try add 5 lebih untuk total 15',
            expectedResult:
              'Adding blocked: "Maximum 5 stocks untuk Free tier" dengan upgrade CTA',
            source: 'Module 21',
          },
          {
            action: 'Click "Export" button',
            expectedResult:
              'Export disabled: "Export feature untuk Premium users only" dengan upgrade CTA',
            source: 'Module 21',
          },
          {
            action: 'Navigate back, load saved preset',
            expectedResult:
              'Preset load successfully (not blocked), filters restored normally',
            source: 'Module 21',
          },
        ],
        tags: ['e2e', 'workflow', 'free', 'gating', 'module21'],
      },
    ] as TestCase[]
  },
}
