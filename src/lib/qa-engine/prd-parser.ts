/**
 * Advanced PRD Parser
 * Extracts features and modules with sophisticated parsing mechanics
 * Adapted from bahan-page-qaautomation patterns
 */

export interface Feature {
  id: string
  name: string
  description: string
  section?: string
  characteristics?: string[]
}

export interface Module {
  id: string
  number: number
  name: string
  description: string
  relatedFeatures: string[]
  estimatedTestCases: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
}

export interface ModuleGroup {
  groupName: string
  description: string
  modules: Module[]
  totalTestCases: number
}

/**
 * Extract features from PRD text using multiple strategies
 * Pattern: "F1 — Feature Name: description"
 */
export function extractFeatures(text: string): Feature[] {
  const features: Feature[] = []

  // Strategy 1: Multiline regex pattern (primary)
  const featurePattern = /^F(\d+)\s*[—–-]\s*([^:]+):\s*([\s\S]+?)(?=^F\d+|$)/gm
  let match

  while ((match = featurePattern.exec(text)) !== null) {
    const featureId = `F${match[1]}`
    const name = match[2].trim()
    const description = match[3].trim()

    features.push({
      id: featureId,
      name,
      description,
    })
  }

  // Strategy 2: Line-by-line fallback if no features found
  if (features.length === 0) {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    let currentFeature: Partial<Feature> | null = null

    for (const line of lines) {
      const featureMatch = line.match(/^F(\d+)\s*[—–-]\s*([^:]+):\s*(.*)/)

      if (featureMatch) {
        // Save previous feature
        if (currentFeature?.name) {
          features.push({
            id: currentFeature.id || `F${features.length + 1}`,
            name: currentFeature.name,
            description: currentFeature.description || '',
          })
        }

        // Start new feature
        currentFeature = {
          id: `F${match![1]}`,
          name: featureMatch[2].trim(),
          description: featureMatch[3].trim(),
        }
      } else if (currentFeature?.name && line.trim().length > 0) {
        // Append to current feature description
        currentFeature.description = (currentFeature.description || '') + ' ' + line.trim()
      }
    }

    // Save last feature
    if (currentFeature?.name) {
      features.push({
        id: currentFeature.id || `F${features.length + 1}`,
        name: currentFeature.name,
        description: currentFeature.description || '',
      })
    }
  }

  // Strategy 3: Generic fallback for unstructured PRD
  if (features.length === 0 && text.length > 50) {
    const lines = text.split('\n').filter((l) => l.trim().length > 10)
    const processedFeatures = new Set<string>()

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i]
      // Skip headers and timestamps
      if (/^(#|==|--|[0-9]{4}-[0-9]{2})/.test(line)) continue

      const cleanedLine = line.replace(/^[-•*]\s*/, '').trim()
      if (processedFeatures.has(cleanedLine)) continue

      features.push({
        id: `F${features.length + 1}`,
        name: cleanedLine.slice(0, 80),
        description: cleanedLine,
      })

      processedFeatures.add(cleanedLine)
    }
  }

  return features
}

/**
 * Detect module groups from feature set
 * Uses feature names and descriptions to infer module grouping
 */
