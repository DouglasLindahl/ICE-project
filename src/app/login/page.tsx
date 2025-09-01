"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import { useState } from "react";

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      // Narrow unknown safely
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StyledLoginPage>
      <StyledLoginForm>
        <StyledLoginFormLogo>Beacon</StyledLoginFormLogo>
        <StyledLoginFormHeader>Welcome back</StyledLoginFormHeader>
        <StyledLoginFormSubHeader>
          Sign in to access your emergency contacts
        </StyledLoginFormSubHeader>

        <StyledForm onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </StyledLoginFormInputSection>

          {errorMsg && <StyledError>{errorMsg}</StyledError>}

          <StyledLoginFormSubmitButton type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
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
  );
}
