"use client";

import styled, { keyframes } from "styled-components";
import { theme } from "../../../styles/theme";

type Props = {
  message?: string;
  subtext?: string;
};

// ===== Animations =====
const spin = keyframes`
  0%   { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ===== Layout =====
const Wrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: ${theme.colors.background};
`;

const Card = styled.div`
  display: grid;
  place-items: center;
  gap: 14px;
  padding: 24px 28px;
  border-radius: 16px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  animation: ${fadeIn} 180ms ease;
`;

const Spinner = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.accent};
  animation: ${spin} 900ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: ${theme.colors.border};
  }
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 15px;
`;

const Sub = styled.div`
  font-size: 13px;
  opacity: 0.8;
  text-align: center;
  max-width: 280px;
`;

export function LoadingScreen({ message = "Loading…", subtext }: Props) {
  return (
    <Wrap role="dialog" aria-live="polite" aria-label={message}>
      <Card>
        <Spinner aria-hidden />
        <Title>{message}</Title>
        {subtext ? <Sub>{subtext}</Sub> : null}
      </Card>
    </Wrap>
  );
}
