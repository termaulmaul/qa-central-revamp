const fs = require('fs');
const file = '/Users/maul/Downloads/qa-central-revamp/src/app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const matrixReplacement = `
            {/* 3. Qase Capability Matrix */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-between">
            <h3 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Qase Capability Matrix</h3>
            <Button variant="ghost" className="text-xs py-1 px-3 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-300 hover:bg-blue-50 dark:bg-blue-500/10" disabled={qaseState.status === 'testing' || qaseState.status === 'syncing'} onClick={async () => {
              updateQaseState({ status: 'syncing' });
              // Mock checking capabilities
              setTimeout(() => {
                updateQaseState(prev => ({
                  status: 'connected',
                  capabilities: prev.capabilities.map(c => ({
                    ...c,
                    status: 'ok',
                    count: Math.floor(Math.random() * 100) + 1,
                    checkedAt: new Date().toISOString()
                  }))
                }));
              }, 1000);
            }}>Explore</Button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider text-center">Count</th>
                  <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {qaseState.capabilities.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 spring-transition">
                    <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                      {c.resource}
                      {c.optional && <span className="ml-1 text-[10px] text-zinc-500 font-normal bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">(optional)</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{c.endpoint}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={c.status === 'ok' ? 'success' : c.status === 'unchecked' ? 'neutral' : 'danger'} className="text-[10px] uppercase font-mono">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-800 dark:text-zinc-200">{c.count ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {c.checkedAt ? new Date(c.checkedAt).toLocaleString() : c.error ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>`;

code = code.replace(/\{\/\* 3\. Qase Capability Matrix \*\/\}[^]+?(?=\{\/\* 4\. QA Guidelines \(Knowledge Base\) \*\/\})/, matrixReplacement + "\n            \n            ");

const llmConfigReplacement = `            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Base URL (OpenAI-compatible)</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                  <input type="text" name="baseUrl" value={llmState.baseUrl} onChange={handleLLMChange} placeholder="https://api.openai.com/v1" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Token <span className="text-zinc-600 dark:text-zinc-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                  <input type="password" name="apiToken" value={llmState.apiToken} onChange={handleLLMChange} placeholder="sk-..." className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Model</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    {llmState.models.length > 0 ? (
                      <select name="model" value={llmState.model} onChange={handleLLMChange} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition appearance-none">
                        {llmState.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input type="text" name="model" value={llmState.model} onChange={handleLLMChange} placeholder="e.g. llama3, gpt-4" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                    )}
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-5">[\s\S]*?(?=<div className="flex items-center gap-3 pt-2">)/, llmConfigReplacement + "\n            ");

const aiPlaygroundModelReplacement = `<select 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 spring-transition appearance-none focus:outline-none focus:border-blue-500"
              value={llmState.model}
              onChange={(e) => updateLLMState({ model: e.target.value })}
            >
              {llmState.models.length === 0 ? (
                <option value={llmState.model}>{llmState.model || "No models fetched"}</option>
              ) : (
                llmState.models.map(m => <option key={m} value={m}>{m}</option>)
              )}
            </select>`;
            
const newAiPlaygroundModelReplacement = `
            {llmState.models.length > 0 ? (
              <select 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 spring-transition appearance-none focus:outline-none focus:border-blue-500"
                value={llmState.model}
                onChange={(e) => updateLLMState({ model: e.target.value })}
              >
                {llmState.models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="e.g. llama3, gpt-4" 
                value={llmState.model}
                onChange={(e) => updateLLMState({ model: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 spring-transition focus:outline-none focus:border-blue-500"
              />
            )}`;

code = code.replace(aiPlaygroundModelReplacement, newAiPlaygroundModelReplacement);

const fileUploadReplacement = `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf") {
        const text = await PDFParser.extractText(file);
        setAttachment({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      alert("Failed to read file.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };`;

const newFileUploadReplacement = `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const text = await PDFParser.extractText(file);
        setAttachment({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      alert("Failed to read file.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };`;

code = code.replace(fileUploadReplacement, newFileUploadReplacement);
code = code.replace(/accept="\.pdf,\.txt,\.md,\.csv,\.json"/, 'accept="*/*"');

fs.writeFileSync(file, code);
console.log("Updated page.tsx successfully.");
