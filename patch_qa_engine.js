const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/lib/qa-engine/qa-engine.ts';
let code = fs.readFileSync(file, 'utf8');

// Find index of generateTests
const generateTestsIndex = code.indexOf('generateTests: async (prdText: string');
if (generateTestsIndex === -1) {
  console.log("Could not find generateTests");
  process.exit(1);
}

const beforeGenerateTests = code.substring(0, generateTestsIndex);
const afterGenerateTests = code.substring(generateTestsIndex);

const newAfter = afterGenerateTests.replace(
  /\/\/ 1\. Try V2 Generic Pipeline First[\s\S]*?\/\/ 2\. Fallback to Legacy Curated Logic/,
  `// 1. Try V2 Generic Pipeline First (ONLY IF NOT STOCK SCREENER)
    const isStockScreener = prdText.includes('Stock Screener') || prdText.includes('Saham');
    
    if (!isStockScreener) {
      try {
        const { QAEngineV2 } = require('./qa-engine-v2');
        const v2Result = await QAEngineV2.fullPipeline(prdText);
        if (v2Result.legacyCases && v2Result.legacyCases.length > 0) {
          console.log(\`[QAEngineV2] Successfully generated \${v2Result.legacyCases.length} test cases using generic pipeline\`);
          
          // Ensure authentication steps are prepended for backwards compatibility with tests
          const { buildScopeAuthSteps } = require('./auth-steps');
          const { t } = require('./locales');
          v2Result.legacyCases.forEach((tc: TestCase) => {
            const isGuest = tc.title.toLowerCase().includes('without login') || tc.title.toLowerCase().includes('unauthenticated') || tc.suite.toLowerCase().includes('without login') || tc.suite.toLowerCase().includes('unauthenticated');
            
            if (isGuest) {
              tc.steps = [{
                action: t('guestAccess'),
                expectedResult: t('guestAccessExpected'),
                source: tc.suite
              }, ...tc.steps];
            } else {
              const authSteps = buildScopeAuthSteps(prdText, tc.title);
              const formattedAuthSteps = authSteps.map((s: any) => ({
                action: s.action,
                expectedResult: s.expectedResult,
                source: s.source,
              }));
              tc.steps = [...formattedAuthSteps, ...tc.steps];
            }
          });
          
          return v2Result.legacyCases;
        }
      } catch (e) {
        console.warn('[QAEngineV2] Failed to generate tests, falling back to legacy logic', e);
      }
    }

    // 2. Fallback to Legacy Curated Logic
    const isStockScreenerFallback = isStockScreener;`
).replace(/if \(isStockScreener\) \{/, 'if (isStockScreenerFallback) {');

fs.writeFileSync(file, beforeGenerateTests + newAfter);
console.log("Done");
