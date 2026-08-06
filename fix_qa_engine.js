const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/lib/qa-engine/qa-engine.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix analyzePRD
content = content.replace(
  /const extracted = await requirementExtractor\.extract\(text, \{\n      platform: 'Web',\n      projectContext: 'Revamp Project'\n    \}\);/,
  "const extracted = requirementExtractor.extract(text, 'Markdown');"
);

content = content.replace(
  /area: `Module \$\{idx \+ 1\} - \$\{req\.module \|\| req\.title\}`/,
  "area: `Module ${idx + 1} - ${req.metadata?.feature || req.title}`"
);

// Fix generateTests
content = content.replace(
  /const extracted = await requirementExtractor\.extract\(prdText, \{\n        platform: 'Web',\n        projectContext: 'Revamp Project'\n      \}\);/,
  "const extracted = requirementExtractor.extract(prdText, 'Markdown');"
);

content = content.replace(
  /behavior: tc\.type === 'negative' \|\| tc\.type === 'security' \|\| tc\.type === 'edge_case' \? 'Negative' : 'Positive',/,
  "behavior: tc.type === 'Negative' || tc.type === 'Security' || tc.type === 'Boundary' ? 'Negative' : 'Positive',"
);

content = content.replace(
  /suite: sanitizeCapabilityName\(req\.module \|\| 'General'\),/,
  "suite: sanitizeCapabilityName(req.metadata?.feature || 'General'),"
);

content = content.replace(
  /precondition: tc\.preconditions\?\.join\('\\n'\) \|\| '',/,
  "precondition: tc.preconditions?.map(p => p.description).join('\\n') || '',"
);

content = content.replace(
  /postcondition: tc\.postconditions\?\.join\('\\n'\) \|\| '',/,
  "postcondition: tc.cleanup?.join('\\n') || '',"
);

content = content.replace(
  /expectedResult: s\.expected_result,/,
  "expectedResult: s.expected,"
);

content = content.replace(
  /data: s\.test_data \? JSON\.stringify\(s\.test_data\) : ''/,
  "data: s.data ? JSON.stringify(s.data) : ''"
);

fs.writeFileSync(file, content);
console.log("Fixed qa-engine.ts");
