// Supabase connection config.
// Prefer environment variables; fall back to the project's public values so the
// app works in preview/deploy even when env vars are not set.
// NOTE: the anon/publishable key is designed to be exposed to the browser and is
// safe to ship publicly. Data access is still protected by Row Level Security.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://glqvzhaccgysmilvjndf.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_RCXCXlymZL8sLT1qRl2UFQ_GKlvBuDy";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
