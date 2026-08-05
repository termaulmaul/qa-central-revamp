/**
 * Test Catalog Formatter: Generates strict Markdown output for test scenarios
 * Output contains ONLY modules + coverage summary, nothing else
 */

export interface TestCaseFormatted {
  tcId: string
  title: string
  priority: string // P0: MUST TEST, P1: SHOULD TEST, P2: COULD TEST, P3: OPTIONAL
  priorityLabel?: string // Full label: "P0 MUST TEST · KRITIS" etc.
}

export interface ModuleBlock {
  moduleNumber: number
  capability: string
  testCases: TestCaseFormatted[]
}

export interface CoverageItem {
  capability: string
  testCount: number
  p0Count: number  // MUST TEST - KRITIS
  p1Count: number  // SHOULD TEST - PENTING
  p2Count: number  // COULD TEST - TAMBAHAN
  p3Count?: number // OPTIONAL
}

/**
 * Get full priority label based on priority code
 * Maps P0/P1/P2 to full descriptions with QA criteria
 */
function getPriorityLabel(priority: string): string {
  const priorityMap: Record<string, string> = {
    P0: 'P0 MUST TEST · KRITIS',
    P1: 'P1 SHOULD TEST · PENTING',
    P2: 'P2 COULD TEST · TAMBAHAN',
    P3: 'P3 OPTIONAL',
  }
  return priorityMap[priority] || priority
}

/**
 * Formats a list of modules into Markdown table format
 * Each module contains a table with TC Code, Test Case, Priority
 */
export function formatModules(modules: ModuleBlock[]): string {
  const lines: string[] = []

  for (const module of modules) {
    // Module header
    lines.push(`## Module ${module.moduleNumber} - ${module.capability}`)
    lines.push('')

    // Table header
    lines.push('| TC Code | Test Case | Priority |')
    lines.push('|---------|-----------|----------|')

    // Table rows
    for (const tc of module.testCases) {
      // Display priority with full label if available
      const priorityDisplay = tc.priorityLabel || getPriorityLabel(tc.priority)
      lines.push(`| ${tc.tcId} | ${tc.title} | ${priorityDisplay} |`)
    }

    // Blank line between modules (except after last module)
    if (module !== modules[modules.length - 1]) {
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Formats coverage summary into a Markdown table
 */
export function formatCoverageSummary(coverageItems: CoverageItem[]): string {
  const lines: string[] = []

  lines.push('## Coverage Summary')
  lines.push('')
  lines.push('| Business Capability | Test Count | P0 (MUST) | P1 (SHOULD) | P2 (COULD) |')
  lines.push('|-------------------|------------|-----------|-------------|-----------|')

  for (const item of coverageItems) {
    const p0 = item.p0Count > 0 ? item.p0Count : '-'
    const p1 = item.p1Count > 0 ? item.p1Count : '-'
    const p2 = item.p2Count > 0 ? item.p2Count : '-'

    lines.push(
      `| ${item.capability} | ${item.testCount} | ${p0} | ${p1} | ${p2} |`
    )
  }

  return lines.join('\n')
}

/**
 * Main formatter: Creates complete test catalogue output
 * Strict format: ONLY module sections and coverage summary
 */
export function formatTestCatalogue(
  modules: ModuleBlock[],
  coverageItems: CoverageItem[]
): string {
  const lines: string[] = []

  // Format modules
  const modulesMarkdown = formatModules(modules)
  lines.push(modulesMarkdown)

  // Blank line before coverage summary
  lines.push('')
  lines.push('')

  // Format coverage summary
  const coverageMarkdown = formatCoverageSummary(coverageItems)
  lines.push(coverageMarkdown)

  // Final newline
  lines.push('')

  return lines.join('\n')
}

/**
 * Validates output follows strict format rules
 */
export function validateCatalogueFormat(content: string): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check: Must start with "## Module"
  if (!content.trim().startsWith('## Module')) {
    issues.push('Output must start with "## Module", no text before first module')
  }

  // Check: Must not contain JSON/YAML/XML/HTML markers
  if (content.includes('{') || content.includes('[') || content.includes('<?xml')) {
    issues.push('Output must not contain JSON, YAML, or XML')
  }

  // Check: Must not contain code fences
  if (content.includes('```') || content.includes('~~~')) {
    issues.push('Output must not contain code fences')
  }

  // Check: Must contain only Markdown table structures
  const tableCount = (content.match(/\|.*\|/g) || []).length
  if (tableCount === 0) {
    issues.push('Output must contain Markdown tables')
  }

  // Check: Must end with Coverage Summary
  if (!content.includes('## Coverage Summary')) {
    issues.push('Output must end with Coverage Summary')
  }

  // Check: No output after Coverage Summary (allow trailing newlines)
  const lastCoveragePos = content.lastIndexOf('## Coverage Summary')
  const afterCoverage = content.substring(lastCoveragePos + 21).trim()
  
  // Extract the coverage summary table
  const coverageTableEnd = afterCoverage.search(/\n\n|$/i)
  if (coverageTableEnd !== -1) {
    const afterTable = afterCoverage.substring(coverageTableEnd).trim()
    if (afterTable.length > 0 && !afterTable.match(/^[\s|]*$/)) {
      issues.push('No text allowed after Coverage Summary')
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Sanitizes module capability name for display
 */
export function sanitizeCapabilityName(name: string): string {
  return name
    .trim()
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/^#+\s+/, '')
    .substring(0, 100) // Limit length
}

/**
 * Groups test cases by capability/module
 */
export function groupByCapability(
  testCases: Array<{
    title: string
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
    capability?: string
  }>,
  capabilityMap: Map<string, string> // Maps capability internal name to display name
): ModuleBlock[] {
  const groupedMap = new Map<string, TestCaseFormatted[]>()

  for (const tc of testCases) {
    const capability = tc.capability || 'Uncategorized'
    if (!groupedMap.has(capability)) {
      groupedMap.set(capability, [])
    }
    groupedMap.get(capability)!.push({
      tcId: '', // Will be filled by formatter
      title: tc.title,
      priority: tc.priority,
    })
  }

  // Convert to module blocks with numbering
  let moduleNumber = 1
  const modules: ModuleBlock[] = []

  for (const [capabilityKey, testCases] of groupedMap.entries()) {
    const displayName = capabilityMap.get(capabilityKey) || capabilityKey
    
    // Renumber test cases
    const numberedTcs = testCases.map((tc, index) => ({
      ...tc,
      tcId: `TC-${String(moduleNumber * 1000 + index + 1).padStart(3, '0')}`,
    }))

    modules.push({
      moduleNumber,
      capability: displayName,
      testCases: numberedTcs,
    })

    moduleNumber++
  }

  return modules
}

/**
 * Generates coverage statistics from modules
 */
export function generateCoverageStats(modules: ModuleBlock[]): CoverageItem[] {
  const stats: CoverageItem[] = []

  for (const module of modules) {
    const p0Count = module.testCases.filter(tc => tc.priority === 'P0').length
    const p1Count = module.testCases.filter(tc => tc.priority === 'P1').length
    const p2Count = module.testCases.filter(tc => tc.priority === 'P2').length

    stats.push({
      capability: module.capability,
      testCount: module.testCases.length,
      p0Count,
      p1Count,
      p2Count,
    })
  }

  return stats
}
