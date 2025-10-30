"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import { useState } from "react";
import { NexaInput } from "@/components/NexaInput/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";
import NexaFooter from "@/components/NexaFooter/page";
import NexaLogo from "@/components/NexaLogo/page";

// quick, pragmatic validators
const validateEmail = (s: string) => {
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Enter a valid email.";
};

const validatePw = (s: string) => {
  if (!s) return null;
  return s.length >= 8 ? null : "Password must be at least 8 characters.";
};

const StyledLoginPage = styled.div`
  background-color: ${theme.colors.background};
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledLoginForm = styled.div`
  background-color: ${theme.colors.card};
  padding: 24px;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 360px;
`;

const StyledLoginFormLogo = styled.div`
  margin-top: 12px;
  margin-bottom: 24px;
  font-weight: bold;
  font-size: 24px;
`;

const StyledLoginFormHeader = styled.h1`
  font-size: 24px;
  font-weight: 100;
  text-align: center;
`;

const StyledLoginFormSubHeader = styled.p`
  font-size: 16px;
  text-align: center;
  padding: 16px;
`;

const StyledLoginFormInputSection = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  width: 100%;
`;

const RowBetween = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const StyledLoginFormInput = styled(NexaInput)`
  width: 100%;
`;

const StyledLoginFormInputLabel = styled.label`
  margin-bottom: 6px;
  font-size: 12px;
`;

const StyledLoginFormSubmitButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  background-color: ${theme.colors.accent};
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  font-weight: bold;
  margin-top: 24px;
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const StyledTextButton = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  padding: 0;
  margin-top: 8px;
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

const StyledLoginFormAlreadyHaveAnAccountButton = styled.button`
  background: none;
  border: none;
  color: gray;
  margin-top: 24px;
  &:hover {
    cursor: pointer;
  }
`;

const StyledLoginFormHomeButton = styled.button`
  width: 100%;
  background-color: ${theme.colors.background};
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid ${theme.colors.border};
  font-weight: bold;
  margin-top: 24px;
`;

const StyledError = styled.div`
  width: 100%;
  margin-top: 12px;
  color: #b00020;
  font-size: 12px;
`;

const StyledInfo = styled.div`
  width: 100%;
  margin-top: 12px;
  color: #0f6;
  font-size: 12px;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export default function Login() {
  const router = useRouter();
  const supa = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Overlay loader control
  const [overlay, setOverlay] = useState<{
    visible: boolean;
    message: string;
    subtext?: string;
  }>({ visible: false, message: "" });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setOverlay({
      visible: true,
      message: "Signing you in…",
      subtext: "Securing your session",
    });
    try {
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setOverlay({ visible: false, message: "" });
    }
  }

  async function handleForgotPassword() {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email) {
      setErrorMsg(
        "Enter your email above, then click “Forgot password?” again."
      );
      return;
    }

    setOverlay({
      visible: true,
      message: "Sending reset email…",
      subtext: "Check your inbox for the link",
    });

    try {
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/resetPassword`,
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setInfoMsg("Password reset email sent. Check your inbox for a link.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Could not send reset email. Please try again.");
      }
    } finally {
      setOverlay({ visible: false, message: "" });
    }
  }

  return (
    <>
      {/* Full-screen overlay while busy */}
      {overlay.visible && (
        <LoadingScreen message={overlay.message} subtext={overlay.subtext} />
      )}

      <StyledLoginPage aria-busy={overlay.visible}>
        <StyledLoginForm>
          <StyledLoginFormLogo>
            <NexaLogo mode="dark"></NexaLogo>
          </StyledLoginFormLogo>
          <StyledLoginFormHeader>Welcome back</StyledLoginFormHeader>
          <StyledLoginFormSubHeader>
            Sign in to access your contacts
          </StyledLoginFormSubHeader>

          <StyledForm onSubmit={handleSubmit}>
            <StyledLoginFormInputSection>
              <RowBetween>
                <StyledLoginFormInputLabel htmlFor="email">
                  Email
                </StyledLoginFormInputLabel>
              </RowBetween>

              <StyledLoginFormInput
                id="email"
                name="email"
                ariaLabel="Email"
                placeholder="Enter your email"
                value={email}
                onChange={setEmail}
                inputMode="email"
                autoComplete="email"
                validate={validateEmail}
                showCounter={false}
                showValidity
              />
            </StyledLoginFormInputSection>

            <StyledLoginFormInputSection>
              <RowBetween>
                <StyledLoginFormInputLabel htmlFor="password">
                  Password
                </StyledLoginFormInputLabel>
              </RowBetween>

              <StyledLoginFormInput
                id="password"
                name="password"
                ariaLabel="Password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                validate={validatePw}
                showCounter={false}
                showValidity
              />

              <StyledTextButton
                type="button"
                onClick={handleForgotPassword}
                aria-label="Reset your password"
              >
                Forgot password?
              </StyledTextButton>
            </StyledLoginFormInputSection>

            {errorMsg && <StyledError>{errorMsg}</StyledError>}
            {infoMsg && <StyledInfo>{infoMsg}</StyledInfo>}

            <StyledLoginFormSubmitButton
              type="submit"
              disabled={overlay.visible}
            >
              {overlay.visible ? "Signing in..." : "Sign in"}
            </StyledLoginFormSubmitButton>
          </StyledForm>

          <StyledLoginFormAlreadyHaveAnAccountButton
            onClick={() => router.push("/register")}
            type="button"
            aria-label="Go to sign up"
          >
            Don&apos;t have an account? Sign up
          </StyledLoginFormAlreadyHaveAnAccountButton>

          <StyledLoginFormHomeButton
            onClick={() => router.push("/")}
            type="button"
          >
            Back to home
          </StyledLoginFormHomeButton>
        </StyledLoginForm>
      </StyledLoginPage>
      <NexaFooter></NexaFooter>
    </>
  );
}
