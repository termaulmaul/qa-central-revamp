// Dev-only auth bypass. This laptop has no network path to the production
// Oracle user DB, so the real oracledb-backed login (ported alongside the
// other legacy modules) can't be exercised locally. This cookie-based
// bypass grants a synthetic "god" role session without touching Supabase or
// requiring Oracle connectivity.
//
// ceiling: no Oracle access from this environment.
// upgrade: remove once the app can reach the real Oracle user DB (or gate
// behind an explicit ops flag) and rely solely on the ported oracledb auth.
import type { SessionProfile } from "@/lib/auth";

export const DEV_BYPASS_COOKIE = "qa_dev_bypass";
export const DEV_BYPASS_USERNAME = "admin";
export const DEV_BYPASS_PASSWORD = "admin";

export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function matchesDevCredentials(identifier: string, password: string): boolean {
  return (
    isDevBypassEnabled() &&
    identifier.trim().toLowerCase() === DEV_BYPASS_USERNAME &&
    password === DEV_BYPASS_PASSWORD
  );
}

// A real UUID, not a readable slug: this id is written to uuid-typed columns
// (user_settings.user_id), which reject anything else outright.
export const DEV_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000001";

export function devBypassProfile(): SessionProfile {
  return {
    id: DEV_BYPASS_USER_ID,
    email: "admin@dev.local",
    username: "admin",
    displayName: "Admin (Dev Bypass)",
    role: "god",
  };
}
