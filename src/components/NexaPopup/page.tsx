"use client";

import styled, { css } from "styled-components";
import { theme } from "../../../styles/theme";

type NoticeType = "success" | "error" | "info";
type Action = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
};

type Props = {
  open: boolean;
  type?: NoticeType;
  title: string;
  message: string;
  onClose: () => void;
  actions?: Action[];
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
`;

const Card = styled.div<{ $type: NoticeType }>`
  width: min(520px, 92vw);
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 14px;
  padding: 18px;
  display: grid;
  gap: 12px;

  ${(p) =>
    p.$type === "success"
      ? css`
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        `
      : p.$type === "error"
      ? css`
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        `
      : css`
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        `}
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const Body = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.95;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const Btn = styled.button<{ $variant?: "primary" | "ghost" }>`
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
        `
      : css`
          background: ${theme.colors.accent};
          color: ${theme.colors.text || "#fff"};
          border: 1px solid ${theme.colors.accent};
          &:hover {
            filter: brightness(1.07);
          }
        `}
`;

export function NexaPopup({
  open,
  type = "info",
  title,
  message,
  actions,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <Backdrop
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-label={title} $type={type}>
        <Title>{title}</Title>
        <Body>{message}</Body>
        <Actions>
          {actions?.map((a, i) => (
            <Btn key={i} onClick={a.onClick} $variant={a.variant}>
              {a.label}
            </Btn>
          ))}
          <Btn onClick={onClose} $variant="ghost">
            Close
          </Btn>
        </Actions>
      </Card>
    </Backdrop>
  );
}
