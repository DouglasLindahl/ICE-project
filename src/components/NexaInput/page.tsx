"use client";
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { theme } from "../../../styles/theme";

type Preset = "none" | "alphanumeric" | "numeric" | "e164" | "name";

type NexaInputProps = {
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;

  // Behavior
  preset?: Preset;
  maxLength?: number;
  blockEmoji?: boolean;
  trim?: "none" | "start" | "end" | "both";
  transform?: (v: string) => string;
  validate?: (v: string) => string | null;

  // UI
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  ariaLabel?: string;
  showCounter?: boolean; // default true
  showValidity?: boolean; // default true
  className?: string;
  multiline?: boolean;
  rows?: number;

  // Password helpers
  showPasswordToggle?: boolean; // NEW: default true
  passwordToggleAriaLabel?: string; // NEW: for accessibility

  // Accessibility
  id?: string;
};

const Wrapper = styled.div`
  display: grid;
  gap: 6px;
  width: 100%;
`;

const FieldShell = styled.div`
  position: relative;
  width: 100%;
`;

const InputEl = styled.input<{ $invalid: boolean }>`
  padding: 10px;
  width: 100%;
  background-color: ${theme.colors.inputBackground};
  border-radius: 10px;
  border: 1px solid
    ${({ $invalid }) => ($invalid ? "#ef4444" : theme.colors.border)};
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(255, 183, 3, 0.25);
  }
`;

const EyeBtn = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  svg {
    width: 18px;
    height: 18px;
    display: block;
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
  &:empty {
    display: none;
  }
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Counter = styled.span`
  font-size: 12px;
  opacity: 0.75;
`;

/* =========================
   Character filtering utils
   ========================= */
const EMOJI_REGEX =
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u26FF])/g;

function stripEmoji(s: string) {
  return s.replace(EMOJI_REGEX, "");
}

function applyTrim(s: string, mode: NexaInputProps["trim"]) {
  switch (mode) {
    case "start":
      return s.replace(/^\s+/, "");
    case "end":
      return s.replace(/\s+$/, "");
    case "both":
      return s.trim();
    default:
      return s;
  }
}

function presetFilter(preset: Preset, raw: string): string {
  switch (preset) {
    case "alphanumeric":
      return raw.replace(/[^a-zA-Z0-9 ]+/g, "");
    case "numeric":
      return raw.replace(/[^\d]+/g, "");
    case "e164": {
      let s = raw.replace(/[^\d+]+/g, "");
      const hadLeadingPlus = s.startsWith("+");
      s = s.replace(/\+/g, "");
      return hadLeadingPlus ? `+${s}` : s;
    }
    case "name":
      return raw.replace(/[^a-zA-Z \-'.]+/g, "");
    case "none":
    default:
      return raw;
  }
}

/* =========================
   Component
   ========================= */
export function NexaInput({
  value,
  onChange,
  multiline,
  rows,
  preset = "none",
  maxLength,
  blockEmoji = false,
  trim = "none",
  transform,
  validate,
  placeholder,
  type = "text",
  name,
  disabled,
  inputMode,
  autoComplete,
  ariaLabel,
  showCounter = true,
  showValidity = true,
  className,
  id,
  showPasswordToggle = true,
  passwordToggleAriaLabel = "Toggle password visibility",
}: NexaInputProps) {
  const [touched, setTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const processed = useMemo(() => {
    let v = value ?? "";
    if (blockEmoji) v = stripEmoji(v);
    v = presetFilter(preset, v);
    if (transform) v = transform(v);
    v = applyTrim(v, trim);
    if (typeof maxLength === "number" && maxLength >= 0)
      v = v.slice(0, maxLength);
    return v;
  }, [value, preset, blockEmoji, transform, trim, maxLength]);

  const errorMsg = useMemo(() => {
    if (!showValidity || !validate) return null;
    return validate(processed);
  }, [processed, validate, showValidity]);

  React.useEffect(() => {
    if (processed !== value) onChange(processed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processed]);

  const hasCounter = showCounter && typeof maxLength === "number";
  const hasError = showValidity && touched && !!errorMsg;

  const isPasswordField = !multiline && type === "password";
  const effectiveType = isPasswordField ? (showPw ? "text" : "password") : type;

  return (
    <Wrapper className={className}>
      <FieldShell>
        {multiline ? (
          <InputEl
            as="textarea"
            rows={rows || 3}
            id={id}
            name={name}
            placeholder={placeholder}
            value={processed}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            inputMode={inputMode}
            autoComplete={autoComplete}
            aria-label={ariaLabel}
            aria-invalid={!!errorMsg && touched}
            $invalid={!!errorMsg && touched}
          />
        ) : (
          <InputEl
            id={id}
            name={name}
            placeholder={placeholder}
            type={effectiveType}
            value={processed}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            inputMode={inputMode}
            autoComplete={autoComplete}
            aria-label={ariaLabel}
            aria-invalid={!!errorMsg && touched}
            $invalid={!!errorMsg && touched}
          />
        )}

        {isPasswordField && showPasswordToggle && (
          <EyeBtn
            type="button"
            aria-label={passwordToggleAriaLabel}
            aria-pressed={showPw}
            onMouseDown={(e) => e.preventDefault()} // keep focus in input
            onClick={() => setShowPw((s) => !s)}
            title={showPw ? "Hide password" : "Show password"}
          >
            {/* simple inline eye / eye-off icon */}
            {showPw ? (
              // eye-off
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.51 1.62-2.89 2.82-4.06M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .37 .88 -.85 1.7 -1.43 2.44" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              // eye
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </EyeBtn>
        )}
      </FieldShell>

      {(hasCounter || hasError) && (
        <FooterRow>
          {hasError ? (
            <ErrorText role="alert" aria-live="polite">
              {errorMsg}
            </ErrorText>
          ) : (
            <span />
          )}
          {hasCounter ? (
            <Counter>
              {processed.length}/{maxLength}
            </Counter>
          ) : null}
        </FooterRow>
      )}
    </Wrapper>
  );
}

/* =========================
   Example validators (optional)
   ========================= */
export const validateE164 = (s: string) => {
  if (!s) return null;
  return /^\+\d{8,15}$/.test(s)
    ? null
    : "Use international format like +14155552671 (8–15 digits).";
};

export const validateName = (s: string) => {
  if (!s) return null;
  if (s.length < 2) return "Name must be at least 2 characters.";
  return null;
};
