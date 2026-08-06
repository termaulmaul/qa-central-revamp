"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_DOMAIN = "qacentral.app";

/**
 * Converts a login identifier to an email.
 * - If it already looks like an email, use it as-is.
 * - Otherwise treat it as a username and map to `<username>@qacentral.app`.
 */
function toEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return `${trimmed.toLowerCase()}@${EMAIL_DOMAIN}`;
}

export async function signIn(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!identifier || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(identifier),
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