export function detectModules(features: Feature[]): Module[] {
  const modules: Module[] = []

  // Map features to modules using keyword detection
  const featureToModuleMap: Record<string, Module> = {}

  for (const feature of features) {
    const text = `${feature.name} ${feature.description}`.toLowerCase()

    // Module detection patterns
    let moduleId: string
    let moduleName: string
    let priority: 'Critical' | 'High' | 'Medium' | 'Low'

    if (
      text.includes('navigation') ||
      text.includes('entry') ||
      text.includes('page') ||
      text.includes('screen')
    ) {
      moduleId = 'M1'
      moduleName = 'Navigation and Entry Points'
      priority = 'Critical'
    } else if (
      text.includes('filter') ||
      text.includes('search') ||
      text.includes('criteria')
    ) {
      moduleId = 'M2'
      moduleName = 'Filtering and Search'
      priority = 'Critical'
    } else if (
      text.includes('display') ||
      text.includes('show') ||
      text.includes('data') ||
      text.includes('table')
    ) {
      moduleId = 'M3'
      moduleName = 'Data Display and Presentation'
      priority = 'High'
    } else if (
      text.includes('preset') ||
      text.includes('template') ||
      text.includes('configuration')
    ) {
      moduleId = 'M4'
      moduleName = 'Preset and Template Management'
      priority = 'High'
    } else if (
      text.includes('builder') ||
      text.includes('condition') ||
      text.includes('rule')
    ) {
      moduleId = 'M5'
      moduleName = 'Advanced Builder'
      priority = 'High'
    } else if (
      text.includes('export') ||
      text.includes('download') ||
      text.includes('save')
    ) {
      moduleId = 'M6'
      moduleName = 'Export and Data Management'
      priority = 'Medium'
    } else if (
      text.includes('error') ||
      text.includes('validation') ||
      text.includes('alert')
    ) {
      moduleId = 'M7'
      moduleName = 'Error Handling and Alerts'
      priority = 'High'
    } else if (
      text.includes('performance') ||
      text.includes('speed') ||
      text.includes('cache')
    ) {
      moduleId = 'M8'
      moduleName = 'Performance and Optimization'
      priority = 'Medium'
    } else {
      moduleId = `M${modules.length + 1}`
      moduleName = feature.name
      priority = 'Medium'
    }

    // Create or update module
    if (!featureToModuleMap[moduleId]) {
      featureToModuleMap[moduleId] = {
        id: moduleId,
        number: parseInt(moduleId.slice(1)),
        name: moduleName,
        description: `Module covering ${moduleName.toLowerCase()}`,
        relatedFeatures: [],
        estimatedTestCases: 0,
        priority,
      }
      modules.push(featureToModuleMap[moduleId])
    }

    // Add feature to module
    if (!featureToModuleMap[moduleId].relatedFeatures.includes(feature.id)) {
      featureToModuleMap[moduleId].relatedFeatures.push(feature.id)
    }
  }

  // Calculate estimated test cases per module (using bahan pattern: 5-22 cases per module)
  for (const module of modules) {
    const featureCount = module.relatedFeatures.length
    const baseCount = 7 // Average per module

    if (module.priority === 'Critical') {
      module.estimatedTestCases = baseCount + featureCount * 2
    } else if (module.priority === 'High') {
      module.estimatedTestCases = baseCount + featureCount
    } else {
      module.estimatedTestCases = Math.max(5, baseCount - 2 + featureCount)
    }
  }

  return modules.sort((a, b) => a.number - b.number)
}

/**
 * Group modules into logical sections
 */
export function groupModules(modules: Module[]): ModuleGroup[] {
  const groups: ModuleGroup[] = []

  // Group by priority and category
  const criticalModules = modules.filter((m) => m.priority === 'Critical')
  const highModules = modules.filter((m) => m.priority === 'High')
  const mediumModules = modules.filter((m) => m.priority === 'Medium')
  const lowModules = modules.filter((m) => m.priority === 'Low')

  if (criticalModules.length > 0) {
    groups.push({
      groupName: 'Core Functionality',
      description: 'Critical modules essential for primary user workflows',
      modules: criticalModules,
      totalTestCases: criticalModules.reduce((sum, m) => sum + m.estimatedTestCases, 0),
    })
  }

  if (highModules.length > 0) {
    groups.push({
      groupName: 'Feature Completeness',
      description: 'High-priority modules for feature parity',
      modules: highModules,
      totalTestCases: highModules.reduce((sum, m) => sum + m.estimatedTestCases, 0),
    })
  }

  if (mediumModules.length > 0) {
    groups.push({
      groupName: 'Enhancement and Quality',
      description: 'Medium-priority modules for quality and performance',
      modules: mediumModules,
      totalTestCases: mediumModules.reduce((sum, m) => sum + m.estimatedTestCases, 0),
    })
  }

  if (lowModules.length > 0) {
    groups.push({
      groupName: 'Polish and Edge Cases',
      description: 'Low-priority modules for edge cases and refinement',
      modules: lowModules,
      totalTestCases: lowModules.reduce((sum, m) => sum + m.estimatedTestCases, 0),
    })
  }

  return groups
}

/**
 * Full parsing pipeline
 */
export function parsePRD(text: string): {
  features: Feature[]
  modules: Module[]
  groups: ModuleGroup[]
  totalTestCases: number
} {
  const features = extractFeatures(text)
  const modules = detectModules(features)
  const groups = groupModules(modules)
  const totalTestCases = modules.reduce((sum, m) => sum + m.estimatedTestCases, 0)

  return {
    features,
    modules,
    groups,
    totalTestCases,
  }
}
