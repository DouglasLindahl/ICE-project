"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supa = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supa.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setInfoMsg("Password updated. Redirecting to sign in…");
    setTimeout(() => router.push("/"), 1200);
  }

  return (
    <main style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
      <h1>Reset your password</h1>
      <p style={{ color: "#666" }}>Enter a new password for your account.</p>
      <form
        onSubmit={handleUpdate}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <label>
          New password
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
        </label>
        {errorMsg && (
          <div style={{ color: "#b00020", fontSize: 12 }}>{errorMsg}</div>
        )}
        {infoMsg && (
          <div style={{ color: "#0a0", fontSize: 12 }}>{infoMsg}</div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
