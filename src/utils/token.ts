import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

type TokenGen = () => string;

// simple base64url-ish token generator (client-safe)
export function generateToken(len = 22) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet.charAt(b % alphabet.length)).join(
    ""
  );
}

function isPostgrestError(e: unknown): e is PostgrestError {
  return typeof e === "object" && e !== null && "message" in e;
}

function isUniqueViolation(e: unknown): boolean {
  if (!isPostgrestError(e)) return false;
  const msg = e.message ?? "";
  // `code` exists on PostgrestError in supabase-js
  const code = (e as { code?: string }).code ?? "";
  return code === "23505" || /duplicate key|unique constraint/i.test(msg);
}

function hasToken(row: unknown): row is { token: string } {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return typeof r.token === "string";
}

export async function rotatePublicToken(
  supa: SupabaseClient,
  userId: string,
  genToken: TokenGen
): Promise<string> {
  // try a couple times in case of rare token collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const newToken = genToken();

    const { data, error } = await supa
      .from("public_pages")
      .upsert(
        {
          user_id: userId,
          token: newToken,
          is_active: true,
          last_rotated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("token")
      .single();

    if (error) {
      // only retry on unique collisions; otherwise bubble up
      if (isUniqueViolation(error)) continue;
      throw error;
    }

    if (hasToken(data)) return data.token;

    throw new Error("Rotation succeeded but response was missing a token.");
  }

  throw new Error("Rotation failed after several attempts.");
}
