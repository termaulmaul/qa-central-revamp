import { useSyncExternalStore } from 'react';
import type { QaseCapability, QaseState } from '../types/qase';

export const DEFAULT_QASE_BASE_URL = 'https://api.qase.io/v1';

const initialCapabilities = (): QaseCapability[] => [
  { resource: 'Projects', endpoint: '/project', status: 'unchecked' },
  { resource: 'Suites', endpoint: '/suite/{projectCode}', status: 'unchecked' },
  { resource: 'Cases', endpoint: '/case/{projectCode}', status: 'unchecked' },
  { resource: 'Runs', endpoint: '/run/{projectCode}', status: 'unchecked', optional: true },
  { resource: 'Defects', endpoint: '/defect/{projectCode}', status: 'unchecked', optional: true },
];

export const createQaseState = (): QaseState => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('qaseApiToken') || undefined : undefined;
  const baseUrl = typeof window !== 'undefined' ? localStorage.getItem('qaseBaseUrl') || DEFAULT_QASE_BASE_URL : DEFAULT_QASE_BASE_URL;
  return {
    baseUrl,
    token,
    projects: [],
    suites: [],
    cases: [],
    capabilities: initialCapabilities(),
    status: 'idle',
    selectedCaseId: null,
  };
};

let state = createQaseState();
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qase-state-change'));
};

export const loadQaseState = () => state;

export const saveQaseState = (next: QaseState) => {
  state = next;
  if (typeof window !== 'undefined') {
    if (state.token) {
      localStorage.setItem('qaseApiToken', state.token);
    } else {
      localStorage.removeItem('qaseApiToken');
    }
    if (state.baseUrl) {
      localStorage.setItem('qaseBaseUrl', state.baseUrl);
    }
  }
  emit();
};

export const updateQaseState = (patch: Partial<QaseState> | ((current: QaseState) => Partial<QaseState>)) => {
  const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  saveQaseState(next);
};

export const clearQaseState = () => {
  state = createQaseState();
  emit();
};

export const subscribeQaseState = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useQaseState = () => useSyncExternalStore(subscribeQaseState, loadQaseState, loadQaseState);
