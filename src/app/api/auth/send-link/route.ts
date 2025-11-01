export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { Resend } from "resend";
import fs from "node:fs/promises";
import path from "node:path";
const resend = new Resend(process.env.RESEND_API_KEY);

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const logoPath = path.join(process.cwd(), "public", "shield-accent.png");
  const logoBuffer = await fs.readFile(logoPath);
  try {
    const { email, password, name, phone } = Body.parse(await req.json());
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // 1️⃣ Create user in Supabase Auth
    const { data: userData, error: createErr } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { display_name: name },
      });

    if (createErr || !userData?.user) {
      console.error("❌ createUser error:", createErr);
      return NextResponse.json(
        { error: createErr?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // 2️⃣ Get Free tier subscription (if available)
    const { data: freeTier, error: tierErr } = await supabase
      .from("subscription_tiers")
      .select("id")
      .eq("name", "Free")
      .single();

    if (tierErr) {
      console.warn("⚠️ No Free tier found:", tierErr.message);
    }

    // 3️⃣ Upsert profile (make sure to include user_id and all relevant fields)
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: userId, // ✅ required for your schema
        display_name: name.trim(),
        phone_number: phone?.trim() || null,
        terms_version: "2025-03-01",
        terms_accepted_at: now,
        privacy_accepted_at: now,
        created_at: now,
        updated_at: now,
        subscription_tier_id: freeTier?.id ?? null,
      },
      { onConflict: "user_id" } // ✅ must match PK or unique constraint
    );

    if (upsertErr) {
      console.error("❌ upsert profile error:", upsertErr);
    } else {
      console.log("✅ profile created/updated successfully");
    }

    // 4️⃣ Generate confirmation link
    const { data: linkData, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo: `${process.env.APP_URL}/callback`,
        },
      });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("❌ generateLink error:", linkErr);
      return NextResponse.json(
        { error: "Failed to generate signup link" },
        { status: 500 }
      );
    }

    const link = linkData.properties.action_link;

    const html = `
<!doctype html>
<html lang="en" style="margin:0; padding:0;">
  <body style="margin:0; padding:0; background-color:#f8fafc; text-align:center; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0A2540;">
    <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;box-shadow:0 2px 8px rgba(10,37,64,0.08);padding:48px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:0 0 24px 0;">
      <img
        src="cid:logo"
        alt="NexaQR"
        width="160"
        style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:auto;margin:0 auto;"
      />
    </td>
  </tr>
</table>

      <h1 style="font-size:26px;font-weight:700;margin-bottom:16px;color:#0A2540;">Confirm your email</h1>
      <p style="font-size:15px;line-height:1.6;color:#0A2540;margin:0 0 24px;">Hi ${name}, welcome aboard! Please confirm your email address to activate your account.</p>

      <a href="${link}" style="display:inline-block;background-color:#FFB703;color:#0A2540;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;box-shadow:0 2px 4px rgba(10,37,64,0.1);">Confirm Email</a>

      <p style="font-size:13px;color:#0A2540;margin-top:24px;">
        If the button doesn’t work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color:#FFB703;text-decoration:underline;">${link}</a>
      </p>

      <div style="font-size:12px;color:#5f6b7a;margin-top:32px;line-height:1.5;">
        You received this email because an account was created with ${email}.<br>
        If this wasn’t you, just ignore it.<br><br>
        © ${new Date().getFullYear()} NexaQR · <a href="${
      process.env.APP_URL
    }" style="color:#FFB703;text-decoration:underline;">${
      process.env.APP_URL
    }</a>
      </div>
    </div>
  </body>
</html>
`;

    // 6️⃣ Send email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Confirm your NexaQR account",
      html,
      attachments: [
        {
          filename: "shield-accent.png",
          content: logoBuffer,
          contentType: "image/png",
          contentId: "logo",
        },
      ],
    });

    console.log("✅ Confirmation email sent to", email);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ send-link error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 400 }
    );
  }
}
