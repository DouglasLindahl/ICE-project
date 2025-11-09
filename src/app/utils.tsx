// utils/supabase-data-utils.ts
// Thin, typed helpers so components don't deal with query strings

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export type Tier = {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  max_contacts: number | null; // null = unlimited
  description?: string | null;
  is_active?: boolean | null;
  can_buy?: boolean | null;
};

export type BillingCycle = "monthly" | "yearly";
// ----- Types you already use -----
export type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: boolean;
  position: number | null;
};

export type ProfileRow = {
  user_id: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  additional_information?: string | null;
  subscription_tier_id: string | null;
};
export async function fetchMaxContacts(
  supa: SupabaseClient,
  userId: string
): Promise<number | null> {
  // 1) get the user's chosen tier id from profiles
  const { data: prof, error: pErr } = await supa
    .from("profiles")
    .select("subscription_tier_id")
    .eq("user_id", userId)
    .single();

  if (pErr) {
    console.warn("fetchMaxContacts: profile error:", pErr.message);
    return null; // treat as unlimited if unknown
  }
  if (!prof?.subscription_tier_id) return null; // no tier = unlimited

  // 2) look up the tier’s max_contacts
  const { data: tier, error: tErr } = await supa
    .from("subscription_tiers")
    .select("max_contacts")
    .eq("id", prof.subscription_tier_id)
    .single();

  if (tErr) {
    console.warn("fetchMaxContacts: tier error:", tErr.message);
    return null; // treat as unlimited if unknown
  }
  return tier?.max_contacts ?? null; // null = unlimited (e.g. Testers)
}
// ----- Session / Auth -----
export async function getSessionUser(supa: SupabaseClient) {
  const { data } = await supa.auth.getSession();
  return data.session?.user ?? null;
}

export async function signOut(supa: SupabaseClient) {
  const { error } = await supa.auth.signOut();
  if (error) throw error;
}

// ----- Profiles -----
export async function fetchProfile(
  supa: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supa
    .from("profiles")
    .select("display_name, phone_number, additional_information")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow) ?? null;
}

export async function upsertProfile(supa: SupabaseClient, row: ProfileRow) {
  const { error } = await supa.from("profiles").upsert(row);
  if (error) throw error;
}

export async function updateAdditionalInfo(
  supa: SupabaseClient,
  userId: string,
  text: string
) {
  const { error } = await supa.from("profiles").upsert({
    user_id: userId,
    additional_information: text,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ----- Contacts -----
/* =========================
   Fetch
   ========================= */
export async function fetchContacts(supa: SupabaseClient): Promise<Contact[]> {
  const { data, error } = await supa
    .from("contacts")
    .select("id,name,relationship,phone_e164,position,priority")
    // You probably want to order by `position` now instead of boolean `priority`
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as Contact[]) ?? [];
}

/* =========================
   Insert
   ========================= */
export async function insertContact(
  supa: SupabaseClient,
  params: {
    user_id: string;
    name: string;
    relationship: string | null;
    phone_e164: string;
    position: number | null;
    priority?: boolean; // optional, default handled by DB
  }
) {
  const { error } = await supa.from("contacts").insert([params]);
  if (error) throw error;
}

/* =========================
   Update
   ========================= */
export async function updateContact(
  supa: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      Contact,
      "name" | "relationship" | "phone_e164" | "position" | "priority"
    >
  >
) {
  const { error } = await supa.from("contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeContact(supa: SupabaseClient, id: string) {
  const { error } = await supa.from("contacts").delete().eq("id", id);
  if (error) throw error;
}
// src/utils/validation.ts

/**
 * Strong password: 8+ chars, at least 1 upper, 1 lower, 1 number, 1 special
 */
export const validatePwStrong = (s: string): string | null => {
  if (!s) return "Password is required.";
  if (s.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(s)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(s)) return "Add at least one lowercase letter.";
  if (!/[0-9]/.test(s)) return "Add at least one number.";
  // safe special character class (no range errors)
  if (!/[!@#$%^&*()[\]{}._+\-=?<>;:'"\\|~`/]/.test(s))
    return "Add at least one special character.";
  return null;
};

/**
 * Confirms password match
 */
export const validatePwMatch = (s: string, pw: string): string | null => {
  if (!s) return "Please confirm your password.";
  return s === pw ? null : "Passwords don't match.";
};

// ----- Public Pages (QR) -----
export async function getOrCreatePublicToken(
  supa: SupabaseClient,
  userId: string,
  generateToken: () => string
): Promise<string> {
  const { data: existing, error } = await supa
    .from("public_pages")
    .select("token,is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (existing?.token && existing.is_active) return existing.token as string;

  const token = generateToken();
  const { error: upsertErr } = await supa.from("public_pages").upsert({
    user_id: userId,
    token,
    is_active: true,
    last_rotated_at: new Date().toISOString(),
  });
  if (upsertErr) throw upsertErr;
  return token;
}

export function buildPublicUrl(token: string, origin?: string) {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/qr/${token}`;
}

// Convenience to refresh contacts after a write
export async function refreshContacts(supa: SupabaseClient) {
  return fetchContacts(supa);
}
