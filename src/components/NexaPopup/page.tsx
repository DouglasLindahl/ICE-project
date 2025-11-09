"use client";

import React, { useEffect, useMemo, useRef } from "react";
import styled, { css } from "styled-components";
import { theme } from "../../../styles/theme";

type NoticeType = "success" | "error" | "info" | "warning";
type Action = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  autoFocus?: boolean;
};

type Props = {
  open: boolean;
  type?: NoticeType;
  title: string;
  message?: string;
  onClose: () => void;
  actions?: Action[];
  children?: React.ReactNode;

  /** Prevent closing via backdrop click */
  disableBackdropClose?: boolean;
  /** Prevent closing via Escape key */
  disableEscClose?: boolean;
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 16px; /* small gutter for tiny screens */
`;

const Card = styled.div<{ $type: NoticeType }>`
  width: min(560px, 92vw);
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 14px;
  padding: 18px;
  display: grid;
  gap: 12px;
  outline: none;

  ${(p) =>
    p.$type === "success"
      ? css`
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); /* green */
        `
      : p.$type === "error"
      ? css`
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.15); /* red */
        `
      : p.$type === "warning"
      ? css`
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.25);
          border-color: rgba(251, 191, 36, 0.5);
        `
      : css`
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); /* blue/info */
        `}
`;

const Title = styled.h3<{ $type?: NoticeType }>`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;

  span.badge {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    ${(p) =>
      p.$type === "warning"
        ? css`
            background: #f59e0b;
          ` // amber
        : p.$type === "error"
        ? css`
            background: #ef4444;
          `
        : p.$type === "success"
        ? css`
            background: #10b981;
          `
        : css`
            background: #3b82f6;
          `}
  }
`;

const Body = styled.div`
  margin: 0;
  font-size: 14px;
  opacity: 0.95;

  p {
    margin: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const Btn = styled.button<{
  $variant?: "primary" | "ghost";
  $type?: NoticeType;
}>`
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;

  ${(p) =>
    p.$variant === "ghost"
      ? css`
          background: transparent;
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.text};
          &:hover {
            border-color: ${theme.colors.accent};
            color: ${theme.colors.accent};
          }
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `
      : css`
          ${p.$type === "warning"
            ? css`
                background: #dc2626; /* red-600 */
                border: 1px solid #b91c1c;
                color: white;
                &:hover {
                  background: #b91c1c;
                }
              `
            : css`
                background: ${theme.colors.accent};
                border: 1px solid ${theme.colors.accent};
                color: ${theme.colors.text || "#111"};
                &:hover {
                  filter: brightness(1.07);
                }
              `}
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}
`;

export function NexaPopup({
  open,
  type = "info",
  title,
  message,
  actions,
  children,
  onClose,
  disableBackdropClose = false,
  disableEscClose = false,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const titleId = useMemo(
    () => `dialog-title-${Math.random().toString(36).slice(2)}`,
    []
  );
  const bodyId = useMemo(
    () => `dialog-body-${Math.random().toString(36).slice(2)}`,
    []
  );

  // Autofocus the first focusable element inside the dialog
  useEffect(() => {
    if (!open) return;
    const root = cardRef.current;
    if (!root) return;

    const focusable = root.querySelector<HTMLElement>(
      'input, textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [open]);

  // Key handling: Escape to close, Enter triggers first primary action
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableEscClose) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        // prefer the first primary, otherwise first action
        const primary = actions?.find(
          (a) => a.variant !== "ghost" && !a.disabled
        );
        const first = primary ?? actions?.find((a) => !a.disabled);
        if (first) {
          e.preventDefault();
          first.onClick();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, actions, onClose, disableEscClose]);

  if (!open) return null;

  return (
    <Backdrop
      onMouseDown={(e) => {
        if (!disableBackdropClose && e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        $type={type}
        onMouseDown={(e) => {
          // prevent card clicks from bubbling to the backdrop
          e.stopPropagation();
        }}
      >
        <Title id={titleId} $type={type}>
          <span className="badge" aria-hidden="true" />
          {title}
        </Title>

        <Body id={bodyId}>
          {message ? <p>{message}</p> : null}
          {children}
        </Body>
        <Actions>
          {actions?.map((a, i) => (
            <Btn
              key={i}
              onClick={a.onClick}
              $variant={a.variant}
              $type={type} // 👈 add this
              disabled={a.disabled}
              autoFocus={a.autoFocus}
            >
              {a.label}
            </Btn>
          ))}
        </Actions>
      </Card>
    </Backdrop>
  );
}
