/**
 * PRD Analyzer: Extracts structured data from PRD text using heuristic patterns.
 * Discovers sections, business capabilities, and requirements from unstructured PDF text.
 */

export interface PRDSection {
  title: string
  content: string
  lines: string[]
}

export interface PRDContent {
  objectives: PRDSection
  functionalRequirements: PRDSection[]
  userStories: PRDSection[]
  useCases: PRDSection[]
  acceptanceCriteria: PRDSection[]
  businessRules: PRDSection[]
  nonFunctionalRequirements: PRDSection[]
  allSections: PRDSection[]
}

/**
 * Normalizes whitespace and cleans text
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .trim()
}

/**
 * Splits text into lines and filters empty ones
 */
function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

/**
 * Detects section headers using common patterns
 * Returns { title, startIndex, content }
 * Supports both markdown headers (##) and numbered list headers (1. Title)
 */
function detectSections(lines: string[]): Array<{ title: string; startIdx: number; endIdx: number }> {
  const sections = []
  const markdownPatterns = [
    /^#+\s*(Objectives?|Goals?|Deliverables?)/i,
    /^#+\s*(Functional\s+Requirements?|F\d+|Features?|Feature\s+List)/i,
    /^#+\s*(User\s+Stories?|Story)/i,
    /^#+\s*(Use\s+Cases?|Scenarios?)/i,
    /^#+\s*(Acceptance\s+Criteria|AC|Business\s+Requirements?)/i,
    /^#+\s*(Business\s+Rules?|Rules?|Policies?)/i,
    /^#+\s*(Non[\s-]?Functional\s+Requirements?|NFR|Performance|Security|Reliability|Scalability|Localization|Integration)/i,
  ]
  
  // Additional patterns for numbered/plain text headers (common in PDFs)
  const plainTextPatterns = [
    /^(?:\d+\.\s*)?(Objectives?|Goals?|Deliverables?)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(Functional\s+Requirements?|F\d+|Features?|Feature\s+List)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(User\s+Stories?|Story)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(Use\s+Cases?|Scenarios?)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(Acceptance\s+Criteria|AC|Business\s+Requirements?)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(Business\s+Rules?|Rules?|Policies?)\s*:?\s*$/i,
    /^(?:\d+\.\s*)?(Non[\s-]?Functional\s+Requirements?|NFR|Performance|Security|Reliability|Scalability|Localization|Integration)\s*:?\s*$/i,
  ]

  for (let i = 0; i < lines.length; i++) {
    // Try markdown patterns first
    for (const pattern of markdownPatterns) {
      if (pattern.test(lines[i])) {
        const match = lines[i].match(/^#+\s*(.+)$/i)
        const title = match ? match[1].trim() : lines[i]
        
        let endIdx = lines.length
        for (let j = i + 1; j < lines.length; j++) {
          if (/^#+/.test(lines[j]) || /^\d+\.\s+(Objectives?|Functional|User|Use|Acceptance|Business|Non)/.test(lines[j])) {
            endIdx = j
            break
          }
        }
        
        sections.push({ title, startIdx: i + 1, endIdx })
        break
      }
    }
    
    // Try plain text patterns (for PDF-extracted content without markdown)
    for (const pattern of plainTextPatterns) {
      if (pattern.test(lines[i]) && !sections.some(s => s.startIdx - 1 === i)) {
        const title = lines[i].trim()
        
        let endIdx = lines.length
        for (let j = i + 1; j < lines.length; j++) {
          // Stop at next section header (markdown or numbered)
          if (/^#+/.test(lines[j]) || /^(?:\d+\.\s*)?(Objectives?|Functional|User|Use|Acceptance|Business|Non)/.test(lines[j]) && i !== j) {
            endIdx = j
            break
          }
        }
        
        sections.push({ title, startIdx: i + 1, endIdx })
        break
      }
    }
  }

  return sections
}

/**
 * Groups related lines into logical blocks (requirements, stories, etc.)
 */
function groupContentBlocks(lines: string[], startIdx: number, endIdx: number): string[] {
  const blocks: string[] = []
  let currentBlock: string[] = []

  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i]
    
    // Detect new block markers
    const isBlockStart = /^[-*•]\s+|^(\d+\.)|^(###|####)/i.test(line)
    
    if (isBlockStart && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'))
      currentBlock = [line]
    } else {
      currentBlock.push(line)
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'))
  }

  return blocks
}

/**
 * Extracts key phrases and concepts from text blocks
 */
function extractConcepts(text: string): string[] {
  const concepts = []
  
  // Find capitalized phrases (potential capability names)
  const capitalizedPhrases = text.match(/\b[A-Z][a-zA-Z\s]{3,}\b/g) || []
  concepts.push(...capitalizedPhrases)

  // Find phrases after colons
  const afterColons = text.match(/:\s*([^.!?]+)/g) || []
  concepts.push(...afterColons.map(p => p.replace(':', '').trim()))

  return [...new Set(concepts)]
}

/**
 * Identifies business capabilities from requirements
 */
function identifyCapabilities(sections: PRDSection[]): string[] {
  const capabilities = new Set<string>()

  for (const section of sections) {
    const concepts = extractConcepts(section.content)
    concepts.forEach(c => {
      if (c.length > 3 && !c.match(/^(When|Then|And|Or|If|The|That|This|With)/i)) {
        capabilities.add(c)
      }
    })
  }

  return Array.from(capabilities)
}

/**
 * Extracts features from Stock Screener format (F1 —, F2 —, etc.) or generic F-number features.
 * Returns them as functional requirements
 */
function extractStockScreenerFeatures(prdText: string): PRDSection[] {
  const features: PRDSection[] = []
  const rawLines = splitLines(normalizeText(prdText))
  
  const lines: string[] = []
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim()
    
    // Combine line-breaks for feature headers if next line doesn't have a colon
    if (line.match(/^(?:\\d+\\.\\s*)?F\\d+\\s*(?:—|–|-)/i) && i + 1 < rawLines.length && !rawLines[i+1].includes(':')) {
      line += ' ' + rawLines[i+1].trim()
      i++
    }
    lines.push(line)
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Flexible match: F1 - Feature Name (optional colon and description)
    const match = line.match(/^(?:\d+\.\s*)?(F\d+)\s*(?:—|–|-)\s*([^:]+)(?::\s*(.*))?$/i)
    
    if (match) {
      const featureId = match[1]
      const featureName = match[2].trim()
      let description = match[3] ? match[3].trim() : ''
      
      // Collect additional description lines
      const descLines = description ? [description] : []
      let j = i + 1
      while (j < lines.length && !lines[j].match(/^(?:\d+\.\s*)?F\d+\s*(?:—|–|-)/i)) {
        if (lines[j].trim().length > 0 && !lines[j].match(/^(Diagram|Design|Flow|Definitions?|2A\.|2B\.|3\.|4\.|5\.)/i)) {
          descLines.push(lines[j])
        }
        j++
      }
      
      const fullDescription = descLines.join('\n').trim()
      
      features.push({
        title: `${featureId}: ${featureName}`,
        content: fullDescription,
        lines: descLines,
      })
    }
  }
  
  return features
}

