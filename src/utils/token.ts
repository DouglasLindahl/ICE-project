import { SupabaseClient } from "@supabase/supabase-js";
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
export async function rotatePublicToken(
  supa: SupabaseClient,
  userId: string,
  generateToken: TokenGen
): Promise<string> {
  // try a couple times in case of rare token collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const newToken = generateToken();
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

    if (!error) return data!.token;

    // only retry on unique collisions; otherwise bubble up
    const msg = error.message ?? "";
    const code = (error as any).code;
    const isCollision =
      code === "23505" || /duplicate key|unique constraint/i.test(msg);
    if (!isCollision) throw error;
  }
  throw new Error("Rotation failed after several attempts.");
}
