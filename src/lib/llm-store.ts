import { useSyncExternalStore } from 'react';

export interface LLMState {
  baseUrl: string;
  apiToken: string;
  model: string;
  models: string[];
  status: 'idle' | 'testing' | 'connected' | 'error';
  error?: string;
  isGenerating: boolean;
  telemetry: {
    prefillTs: string;
    prefillTokens?: number;
    tokenGenTs: string;
    genTokens?: number;
    thinkingS: string;
    thinkingTokens?: number;
    durationS: string;
  };
  chatHistory: { role: 'user' | 'assistant', content: string, thinking?: string }[];
  temperature: number | undefined;
  maxTokens: number | undefined;
  topP: number | undefined;
  topK: number | undefined;
  minP: number | undefined;
  thinking: string;
}

export const createLLMState = (): LLMState => {
  const baseUrl = typeof window !== 'undefined' ? localStorage.getItem('llmBaseUrl') || 'http://localhost:11434/v1' : 'http://localhost:11434/v1';
  const apiToken = typeof window !== 'undefined' ? localStorage.getItem('llmApiToken') || '' : '';
  const model = typeof window !== 'undefined' ? localStorage.getItem('llmModel') || '' : '';
  const modelsStr = typeof window !== 'undefined' ? localStorage.getItem('llmModels') : null;
  const models = modelsStr ? JSON.parse(modelsStr) : [];
  
  return {
    baseUrl,
    apiToken,
    model,
    models,
    status: 'idle',
    isGenerating: false,
    telemetry: {
      prefillTs: '0.0',
      tokenGenTs: '0.0',
      thinkingS: '-',
      durationS: '-',
    },
    chatHistory: [],
    minP: typeof window !== 'undefined' && localStorage.getItem('llmMinP') ? Number(localStorage.getItem('llmMinP')) : undefined,
    thinking: typeof window !== 'undefined' ? localStorage.getItem('llmThinking') || 'auto' : 'auto',
    temperature: typeof window !== 'undefined' && localStorage.getItem('llmTemp') ? Number(localStorage.getItem('llmTemp')) : undefined,
    maxTokens: typeof window !== 'undefined' && localStorage.getItem('llmMaxT') ? Number(localStorage.getItem('llmMaxT')) : undefined,
    topP: typeof window !== 'undefined' && localStorage.getItem('llmTopP') ? Number(localStorage.getItem('llmTopP')) : undefined,
    topK: typeof window !== 'undefined' && localStorage.getItem('llmTopK') ? Number(localStorage.getItem('llmTopK')) : undefined,
  };
};

let state = createLLMState();
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('llm-state-change'));
};

export const loadLLMState = () => state;

export const saveLLMState = (next: LLMState) => {
  state = next;
  if (typeof window !== 'undefined') {
    localStorage.setItem('llmBaseUrl', state.baseUrl);
    localStorage.setItem('llmApiToken', state.apiToken);
    localStorage.setItem('llmModel', state.model);
    localStorage.setItem('llmModels', JSON.stringify(state.models));
    if (state.temperature !== undefined) localStorage.setItem('llmTemp', state.temperature.toString()); else localStorage.removeItem('llmTemp');
    if (state.maxTokens !== undefined) localStorage.setItem('llmMaxT', state.maxTokens.toString()); else localStorage.removeItem('llmMaxT');
    if (state.topP !== undefined) localStorage.setItem('llmTopP', state.topP.toString()); else localStorage.removeItem('llmTopP');
    if (state.topK !== undefined) localStorage.setItem('llmTopK', state.topK.toString()); else localStorage.removeItem('llmTopK');
    if (state.minP !== undefined) localStorage.setItem('llmMinP', state.minP.toString()); else localStorage.removeItem('llmMinP');
    localStorage.setItem('llmThinking', state.thinking);
  }
  emit();
};

export const updateLLMState = (patch: Partial<LLMState> | ((current: LLMState) => Partial<LLMState>)) => {
  const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  saveLLMState(next);
};

export const clearLLMState = () => {
  state = createLLMState();
  emit();
};

export const subscribeLLMState = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useLLMState = () => useSyncExternalStore(subscribeLLMState, loadLLMState, loadLLMState);