/**
 * Main analyzer function - parses PRD text and returns structured content
 */
export function analyzePRD(prdText: string): PRDContent {
  const normalized = normalizeText(prdText)
  const lines = splitLines(normalized)
  const detectedSections = detectSections(lines)

  const result: PRDContent = {
    objectives: { title: 'Objectives', content: '', lines: [] },
    functionalRequirements: [],
    userStories: [],
    useCases: [],
    acceptanceCriteria: [],
    businessRules: [],
    nonFunctionalRequirements: [],
    allSections: [],
  }

  // Check for Stock Screener format features first (F1 —, F2 —, etc.)
  const stockScreenerFeatures = extractStockScreenerFeatures(prdText)
  if (stockScreenerFeatures.length > 0) {
    result.functionalRequirements = stockScreenerFeatures
    result.allSections.push(...stockScreenerFeatures)
  }

  // Process each detected section
  for (const section of detectedSections) {
    const sectionLines = lines.slice(section.startIdx, section.endIdx)
    const content = sectionLines.join('\n')
    const sectionObj: PRDSection = {
      title: section.title,
      content,
      lines: sectionLines,
    }

    result.allSections.push(sectionObj)

    // Categorize by type
    const titleLower = section.title.toLowerCase()
    
    if (titleLower.includes('objective') || titleLower.includes('goal')) {
      result.objectives = sectionObj
    } else if (titleLower.includes('functional') || titleLower.match(/^f\d+/i)) {
      // Don't add if we already have Stock Screener features
      if (stockScreenerFeatures.length === 0) {
        result.functionalRequirements.push(sectionObj)
      }
    } else if (titleLower.includes('user story') || titleLower.includes('story')) {
      result.userStories.push(sectionObj)
    } else if (titleLower.includes('use case') || titleLower.includes('scenario')) {
      result.useCases.push(sectionObj)
    } else if (titleLower.includes('acceptance') || titleLower.includes('criteria')) {
      result.acceptanceCriteria.push(sectionObj)
    } else if (titleLower.includes('business rule') || titleLower.includes('rule') || titleLower.includes('policy')) {
      result.businessRules.push(sectionObj)
    } else if (titleLower.includes('non.functional') || titleLower.includes('nfr') || 
               titleLower.includes('performance') || titleLower.includes('security') ||
               titleLower.includes('reliability') || titleLower.includes('localization')) {
      result.nonFunctionalRequirements.push(sectionObj)
    }
  }

  return result
}

