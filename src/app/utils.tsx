// utils/supabase-data-utils.ts
// Thin, typed helpers so components don't deal with query strings

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

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
};
function getErrorMessage(err: unknown): string {
  if ((err as AuthError)?.message) return (err as AuthError).message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Could not change password.";
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
