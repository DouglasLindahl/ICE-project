"use client";

import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import { NexaInput } from "@/components/NexaInput/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";
import { NexaPopup } from "@/components/NexaPopup/page";
import { NexaButton } from "@/components/NexaButton/page";
import { validatePwMatch, validatePwStrong } from "../utils";

/* ============================
   Styles
   ============================ */
const Page = styled.main`
  max-width: 420px;
  margin: 64px auto;
  padding: 16px;
`;

const Card = styled.section`
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: 24px;
`;

const Title = styled.h1`
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 22px;
`;

const Sub = styled.p`
  margin: 0 0 14px;
  color: #666;
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
  margin-top: 16px;
`;

const Label = styled.label`
  display: grid;
  gap: 6px;
  font-size: 12px;
`;

const Submit = styled.button<{ disabled?: boolean }>`
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  background: ${theme.colors.accent};
  color: ${theme.colors.text || "#fff"};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
`;

/* ============================
   Component
   ============================ */
export default function ResetPasswordPage() {
  const supa = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Loader overlay
  const [overlay, setOverlay] = useState<{
    visible: boolean;
    message: string;
    subtext?: string;
  }>({
    visible: false,
    message: "",
  });

  // Notice popup
  const [notice, setNotice] = useState<{
    open: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    actions?: {
      label: string;
      onClick: () => void;
      variant?: "primary" | "ghost";
    }[];
  }>({ open: false, type: "info", title: "", message: "" });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    const strongErr = validatePwStrong(password);
    const matchErr = validatePwMatch(confirm, password);

    if (strongErr || matchErr) {
      setNotice({
        open: true,
        type: "error",
        title: "Fix the form",
        message: strongErr || matchErr || "Please correct the errors above.",
      });
      return;
    }

    setSubmitting(true);
    setOverlay({ visible: true, message: "Updating password…" });

    try {
      const { error } = await supa.auth.updateUser({ password });
      if (error) {
        setNotice({
          open: true,
          type: "error",
          title: "Update failed",
          message: error.message,
        });
        return;
      }

      setNotice({
        open: true,
        type: "success",
        title: "Password updated",
        message: "Your password has been changed successfully.",
        actions: [
          {
            label: "Go to Sign In",
            variant: "primary",
            onClick: () => router.push("/login"),
          },
        ],
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setNotice({
        open: true,
        type: "error",
        title: "Something went wrong",
        message,
      });
    } finally {
      setSubmitting(false);
      setOverlay({ visible: false, message: "" });
    }
  }

  const disabled =
    submitting ||
    !!validatePwStrong(password) ||
    !!validatePwMatch(confirm, password);

  return (
    <>
      {overlay.visible && (
        <LoadingScreen message={overlay.message} subtext={overlay.subtext} />
      )}

      {notice.open && (
        <NexaPopup
          open={notice.open}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          actions={notice.actions}
          onClose={() => setNotice((n) => ({ ...n, open: false }))}
        />
      )}

      <Page aria-busy={overlay.visible}>
        <Card>
          <Title>Reset your password</Title>
          <Sub>Enter a new password for your account.</Sub>

          <Form onSubmit={handleUpdate}>
            <Label htmlFor="new_pw">
              New password
              <NexaInput
                id="new_pw"
                type="password"
                placeholder="New Password"
                value={password}
                onChange={setPassword}
                validate={validatePwStrong}
                showValidity
                maxLength={128}
                autoComplete="new-password"
                disabled={submitting || overlay.visible}
              />
            </Label>

            <Label htmlFor="confirm_pw">
              Repeat password
              <NexaInput
                id="Confirm_pw"
                type="password"
                placeholder="Repeat Password"
                value={confirm}
                onChange={setConfirm}
                validate={(s) => validatePwMatch(s, password)}
                showValidity
                maxLength={128}
                autoComplete="new-password"
                disabled={submitting || overlay.visible}
              />
            </Label>

            <NexaButton variant="accent" type="submit" disabled={disabled}>
              {submitting ? "Updating…" : "Update password"}
            </NexaButton>
          </Form>
        </Card>
      </Page>
    </>
  );
}
