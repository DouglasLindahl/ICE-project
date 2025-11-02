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
  name: z.string().optional(), // optional; use if you want greeting
});

export async function POST(req: Request): Promise<NextResponse> {
  // Load logo for inline CID attachment
  const logoPath = path.join(process.cwd(), "public", "shield-accent.png");
  const logoBuffer = await fs.readFile(logoPath);

  try {
    const { email, name } = Body.parse(await req.json());
    const supabase = createAdminClient();

    // 1) Generate Supabase recovery link
    const { data: linkData, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${process.env.APP_URL}/resetPassword`, // your handler
        },
      });

    // Do not leak whether the email exists (user-enumeration safe)
    if (linkErr || !linkData?.properties?.action_link) {
      // If user doesn't exist, Supabase often returns an error.
      // We still return 200 OK to the client to avoid enumeration.
      console.warn("⚠️ recovery link generation issue:", linkErr?.message);
      return NextResponse.json({ ok: true });
    }

    const link: string = linkData.properties.action_link;

    // 2) Build HTML (inline styles + CID logo)
    const displayName = (name && name.trim()) || "there";
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

      <h1 style="font-size:26px;font-weight:700;margin-bottom:16px;color:#0A2540;">Reset your password</h1>
      <p style="font-size:15px;line-height:1.6;color:#0A2540;margin:0 0 24px;">
        Hi ${displayName}, click the button below to reset your NexaQR password.
      </p>

      <a href="${link}" style="display:inline-block;background-color:#FFB703;color:#0A2540;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;box-shadow:0 2px 4px rgba(10,37,64,0.1);">
        Reset Password
      </a>

      <p style="font-size:13px;color:#0A2540;margin-top:24px;">
        If the button doesn’t work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color:#FFB703;text-decoration:underline;">${link}</a>
      </p>

      <div style="font-size:12px;color:#5f6b7a;margin-top:32px;line-height:1.5;">
        If you didn’t request this, you can safely ignore this email.<br><br>
        © ${new Date().getFullYear()} NexaQR · 
        <a href="${
          process.env.APP_URL
        }" style="color:#FFB703;text-decoration:underline;">
          ${process.env.APP_URL}
        </a>
      </div>
    </div>
  </body>
</html>
`;

    // 3) Send via Resend (with inline logo)
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "NexaQR <no-reply@nexaqr.com>",
      to: email,
      subject: "Reset your NexaQR password",
      html,
      attachments: [
        {
          filename: "shield-accent.png",
          content: logoBuffer,
          contentType: "image/png",
          contentId: "logo", // <img src="cid:logo">
        },
      ],
    });

    if (result.error) {
      console.error("❌ Resend error:", result.error);
      // Still return ok:true to avoid email enumeration; log server-side
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("❌ send-password-reset error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
