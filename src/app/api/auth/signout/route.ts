import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEV_BYPASS_COOKIE } from "@/lib/dev-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_BYPASS_COOKIE);
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
