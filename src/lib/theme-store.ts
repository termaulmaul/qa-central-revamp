import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'qa-theme';

// Default is light. We only ever add the `.dark` class for dark mode so the
// Tailwind `dark:` variants (scoped to `.dark`) light up across the whole app,
// including the login page.
const readInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Fall back to whatever the no-flash inline script already applied.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

let theme: Theme = readInitialTheme();
const listeners = new Set<() => void>();

const applyToDocument = (next: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', next === 'dark');
};

export const getTheme = (): Theme => theme;

// Server snapshot must be stable to satisfy useSyncExternalStore.
const getServerTheme = (): Theme => 'light';

export const setTheme = (next: Theme) => {
  if (next === theme) {
    // Still make sure the DOM matches (e.g. after hydration from storage).
    applyToDocument(next);
    return;
  }
  theme = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }
  applyToDocument(next);
  listeners.forEach((l) => l());
};

export const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useTheme = (): Theme =>
  useSyncExternalStore(subscribe, getTheme, getServerTheme);
