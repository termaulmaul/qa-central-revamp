import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Role changes go through the admin_update_user_role() Postgres function
// (SECURITY DEFINER, see supabase/migrations/0004_admin_user_management.sql)
// instead of a direct profiles UPDATE, so the self-only RLS policy on
// `profiles` never needs to be weakened. The function itself re-checks the
// caller's role via auth.uid(), so this route is safe to expose to any
// authenticated caller — it will simply reject non-admin/god callers.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role;
  if (typeof role !== "string") {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_update_user_role", {
    target_id: id,
    new_role: role,
  });

  if (error) {
    const message = error.message || "Unable to update user role";
    if (message.includes("not authorized")) return NextResponse.json({ error: message }, { status: 403 });
    if (message.includes("user not found")) return NextResponse.json({ error: message }, { status: 404 });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const row = data as {
    id: string;
    username: string;
    display_name: string | null;
    role: string;
    created_at: string;
    updated_at: string;
  };

  const user = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return NextResponse.json({ user });
}
