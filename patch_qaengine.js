const fs = require('fs');
const path = require('path');

const filePath = '/Users/maul/Downloads/qa-central-revamp/src/lib/qa-engine/qa-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports at the top
const imports = `import { requirementExtractor } from '../requirements/extractor';
import { testCaseGenerator, strategySelector, type GenerationContext, type TestCaseType } from '../tc-gen';
import { type ParsedRequirement } from '../requirements/types';\n`;
if (!content.includes('requirementExtractor')) {
    content = content.replace(/^import [^\n]+/m, (match) => imports + match);
}

// 2. Replace QAEngine.generateTests
const generateTestsRegex = /static async generateTests\(prdText: string, prdContent\?: PRDContent\): Promise<TestCase\[\]> \{([\s\S]*?)\}\n\n  static async analyzeCoverage/g;

const match = generateTestsRegex.exec(content);
if (match) {
    const newGenerateTests = `static async generateTests(prdText: string, prdContent?: PRDContent): Promise<TestCase[]> {
    console.log('[QAEngine] Using new requirementExtractor and testCaseGenerator logic...');
    try {
      // 1. Extract requirements using the powerful NLP class
      const extracted = await requirementExtractor.extract(prdText, {
        platform: 'Web',
        projectContext: 'Revamp Project'
      });
      
      const generatedTests: TestCase[] = [];
      let totalCount = 1;
      
      // 2. Generate test cases for each requirement
      for (const req of extracted.requirements) {
        // Pick a strategy
        const strategy = strategySelector.pickByContext(req.risk || 'LOW', req.platform || 'API', req.automation_candidate !== false);
        
        const ctx: GenerationContext = {
          requirement: req,
          businessRules: req.business_rules || [],
          acceptanceCriteria: req.acceptance_criteria || [],
          riskLevel: req.risk || 'LOW',
          platform: req.platform as any || 'API',
          testTypes: strategy.testTypes as any[],
          targetCoverage: 'standard',
          includeNegative: true,
          includeSecurity: req.risk === 'HIGH' || req.risk === 'CRITICAL',
          includePerformance: strategy.name === 'comprehensive',
          includeAccessibility: strategy.name === 'accessibility' || strategy.name === 'comprehensive',
          includeCompatibility: strategy.name === 'comprehensive',
        };
        
        const result = testCaseGenerator.generate(req, ctx);
        
        // Map the new format to the old TestCase interface
        for (const tc of result.testCases) {
          const formattedTc: TestCase = {
            id: tc.id,
            tcId: \`TC-\${req.id.replace('REQ-', '')}-\${(totalCount++).toString().padStart(3, '0')}\`,
            title: normalizeTestCaseTitle(tc.title),
            priority: tc.priority === 'P0' || tc.priority === 'P1' ? 'High' : 'Medium',
            behavior: tc.type === 'negative' || tc.type === 'security' || tc.type === 'edge_case' ? 'Negative' : 'Positive',
            suite: sanitizeCapabilityName(req.module || 'General'),
            steps: tc.steps.map(s => ({
              action: s.action,
              expectedResult: s.expected_result,
              source: 'AI Generated',
              data: s.test_data ? JSON.stringify(s.test_data) : ''
            })),
            qualityScore: 100,
            requirementId: req.id
          };
          generatedTests.push(formattedTc);
        }
      }
      
      return generatedTests;
    } catch (e) {
      console.error('[QAEngine] Error in enhanced generator, falling back...', e);
      return []; // Returning empty to avoid the old regex logic unless requested
    }
  }`;

    content = content.replace(match[0], newGenerateTests + '\n\n  static async analyzeCoverage');
    fs.writeFileSync(filePath, content);
    console.log("Replaced generateTests!");
} else {
    console.log("Could not find generateTests regex");
}