export const fetchLLMModels = async () => {
  updateLLMState({ status: 'testing', error: undefined });
  try {
    const { baseUrl, apiToken } = loadLLMState();
    const res = await fetch('/api/llm/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiToken }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models = data?.data?.map((m: any) => m.id) || [];
    updateLLMState((prev) => ({ 
      status: 'connected', 
      models, 
      model: prev.model && models.includes(prev.model) ? prev.model : models[0] || ''
    }));
  } catch (error) {
    updateLLMState({ status: 'error', error: error instanceof Error ? error.message : 'Failed to fetch models' });
  }
};

let currentAbortController: AbortController | null = null;

export const abortLLMChat = () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
};

export const testLLMChat = async (message: string) => {
  if (currentAbortController) currentAbortController.abort();
  currentAbortController = new AbortController();

  const { baseUrl, apiToken, model, chatHistory, temperature, maxTokens, topP, topK } = loadLLMState();
  const startTime = performance.now();
  
  updateLLMState({ 
    isGenerating: true,
    telemetry: { prefillTs: '0.0', tokenGenTs: '0.0', thinkingS: '-', durationS: '-' },
    chatHistory: [...chatHistory, { role: 'user', content: message }]
  });

  try {
    const bodyPayload: any = {
      model: model,
      messages: [...chatHistory, { role: 'user', content: message }],
    };
    if (temperature !== undefined) bodyPayload.temperature = temperature;
    if (maxTokens !== undefined) bodyPayload.max_tokens = maxTokens;
    if (topP !== undefined) bodyPayload.top_p = topP;
    if (topK !== undefined) bodyPayload.top_k = topK;

    const res = await fetch('/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiToken, ...bodyPayload }),
      signal: currentAbortController.signal,
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const msg = data.choices?.[0]?.message || {};
    let reply = msg.content || 'No response';
    
    let thinking: string | undefined = msg.reasoning_content;
    
    if (!thinking) {
      const thinkMatch = reply.match(/<think>\s*([\s\S]*?)\s*(?:<\/think>|$)/);
      if (thinkMatch) {
        thinking = thinkMatch[1].trim();
        reply = reply.replace(/<think>\s*[\s\S]*?\s*(?:<\/think>|$)/, '').trim();
        if (!reply && thinking) {
           reply = '[Reasoning incomplete or no final answer provided]';
        }
      }
    }
    
    const durationSNum = (performance.now() - startTime) / 1000;
    const durationS = durationSNum.toFixed(2);
    const completionTokens = data.usage?.completion_tokens || 0;
    const promptTokens = data.usage?.prompt_tokens || 0;
    
    const tokenGenTs = completionTokens > 0 ? (completionTokens / durationSNum).toFixed(1) : '0.0';
    // We'll estimate prefill as very fast if we don't have streaming TTFT
    const prefillTs = promptTokens > 0 ? (promptTokens / (durationSNum * 0.1)).toFixed(1) : '0.0';
    
    // Estimate thinking tokens based on string length ratio
    const totalChars = (reply.length || 0) + (thinking ? thinking.length : 0);
    const thinkingTokens = thinking && totalChars > 0 ? Math.round(completionTokens * (thinking.length / totalChars)) : undefined;
    const finalGenTokens = thinkingTokens ? completionTokens - thinkingTokens : completionTokens;
    // We can use data.usage.total_time if provided by OMLX, or fallback to our duration estimate
    const omlxTime = data.usage?.total_time;
    const thinkingS = thinking ? (omlxTime ? (omlxTime * (thinking.length / totalChars)).toFixed(1) : (durationSNum * 0.5).toFixed(1)) : '-';
    
    updateLLMState((prev) => ({
      isGenerating: false,
      telemetry: {
        prefillTs,
        prefillTokens: promptTokens,
        tokenGenTs,
        genTokens: finalGenTokens,
        thinkingS, 
        thinkingTokens,
        durationS,
      },
      chatHistory: [...prev.chatHistory, { role: 'assistant', content: reply, thinking }]
    }));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      updateLLMState((prev) => ({
        isGenerating: false,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: `[Generation stopped]` }]
      }));
    } else {
      updateLLMState((prev) => ({
        isGenerating: false,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: `[Error]: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      }));
    }
  } finally {
    currentAbortController = null;
  }
};
