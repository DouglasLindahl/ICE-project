// app/api/test-email/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

export const runtime = "nodejs"; // ensure Node runtime for Resend

const resend = new Resend(process.env.RESEND_API_KEY);

const Body = z.object({
  to: z.string().email(),
  subject: z.string().default("NexaQR — Test Email"),
  name: z.string().default("there"),
  link: z.string().url().default("https://example.com/test-link"),
});

export async function POST(req: Request) {
  try {
    const { to, subject, name, link } = Body.parse(await req.json());

    // Basic env sanity checks
    const from = process.env.EMAIL_FROM;
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY" },
        { status: 500 }
      );
    }
    if (!from) {
      return NextResponse.json(
        { ok: false, error: "Missing EMAIL_FROM" },
        { status: 500 }
      );
    }

    const html = `
<!doctype html>
<html lang="en" style="margin:0;padding:0;">
  <body style="margin:0;padding:0;background:#f8fafc;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A2540;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(10,37,64,.08);padding:48px 28px;">
      <img src="https://nexaqr.com/logo.png" alt="NexaQR" style="height:40px;margin-bottom:24px;">
      <h1 style="font-size:26px;font-weight:700;margin:0 0 16px;">This is a test email</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Hi ${name}, here’s your test link. No Supabase involved.</p>
      <a href="${link}" style="display:inline-block;background:#FFB703;color:#0A2540;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;box-shadow:0 2px 4px rgba(10,37,64,.1);">
        Open Test Link
      </a>
      <p style="font-size:13px;margin-top:24px;">
        If the button doesn’t work:<br>
        <a href="${link}" style="color:#FFB703;text-decoration:underline;">${link}</a>
      </p>
      <div style="font-size:12px;color:#5f6b7a;margin-top:32px;line-height:1.5;">
        © ${new Date().getFullYear()} NexaQR ·
        <a href="${
          process.env.APP_URL ?? "http://localhost:3000"
        }" style="color:#FFB703;text-decoration:underline;">
          ${process.env.APP_URL ?? "http://localhost:3000"}
        </a>
      </div>
    </div>
  </body>
</html>`;

    const res = await resend.emails.send({
      from, // e.g. "NexaQR <support@nexaqr.com>"
      to,
      subject,
      html,
    });

    // Log full response server-side
    console.log("Resend response:", res);

    if (res.error) {
      return NextResponse.json(
        {
          ok: false,
          error: res.error?.message ?? "Resend error",
          details: res.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, id: res.data?.id ?? null });
  } catch (err: any) {
    console.error("test-email error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unhandled error" },
      { status: 400 }
    );
  }
}

// Optional: quick 405 for GET so you can see the route exists
export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 });
}
