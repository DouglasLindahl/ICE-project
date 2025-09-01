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
