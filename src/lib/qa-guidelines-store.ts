import { useSyncExternalStore } from 'react';

export interface QAGuidelinesState {
  guidelinesText: string;
}

export const createQAGuidelinesState = (): QAGuidelinesState => {
  const guidelinesText = typeof window !== 'undefined' 
    ? localStorage.getItem('qaGuidelines') || '' 
    : '';
  
  return {
    guidelinesText,
  };
};

let state = createQAGuidelinesState();
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const loadQAGuidelinesState = () => state;

export const saveQAGuidelinesState = (next: QAGuidelinesState) => {
  state = next;
  if (typeof window !== 'undefined') {
    localStorage.setItem('qaGuidelines', state.guidelinesText);
  }
  emit();
};

export const updateQAGuidelinesState = (patch: Partial<QAGuidelinesState> | ((current: QAGuidelinesState) => Partial<QAGuidelinesState>)) => {
  const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  saveQAGuidelinesState(next);
};

export const subscribeQAGuidelinesState = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useQAGuidelinesState = () => useSyncExternalStore(subscribeQAGuidelinesState, loadQAGuidelinesState, loadQAGuidelinesState);
