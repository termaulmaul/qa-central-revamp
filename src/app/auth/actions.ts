"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves a login identifier to the auth email.
 * - If it already looks like an email, use it as-is.
 * - Otherwise treat it as a username and look up the associated email via the
 *   `email_for_username` SECURITY DEFINER function (usernames are not stored on
 *   auth.users, so a DB lookup is required).
 */
async function resolveEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  identifier: string,
): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const { data, error } = await supabase.rpc("email_for_username", {
    uname: trimmed,
  });
  if (error || !data) return null;
  return String(data);
}

export async function signIn(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/modules");

  if (!identifier || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = await createClient();

  const email = await resolveEmail(supabase, identifier);
  if (!email) {
    return { error: "Invalid username or password." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  redirect(redirectTo.startsWith("/") && redirectTo !== "/" ? redirectTo : "/modules");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
