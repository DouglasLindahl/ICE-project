"use client";
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { theme } from "../../../styles/theme";

type Preset =
  | "none"
  | "alphanumeric"
  | "numeric"
  | "e164" // digits with a single optional leading +
  | "name"; // letters, spaces, basic punctuation

type RestrictedInputProps = {
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;

  // Behavior
  preset?: Preset;
  maxLength?: number;
  blockEmoji?: boolean;
  trim?: "none" | "start" | "end" | "both";
  transform?: (v: string) => string; // e.g., v => v.toUpperCase()
  validate?: (v: string) => string | null; // return error message or null

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

  // Accessibility
  id?: string;
};

const Wrapper = styled.div`
  display: grid;
  gap: 6px;
`;

const InputEl = styled.input<{ $invalid: boolean }>`
  padding: 10px;
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

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
  min-height: 1em;
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

function applyTrim(s: string, mode: RestrictedInputProps["trim"]) {
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
      // allow digits and at most one leading '+'
      let s = raw.replace(/[^\d+]+/g, "");
      // remove all '+' then re-add only if first char was '+'
      const hadLeadingPlus = s.startsWith("+");
      s = s.replace(/\+/g, "");
      return hadLeadingPlus ? `+${s}` : s;
    }
    case "name":
      // letters, spaces, hyphen, apostrophe, period
      return raw.replace(/[^a-zA-Z \-'.]+/g, "");
    case "none":
    default:
      return raw;
  }
}

/* =========================
   Component
   ========================= */

export function RestrictedInput({
  value,
  onChange,
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
}: RestrictedInputProps) {
  const [touched, setTouched] = useState(false);

  const processed = useMemo(() => {
    let v = value ?? "";

    // 1) optional emoji stripping
    if (blockEmoji) v = stripEmoji(v);

    // 2) preset filtering
    v = presetFilter(preset, v);

    // 3) optional transform (e.g., uppercase)
    if (transform) v = transform(v);

    // 4) optional trimming
    v = applyTrim(v, trim);

    // 5) enforce maxLength as a hard ceiling
    if (typeof maxLength === "number" && maxLength >= 0) {
      v = v.slice(0, maxLength);
    }
    return v;
  }, [value, preset, blockEmoji, transform, trim, maxLength]);

  // compute validation message
  const errorMsg = useMemo(() => {
    if (!showValidity) return null;
    if (!validate) return null;
    return validate(processed);
  }, [processed, validate, showValidity]);

  // If our processing changed the value, push it up
  // (keeps parent state always "legal")
  React.useEffect(() => {
    if (processed !== value) onChange(processed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processed]);

  return (
    <Wrapper className={className}>
      <InputEl
        id={id}
        name={name}
        placeholder={placeholder}
        type={type}
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

      {(showCounter || showValidity) && (
        <FooterRow>
          <ErrorText role="alert" aria-live="polite">
            {touched ? errorMsg : ""}
          </ErrorText>
          {showCounter && typeof maxLength === "number" ? (
            <Counter>
              {processed.length}/{maxLength}
            </Counter>
          ) : (
            <span />
          )}
        </FooterRow>
      )}
    </Wrapper>
  );
}

/* =========================
   Example validators (optional)
   ========================= */

// Phone E.164 validator (use with preset="e164")
export const validateE164 = (s: string) => {
  if (!s) return null;
  return /^\+\d{8,15}$/.test(s)
    ? null
    : "Use international format like +14155552671 (8–15 digits).";
};

// Name validator (use with preset="name")
export const validateName = (s: string) => {
  if (!s) return null;
  if (s.length < 2) return "Name must be at least 2 characters.";
  return null;
};
