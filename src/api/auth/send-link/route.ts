import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/adminClient";

// If you're on the App Router and using Node APIs
export const runtime = "nodejs";

const Body = z
  .object({
    email: z.string().email(),
    newEmail: z.string().email().optional(), // required for email change flows
    name: z.string().optional(),
    type: z.enum([
      "magiclink",
      "recovery",
      "signup", // requires password
      "invite",
      "email_change_current",
      "email_change_new",
    ]),
    password: z.string().min(8).optional(), // only required for signup
    redirectTo: z.string().url().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "signup" && !val.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "password is required for signup",
        path: ["password"],
      });
    }
    if (
      (val.type === "email_change_current" ||
        val.type === "email_change_new") &&
      !val.newEmail
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "newEmail is required for email change flows",
        path: ["newEmail"],
      });
    }
  });

type LinkType = z.infer<typeof Body>["type"];

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, newEmail, type, name, password, redirectTo } = Body.parse(
      await req.json()
    );

    const supabase = createAdminClient();
    const redirect = redirectTo ?? `${process.env.APP_URL}/auth/callback`;

    // We'll fill these in per-case
    let actionLink: string | undefined;
    let recipient = email;

    // Call the correct overload with a literal `type` so TS picks the right signature
    switch (type) {
      case "magiclink": {
        const resp = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        break;
      }

      case "recovery": {
        const resp = await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        break;
      }

      case "signup": {
        const resp = await supabase.auth.admin.generateLink({
          type: "signup",
          email,
          password: password!, // required by the signup overload
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        break;
      }

      case "invite": {
        const resp = await supabase.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        break;
      }

      case "email_change_current": {
        const resp = await supabase.auth.admin.generateLink({
          type: "email_change_current",
          email, // current email
          newEmail: newEmail!, // the requested new email
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        recipient = email; // send to CURRENT email address
        break;
      }

      case "email_change_new": {
        const resp = await supabase.auth.admin.generateLink({
          type: "email_change_new",
          email, // current email
          newEmail: newEmail!, // the requested new email
          options: { redirectTo: redirect },
        });
        if (resp.error) throw resp.error;
        actionLink = resp.data?.properties?.action_link;
        recipient = newEmail!; // send to NEW email address
        break;
      }
    }

    if (!actionLink) {
      return NextResponse.json(
        { error: "No action link returned" },
        { status: 500 }
      );
    }

    const subjectByType: Record<LinkType, string> = {
      magiclink: "Your secure sign-in link",
      recovery: "Reset your password",
      signup: "Confirm your email",
      invite: "You have been invited",
      email_change_current: "Confirm email change (current address)",
      email_change_new: "Confirm email change (new address)",
    };

    await resend.emails.send({
      from: process.env.EMAIL_FROM!, // e.g. 'Acme <no-reply@yourdomain.com>'
      to: recipient,
      subject: subjectByType[type],
      html: `
        <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;">
          <h2>${name ? `Hi ${name},` : "Hi,"}</h2>
          <p>${
            type === "magiclink"
              ? "Click the button below to sign in securely:"
              : type === "recovery"
              ? "Click the button below to reset your password:"
              : type === "signup"
              ? "Confirm your email to finish creating your account:"
              : type === "invite"
              ? "You have been invited. Confirm to get started:"
              : type === "email_change_current"
              ? "Confirm that you requested this email change:"
              : "Confirm your new email address:"
          }</p>
          <p style="margin:24px 0;">
            <a href="${actionLink}" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">
              ${type === "magiclink" ? "Sign in" : "Continue"}
            </a>
          </p>
          <p>If the button doesn’t work, paste this into your browser:</p>
          <p><a href="${actionLink}">${actionLink}</a></p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
          <p style="font-size:12px;color:#666">If you didn’t request this, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
