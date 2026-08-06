import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "god" | "admin" | "qa" | "developer" | "viewer";

export type SessionProfile = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  role: UserRole;
};

/**
 * Returns the authenticated user's profile, or null if not signed in.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    role: (profile?.role as UserRole) ?? "viewer",
  };
}

export async function requireAuth(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}
