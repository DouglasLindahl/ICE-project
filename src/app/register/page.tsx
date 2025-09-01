"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";

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

const StyledLoginFormInput = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: none;
  background-color: ${theme.colors.inputBackground};
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
  color: #0a2540;
  font-size: 12px;
  opacity: 0.8;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export default function Register() {
  const router = useRouter();
  const supa = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      // 1) Sign up with email/password
      const { data, error } = await supa.auth.signUp({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // 2) If the user is immediately signed in (email confirm disabled),
      //    we’ll have a session and a user. Otherwise, Supabase requires email confirmation.
      const userId = data.user?.id;

      if (userId && fullName) {
        // Optional: upsert profile with display_name (requires profiles table + RLS as owner)
        const { error: profileErr } = await supa
          .from("profiles")
          .upsert({ user_id: userId, display_name: fullName });
        if (profileErr) {
          // Non-blocking: just show a message; signup still succeeded
          setInfoMsg("Account created, but we couldn't save your name yet.");
        }
      }

      // 3) Redirect if session exists; else ask the user to confirm email
      const { data: sessionCheck } = await supa.auth.getSession();
      if (sessionCheck.session) {
        router.push("/dashboard");
      } else {
        setInfoMsg(
          "Check your email to confirm your account. You can sign in once confirmed."
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <StyledLoginPage>
      <StyledLoginForm>
        <StyledLoginFormLogo>Beacon</StyledLoginFormLogo>
        <StyledLoginFormHeader>Set up your safety circle</StyledLoginFormHeader>
        <StyledLoginFormSubHeader>
          Create your emergency contact profile in just a few steps
        </StyledLoginFormSubHeader>

        <StyledForm onSubmit={handleRegister}>
          <StyledLoginFormInputSection>
            <StyledLoginFormInputLabel htmlFor="fullName">
              Full Name
            </StyledLoginFormInputLabel>
            <StyledLoginFormInput
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </StyledLoginFormInputSection>

          <StyledLoginFormInputSection>
            <StyledLoginFormInputLabel htmlFor="email">
              Email
            </StyledLoginFormInputLabel>
            <StyledLoginFormInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </StyledLoginFormInputSection>

          <StyledLoginFormInputSection>
            <StyledLoginFormInputLabel htmlFor="password">
              Password
            </StyledLoginFormInputLabel>
            <StyledLoginFormInput
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </StyledLoginFormInputSection>

          {errorMsg && <StyledError>{errorMsg}</StyledError>}
          {infoMsg && <StyledInfo>{infoMsg}</StyledInfo>}

          <StyledLoginFormSubmitButton type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </StyledLoginFormSubmitButton>
        </StyledForm>

        <StyledLoginFormAlreadyHaveAnAccountButton
          onClick={() => router.push("/login")}
          type="button"
        >
          Already have an account? Sign in
        </StyledLoginFormAlreadyHaveAnAccountButton>

        <StyledLoginFormHomeButton
          onClick={() => router.push("/")}
          type="button"
        >
          Back to home
        </StyledLoginFormHomeButton>
      </StyledLoginForm>
    </StyledLoginPage>
  );
}
