"use client";

import styled, { css } from "styled-components";
import { theme } from "../../../styles/theme";

type Variant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles = {
  primary: css`
    background: ${theme.colors.primary};
    color: ${theme.colors.background || "#fff"};
    border: 2px solid ${theme.colors.primary};

    &:hover {
      background: ${theme.colors.background};
      color: ${theme.colors.primary || "#fff"};
      border: 2px solid ${theme.colors.primary};
    }
  `,
  secondary: css`
    background: ${theme.colors.secondary};
    color: ${theme.colors.text};
    border: 2px solid ${theme.colors.border};

    &:hover {
      border-color: ${theme.colors.accent};
    }
  `,
  accent: css`
    background: ${theme.colors.accent || "#ffb703"};
    color: #fff;
    border: 2px solid ${theme.colors.accent || "#ffb703"};

    &:hover {
      filter: brightness(1.1);
    }
  `,
  outline: css`
    background: transparent;
    color: ${theme.colors.text};
    border: 2px solid ${theme.colors.primary};

    &:hover {
      background: ${theme.colors.primary};
      border-color: ${theme.colors.primary};
      color: ${theme.colors.background};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${theme.colors.text};
    border: none;

    &:hover {
      color: ${theme.colors.accent};
    }
  `,
  danger: css`
    background: ${theme.colors.danger || "#e63946"};
    color: #fff;
    border: 2px solid ${theme.colors.danger || "#e63946"};

    &:hover {
      filter: brightness(1.1);
    }
  `,
};

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s ease;
  user-select: none;

  ${({ variant = "primary" }) => variantStyles[variant]};
  ${({ fullWidth }) => fullWidth && "width: 100%;"}
  ${({ loading }) => loading && "opacity: 0.6; pointer-events: none;"}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export function CustomButton({
  children,
  variant = "primary",
  fullWidth,
  loading,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton
      variant={variant}
      fullWidth={fullWidth}
      loading={loading}
      {...rest}
    >
      {loading ? "Loading..." : children}
    </StyledButton>
  );
}
