import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "god" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, created_at, updated_at")
    .order("username");

  // Under the dev-bypass cookie session there is no real Supabase
  // auth.uid(), so the RLS-protected select fails or returns nothing. That's
  // an accepted limitation of this environment, not a bug — surface it as a
  // clear error the UI can render instead of crashing.
  if (error) {
    return NextResponse.json(
      { error: "Unable to load users — sign in with a real account to manage users" },
      { status: 500 },
    );
  }

  const users = (data ?? []).map((row) => ({
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string | null,
    role: row.role as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return NextResponse.json({ users });
}
