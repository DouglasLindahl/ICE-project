"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";

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
`;

const StyledLoginFormLogo = styled.form`
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
const StyledLoginFormSubmitButton = styled.button`
  width: 100%;
  background-color: ${theme.colors.accent};
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  font-weight: bold;
  margin-top: 24px;
`;
const StyledLoginFormAlreadyHaveAnAccountButton = styled.button`
  background: none;
  border: none;
  color: gray;
  margin-top: 24px;
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

export default function Login() {
  const router = useRouter();
  return (
    <StyledLoginPage>
      <StyledLoginForm>
        <StyledLoginFormLogo>Beacon</StyledLoginFormLogo>
        <StyledLoginFormHeader>Set up your safety circle</StyledLoginFormHeader>
        <StyledLoginFormSubHeader>
          Create your emergency contact profile in just a few steps
        </StyledLoginFormSubHeader>
        <StyledLoginFormInputSection>
          <StyledLoginFormInputLabel>Full Name</StyledLoginFormInputLabel>
          <StyledLoginFormInput placeholder="Enter your full name"></StyledLoginFormInput>
        </StyledLoginFormInputSection>
        <StyledLoginFormInputSection>
          <StyledLoginFormInputLabel>Email</StyledLoginFormInputLabel>
          <StyledLoginFormInput placeholder="Enter your email"></StyledLoginFormInput>
        </StyledLoginFormInputSection>
        <StyledLoginFormInputSection>
          <StyledLoginFormInputLabel>Password</StyledLoginFormInputLabel>
          <StyledLoginFormInput
            type="password"
            placeholder="Enter your password"
          ></StyledLoginFormInput>
        </StyledLoginFormInputSection>
        <StyledLoginFormSubmitButton>
          Create account
        </StyledLoginFormSubmitButton>
        <StyledLoginFormAlreadyHaveAnAccountButton
          onClick={() => {
            router.push("/login");
          }}
        >
          Already have an account? Sign in
        </StyledLoginFormAlreadyHaveAnAccountButton>
        <StyledLoginFormHomeButton>Back to home</StyledLoginFormHomeButton>
      </StyledLoginForm>
    </StyledLoginPage>
  );
}
