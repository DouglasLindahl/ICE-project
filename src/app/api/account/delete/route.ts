// app/api/account/delete/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/adminClient";

export async function POST() {
  // 1) Get current session from cookies (anon client)
  const cookieStore = await cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supa.auth.getSession();
  if (error || !data.session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = data.session.user.id;

  // 2) Use service-role admin client
  const admin = createAdminClient();

  // (Optional) Revoke refresh tokens first
  try {
    await admin.auth.admin.signOut(userId);
  } catch {
    /* non-fatal */
  }

  // 3) Delete the Auth user — your FK cascades handle the rest
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("deleteUser failed:", delErr);
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  }

  // 4) Clear auth cookies client-side on next navigation by returning 200
  return NextResponse.json({ ok: true });
}
