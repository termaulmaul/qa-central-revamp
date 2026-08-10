"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  role: "god" | "admin" | "qa" | "developer" | "viewer";
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      // Goes through the /api/auth/session route so the dev auth bypass
      // (no Supabase session, cookie-only) resolves the same profile the
      // server sees via getSessionProfile().
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const { profile } = (await response.json()) as { profile: CurrentUser | null };

      if (active) {
        setUser(profile);
        setLoading(false);
      }
    }

    load();

    async function signOut() {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    }

    // expose sign-out via a custom event so any component can trigger it
    const handler = () => {
      void signOut();
    };
    window.addEventListener("qa-sign-out", handler);

    return () => {
      active = false;
      window.removeEventListener("qa-sign-out", handler);
    };
  }, []);

  return { user, loading };
}

export function triggerSignOut() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("qa-sign-out"));
  }
}
