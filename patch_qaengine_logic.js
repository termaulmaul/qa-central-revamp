const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/lib/qa-engine/qa-engine.ts';
let content = fs.readFileSync(file, 'utf8');

const imports = `import { requirementExtractor } from '../requirements/extractor';
import { testCaseGenerator, strategySelector, type GenerationContext } from '../tc-gen';
import { type ParsedRequirement } from '../requirements/types';\n`;
if (!content.includes('requirementExtractor')) {
    content = imports + content;
}

const analyzePRDRegex = /analyzePRD: async \(text: string\) => \{([\s\S]*?)generateTests: async \(prdText: string, prdContent\?: PRDContent\): Promise<TestCase\[\]> => \{([\s\S]*?)    return generatedTests\n  \},/m;

const match = analyzePRDRegex.exec(content);
if (match) {
    const replacement = `analyzePRD: async (text: string) => {
    // Cache for later use
    const prdContent = analyzePRDStructure(text);
    cachedPRDContent = prdContent;
    
    console.log('[QAEngine] Using requirementExtractor to extract capabilities...');
    const extracted = await requirementExtractor.extract(text, {
      platform: 'Web',
      projectContext: 'Revamp Project'
    });
    
    // Create coverage items from extracted requirements
    const coverage: CoverageItem[] = extracted.requirements.map((req, idx) => ({
      area: \`Module \${idx + 1} - \${req.module || req.title}\`,
      progress: req.id,
    }));
    
    return {
      coverage,
      prdContent,
      extracted, // Pass down to avoid re-parsing
    };
  },

  generateTests: async (prdText: string, prdContent?: PRDContent): Promise<TestCase[]> => {
    console.log('[QAEngine] Using testCaseGenerator logic...');
    try {
      const extracted = await requirementExtractor.extract(prdText, {
        platform: 'Web',
        projectContext: 'Revamp Project'
      });
      
      const generatedTests: TestCase[] = [];
      let totalCount = 1;
      
      for (const req of extracted.requirements) {
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
        
        for (const tc of result.testCases) {
          const formattedTc: TestCase = {
            id: tc.id,
            tcId: \`TC-\${req.id.replace('REQ-', '')}-\${(totalCount++).toString().padStart(3, '0')}\`,
            title: normalizeTestCaseTitle(tc.title),
            priority: tc.priority === 'P0' || tc.priority === 'P1' ? 'High' : 'Medium',
            behavior: tc.type === 'negative' || tc.type === 'security' || tc.type === 'edge_case' ? 'Negative' : 'Positive',
            suite: sanitizeCapabilityName(req.module || 'General'),
            type: tc.type,
            precondition: tc.preconditions?.join('\\n') || '',
            postcondition: tc.postconditions?.join('\\n') || '',
            steps: tc.steps.map(s => ({
              action: s.action,
              expectedResult: s.expected_result,
              source: 'AI Generated',
              data: s.test_data ? JSON.stringify(s.test_data) : ''
            })),
            qualityScore: 100,
            requirementId: req.id,
            tags: tc.tags || [],
          };
          generatedTests.push(formattedTc);
        }
      }
      
      console.log(\`[QAEngine] Generated \${generatedTests.length} test cases\`);
      return generatedTests;
    } catch (e) {
      console.error('[QAEngine] Error in enhanced generator', e);
      return [];
    }
  },`;

    content = content.replace(match[0], replacement);
    fs.writeFileSync(file, content);
    console.log("Replaced QAEngine backend logic!");
} else {
    console.log("Regex not matched!");
}
