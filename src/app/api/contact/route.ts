import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const schema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  message: z.string().min(5).max(5000),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Optional: basic spam check (honeypot handled client-side too)
    if (typeof json.company === "string" && json.company.length > 0) {
      return NextResponse.json({ ok: true }); // silently drop bot submissions
    }

    const { name, email, message } = parsed.data;

    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to save your message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
