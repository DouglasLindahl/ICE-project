import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/adminClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type, password, newEmail, redirectTo } = body ?? {};

    if (!email || !type) {
      return NextResponse.json(
        { error: "Missing email or type" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const redirect =
      redirectTo ??
      `${process.env.APP_URL ?? "http://localhost:3000"}/auth/callback`;

    let resp:
      | Awaited<ReturnType<typeof supabase.auth.admin.generateLink>>
      | undefined;

    switch (type) {
      case "magiclink":
      case "recovery":
      case "invite":
        resp = await supabase.auth.admin.generateLink({
          type,
          email,
          options: { redirectTo: redirect },
        });
        break;

      case "signup":
        if (!password) {
          return NextResponse.json(
            { error: "password required for signup" },
            { status: 400 }
          );
        }
        resp = await supabase.auth.admin.generateLink({
          type,
          email,
          password,
          options: { redirectTo: redirect },
        });
        break;

      case "email_change_current":
      case "email_change_new":
        if (!newEmail) {
          return NextResponse.json(
            { error: "newEmail required for email change" },
            { status: 400 }
          );
        }
        resp = await supabase.auth.admin.generateLink({
          type,
          email,
          newEmail,
          options: { redirectTo: redirect },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ok: !resp.error,
      error: resp.error?.message ?? null,
      action_link_present: !!resp.data?.properties?.action_link,
      redirect,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
