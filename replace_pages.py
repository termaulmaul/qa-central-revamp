import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add imports at the top
import_statement = "import { useLLMState, updateLLMState, testLLMChat, abortLLMChat, fetchLLMModels } from '../lib/llm-store';\nimport { useQAGuidelinesState, updateQAGuidelinesState } from '../lib/qa-guidelines-store';\n"
if 'useLLMState' not in content:
    content = content.replace("import { useQaseState, updateQaseState } from '../lib/qase-store';", 
                              "import { useQaseState, updateQaseState } from '../lib/qase-store';\n" + import_statement)

# 2. Replace AIPlaygroundPage
ai_pg_new = """const AIPlaygroundPage = () => {
  const llmState = useLLMState();
  const [chatInput, setChatInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [llmState.chatHistory]);

  return (
    <div className="h-full w-full p-6 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Cpu size={24} className="text-indigo-500" />
            AI Playground
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Test LLM connectivity, model performance, and tune generation parameters.</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl">
        {/* LEFT PANE: Chat Interface (61.8%) */}
        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/20 border-r border-zinc-200 dark:border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
          
          <div className="flex-1 overflow-y-auto p-5" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {llmState.chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 space-y-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Bot size={32} className="text-zinc-400" />
                  </div>
                  <p className="text-sm">Start a conversation with the selected model</p>
                </div>
              ) : (
                llmState.chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.thinking && (
                        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 w-full italic font-mono text-xs">
                          <div className="font-semibold mb-2 flex items-center gap-2 not-italic">
                            <Activity size={12} className="text-indigo-500" /> Chain of Thought
                          </div>
                          {msg.thinking}
                        </div>
                      )}
                      <div className={`rounded-xl p-4 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {llmState.isGenerating && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="relative max-w-3xl mx-auto flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !llmState.isGenerating && chatInput.trim()) {
                    e.preventDefault();
                    testLLMChat(chatInput);
                    setChatInput('');
                  }
                }}
                placeholder={llmState.isGenerating ? "Model is thinking..." : "Send a message to test the model..."}
                disabled={llmState.isGenerating || llmState.status !== 'connected'}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 spring-transition disabled:opacity-50"
              />
              {llmState.isGenerating ? (
                <button onClick={abortLLMChat} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 spring-transition shadow-sm">
                  <X size={14} />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (chatInput.trim()) {
                      testLLMChat(chatInput);
                      setChatInput('');
                    }
                  }}
                  disabled={!chatInput.trim() || llmState.status !== 'connected'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 spring-transition shadow-sm disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              )}
            </div>
            <div className="flex justify-between items-center mt-2 max-w-3xl mx-auto px-1">
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono flex items-center gap-1">
                <Terminal size={10} /> {llmState.status === 'connected' ? 'MLX Engine Ready' : 'Model Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Configuration & Performance (38.2%) */}
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950" style={{ flex: '0 0 38.2%', minWidth: '320px' }}>
          
          <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 bg-zinc-50/80 dark:bg-zinc-900/30 shrink-0">
            <SlidersHorizontal size={14} className="text-zinc-600 dark:text-zinc-400 mr-2" />
            <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Configuration</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-zinc-50 dark:bg-zinc-900/10">
            
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Model</label>
              <div className="relative">
                <select 
                  value={llmState.model}
                  onChange={(e) => updateLLMState({ model: e.target.value })}
                  className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700 spring-transition appearance-none"
                >
                  <option value="" disabled>Select a model</option>
                  {llmState.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {llmState.models.length === 0 && llmState.model && <option value={llmState.model}>{llmState.model}</option>}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Parameters</label>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Temperature</span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{(llmState.temperature ?? 0.7).toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.01" value={llmState.temperature ?? 0.7} 
                  onChange={(e) => updateLLMState({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Max Tokens</span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{llmState.maxTokens ?? 2048}</span>
                </div>
                <input 
                  type="range" min="1" max="8192" step="1" value={llmState.maxTokens ?? 2048} 
                  onChange={(e) => updateLLMState({ maxTokens: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Top P</span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{(llmState.topP ?? 1.0).toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={llmState.topP ?? 1.0} 
                  onChange={(e) => updateLLMState({ topP: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Top K</span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{llmState.topK ?? 40}</span>
                </div>
                <input 
                  type="range" min="1" max="100" step="1" value={llmState.topK ?? 40} 
                  onChange={(e) => updateLLMState({ topK: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>
            </div>
            
            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} className="text-indigo-600 dark:text-indigo-400" /> Performance
                </label>
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400 ">
                  <div className={`w-1.5 h-1.5 rounded-full ${llmState.isGenerating ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-700'}`}></div> 
                  {llmState.isGenerating ? 'Generating...' : 'Idle'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Prefill (t/s)</div>
                  <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">{llmState.telemetry.prefillTs}</div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Token Gen (t/s)</div>
                  <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">{llmState.telemetry.tokenGenTs}</div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Thinking (s)</div>
                  <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">{llmState.telemetry.thinkingS}</div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Duration (s)</div>
                  <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">{llmState.telemetry.durationS}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
"""

# Replace in content
pattern_ai = re.compile(r'const AIPlaygroundPage = \(\) => \{.*?(?=const DashboardPage = \(\) => \()', re.DOTALL)
content = pattern_ai.sub(ai_pg_new + "\n", content)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)
