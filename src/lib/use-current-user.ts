"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentUser = {
  id: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  role: "god" | "admin" | "qa" | "viewer";
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, role")
        .eq("id", authUser.id)
        .single();

      if (active) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? null,
          username: profile?.username ?? null,
          fullName: profile?.full_name ?? null,
          role: (profile?.role as CurrentUser["role"]) ?? "viewer",
        });
        setLoading(false);
      }
    }

    load();

    async function signOut() {
      await supabase.auth.signOut();
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
