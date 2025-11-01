"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const supa = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // 1) wait for a session (after email click -> redirect)
      for (let i = 0; i < 15; i++) {
        const { data } = await supa.auth.getSession();
        if (data.session?.user) break;
        await new Promise((r) => setTimeout(r, 200));
      }

      const { data: userData, error: userErr } = await supa.auth.getUser();
      if (userErr || !userData.user) {
        router.replace("/login");
        return;
      }

      const user = userData.user;

      // 2) read the fields we saved during registration
      const raw = sessionStorage.getItem("postSignupProfile");
      const profile = raw ? JSON.parse(raw) : null;

      // 3) write to user_metadata (optional but nice to have)
      if (profile) {
        await supa.auth.updateUser({ data: profile }).catch(() => {});
      }

      // 4) upsert into your public.profiles table
      //    (make sure RLS allows it; see SQL below)
      const upsertPayload = {
        id: user.id, // PK references auth.users
        display_name: profile?.display_name ?? "",
        phone_number: profile?.phone_number ?? "",
        terms_version: profile?.terms_version ?? null,
        terms_accepted_at: profile?.terms_accepted_at ?? null,
        privacy_accepted_at: profile?.privacy_accepted_at ?? null,
      };

      await supa.from("profiles").upsert(upsertPayload, { onConflict: "id" });

      // 5) clean and go
      sessionStorage.removeItem("postSignupProfile");
      router.replace("/dashboard");
    })();
  }, [router, supa]);

  return <div style={{ padding: 24 }}>Finalizing your account…</div>;
}
