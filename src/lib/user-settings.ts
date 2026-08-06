"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTheme, setTheme, useTheme, type Theme } from './theme-store';
import { useLLMState, updateLLMState } from './llm-store';
import { useQaseState, updateQaseState } from './qase-store';
import { useQAGuidelinesState, updateQAGuidelinesState } from './qa-guidelines-store';

// The persistable slice of app state. Only stable configuration is stored —
// never transient runtime data (chat history, telemetry, fetched projects,
// connection status, etc.).
export type AppSettings = {
  theme: Theme;
  llm: {
    baseUrl: string;
    apiToken: string;
    model: string;
    models: string[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    minP?: number;
    thinking: string;
  };
  qase: {
    token: string;
    baseUrl: string;
    selectedProjectCode: string;
  };
  guidelines: {
    guidelinesText: string;
  };
};

export async function loadUserSettings(
  userId: string,
): Promise<Partial<AppSettings> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.log('[v0] loadUserSettings error:', error.message);
    return null;
  }
  return (data?.settings as Partial<AppSettings> | undefined) ?? null;
}

export async function saveUserSettings(
  userId: string,
  settings: AppSettings,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings }, { onConflict: 'user_id' });
  if (error) console.log('[v0] saveUserSettings error:', error.message);
}

// Deterministic serialization so we only write to the DB when something in the
// persistable slice actually changed.
function serialize(s: AppSettings): string {
  return JSON.stringify(s);
}

/**
 * Two-way sync between the local stores and the signed-in user's DB row:
 * - On login, loads the saved settings and hydrates every store (so a user's
 *   theme + config follow them across devices/sessions).
 * - On any subsequent change, debounce-saves the persistable slice back.
 */
export function useUserSettingsSync(userId: string | null) {
  const theme = useTheme();
  const llm = useLLMState();
  const qase = useQaseState();
  const guidelines = useQAGuidelinesState();

  // Tracks which user we've hydrated, and the last snapshot written to the DB.
  const hydratedForUser = useRef<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSettings = (): AppSettings => ({
    theme: getTheme(),
    llm: {
      baseUrl: llm.baseUrl,
      apiToken: llm.apiToken,
      model: llm.model,
      models: llm.models,
      temperature: llm.temperature,
      maxTokens: llm.maxTokens,
      topP: llm.topP,
      topK: llm.topK,
      minP: llm.minP,
      thinking: llm.thinking,
    },
    qase: {
      token: qase.token ?? '',
      baseUrl: qase.baseUrl,
      selectedProjectCode: qase.selectedProjectCode ?? '',
    },
    guidelines: { guidelinesText: guidelines.guidelinesText },
  });

  // Load + hydrate once per signed-in user.
  useEffect(() => {
    if (!userId) {
      hydratedForUser.current = null;
      lastSavedRef.current = null;
      return;
    }
    if (hydratedForUser.current === userId) return;
    hydratedForUser.current = userId;

    let active = true;
    (async () => {
      const saved = await loadUserSettings(userId);
      if (!active) return;

      if (saved) {
        if (saved.theme) setTheme(saved.theme);
        if (saved.llm) updateLLMState(saved.llm);
        if (saved.qase) updateQaseState(saved.qase);
        if (saved.guidelines?.guidelinesText !== undefined) {
          updateQAGuidelinesState({
            guidelinesText: saved.guidelines.guidelinesText,
          });
        }
        // Mark the hydrated snapshot as saved so we don't echo it back.
        lastSavedRef.current = serialize(currentSettings());
      } else {
        // No row yet — seed it from the current local state on next tick.
        lastSavedRef.current = null;
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced save whenever the persistable slice changes.
  useEffect(() => {
    if (!userId || hydratedForUser.current !== userId) return;

    const snapshot = serialize(currentSettings());
    if (snapshot === lastSavedRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastSavedRef.current = snapshot;
      void saveUserSettings(userId, JSON.parse(snapshot) as AppSettings);
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, theme, llm, qase, guidelines]);
}
