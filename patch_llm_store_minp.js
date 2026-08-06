const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/lib/llm-store.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("topK: number | undefined;", "topK: number | undefined;\n  minP: number | undefined;\n  thinking: string;");
code = code.replace("temperature: typeof window", "minP: typeof window !== 'undefined' && localStorage.getItem('llmMinP') ? Number(localStorage.getItem('llmMinP')) : undefined,\n    thinking: typeof window !== 'undefined' ? localStorage.getItem('llmThinking') || 'none' : 'none',\n    temperature: typeof window");
code = code.replace("if (state.topK !== undefined) localStorage.setItem('llmTopK', state.topK.toString()); else localStorage.removeItem('llmTopK');", "if (state.topK !== undefined) localStorage.setItem('llmTopK', state.topK.toString()); else localStorage.removeItem('llmTopK');\n    if (state.minP !== undefined) localStorage.setItem('llmMinP', state.minP.toString()); else localStorage.removeItem('llmMinP');\n    localStorage.setItem('llmThinking', state.thinking);");

fs.writeFileSync(file, code);
console.log("Patched llm-store.ts successfully.");