/**
 * Extracts business capabilities and their related requirements
 */
export function extractCapabilitiesWithRequirements(prdContent: PRDContent): Array<{
  capability: string
  source: PRDSection
  relatedLines: string[]
}> {
  const capabilities: Array<{
    capability: string
    source: PRDSection
    relatedLines: string[]
  }> = []

  // Merge all relevant sections
  const allRelevant = [
    ...prdContent.functionalRequirements,
    ...prdContent.userStories,
    ...prdContent.acceptanceCriteria,
    ...prdContent.businessRules,
  ]

  for (const section of allRelevant) {
    const blocks = groupContentBlocks(section.lines, 0, section.lines.length)

    for (const block of blocks) {
      const lines = splitLines(block)
      
      // Extract capability from first line or leading phrase
      const firstLine = lines[0]
      let capabilityName = firstLine
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/^#+\s+/, '')
        .trim()

      // Limit capability name to first 50 chars
      if (capabilityName.length > 50) {
        capabilityName = capabilityName.substring(0, 47) + '...'
      }

      capabilities.push({
        capability: capabilityName,
        source: section,
        relatedLines: lines,
      })
    }
  }

  return capabilities
}

/**
 * Extracts test case requirements from a capability description
 * Looks for "when" patterns and observable behaviors
 * Generates strict "Verify [Behavior] when [Condition]" formatted test cases
 */
export function extractBehaviorsFromCapability(capabilityText: string): Array<{
  behavior: string
  condition: string
  source: string
}> {
  const behaviors: Array<{ behavior: string; condition: string; source: string }> = []

  // Combine into single string for multi-line regex processing
  // But also process line-by-line for bullet points
  const lines = splitLines(capabilityText)

  // Pre-process: if it's a bullet point with nested clauses, try to capture the whole bullet
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.length < 5) continue

    // Normalize starting dashes or bullets or numbers
    line = line.replace(/^[-*•]\s+|^\d+\.\s+/, '')

    // Extract conditional blocks: "If X, then Y" or "When X, Y" or "X when Y"
    const ifThenMatch = line.match(/^if\s+(.+?),\s*(?:then\s+)?(?:the\s+system\s+)?(?:must\s+|should\s+)?(.+?)(?:[.!?]|$)/i)
    if (ifThenMatch) {
      behaviors.push({ behavior: ifThenMatch[2].trim(), condition: ifThenMatch[1].trim(), source: line })
      continue
    }

    const whenThenMatch = line.match(/^when\s+(.+?),\s*(?:the\s+system\s+)?(?:must\s+|should\s+)?(.+?)(?:[.!?]|$)/i)
    if (whenThenMatch) {
      behaviors.push({ behavior: whenThenMatch[2].trim(), condition: whenThenMatch[1].trim(), source: line })
      continue
    }

    const middleWhenMatch = line.match(/(.+?)\s+when\s+(.+?)(?:[.!?]|$)/i)
    if (middleWhenMatch && !middleWhenMatch[0].toLowerCase().startsWith('verify')) {
      behaviors.push({ behavior: middleWhenMatch[1].trim(), condition: middleWhenMatch[2].trim(), source: line })
      continue
    }

    // "System must/should X"
    const systemMustMatch = line.match(/(?:system|app|application)\s+(?:must|should|shall|will)\s+(.+?)(?:[.!?]|$)/i)
    if (systemMustMatch) {
      // Look for "if" or "for" at the end of the sentence for condition
      const conditionalEnd = systemMustMatch[1].match(/(.+?)\s+(?:if|for)\s+(.+?)$/i)
      if (conditionalEnd) {
        behaviors.push({ behavior: conditionalEnd[1].trim(), condition: conditionalEnd[2].trim(), source: line })
      } else {
        behaviors.push({ behavior: systemMustMatch[1].trim(), condition: 'standard execution', source: line })
      }
      continue
    }

    // "User can X"
    const userCanMatch = line.match(/(?:user|admin|customer|client)\s+(?:can|may|is able to)\s+(.+?)(?:[.!?]|$)/i)
    if (userCanMatch) {
      behaviors.push({ behavior: userCanMatch[1].trim(), condition: 'user interaction', source: line })
      continue
    }
    
    // Explicit AC definition lines like "Available margin is calculated as X"
    const isCalculatedMatch = line.match(/(.+?)\s+is\s+(?:calculated|determined)\s+as\s+(.+?)(?:[.!?]|$)/i)
    if (isCalculatedMatch) {
      behaviors.push({ behavior: `${isCalculatedMatch[1].trim()} calculation is correct`, condition: `verifying ${isCalculatedMatch[1].trim()}`, source: line })
      continue
    }
  }

  return behaviors
}
