"use client";

import { useState, useRef, useMemo, FormEvent } from "react";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { NexaInput, validateName } from "@/components/NexaInput/page";
import { NexaButton } from "@/components/NexaButton/page";
import { NexaPopup } from "@/components/NexaPopup/page";

interface ContactFormProps {
  className?: string;
}

type NoticeType = "success" | "warning" | "error" | "info";
interface PopupState {
  open: boolean;
  type: NoticeType;
  title: string;
  message: string;
}

type Payload = { name: string; email: string; message: string };
interface ContactResponse {
  ok?: boolean;
  error?: string;
}

const Panel = styled.section`
  width: 100%;
  background-color: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 24px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

const Title = styled.h2`
  font-weight: 400;
  margin: 0 0 4px 0;
  font-size: 20px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const Description = styled.p`
  margin: 0 0 16px 0;
  font-size: 13px;
  opacity: 0.8;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Hidden = styled.div`
  display: none;
`;

// Client-side validation to match API rules
function validateClient(
  name: string,
  email: string,
  message: string
):
  | { ok: true; data: Payload }
  | {
      ok: false;
      field: "name" | "email" | "message";
      title: string;
      msg: string;
    } {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (trimmedName.length < 2) {
    return {
      ok: false,
      field: "name",
      title: "Name too short",
      msg: "Please enter at least 2 characters.",
    };
  }
  if (!emailRegex.test(trimmedEmail)) {
    return {
      ok: false,
      field: "email",
      title: "Invalid email",
      msg: "Enter a valid email address (e.g., you@example.com).",
    };
  }
  if (trimmedMessage.length < 5) {
    return {
      ok: false,
      field: "message",
      title: "Message too short",
      msg: "Please write at least 5 characters.",
    };
  }
  return {
    ok: true,
    data: { name: trimmedName, email: trimmedEmail, message: trimmedMessage },
  };
}

// Local type matching NexaPopup's Action (structural typing)
type PopupAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function ContactForm({ className = "" }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [popup, setPopup] = useState<PopupState>({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  // Keep last valid payload so Retry can resend
  const lastPayloadRef = useRef<Payload | null>(null);

  // Refs to focus fields from popup
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  const closePopup = () => setPopup((p) => ({ ...p, open: false }));

  async function send(payload: Payload) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json: ContactResponse = {};
      try {
        json = await res.json();
      } catch {
        // non-JSON response — ignore
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }

      setPopup({
        open: true,
        type: "success",
        title: "Message sent",
        message:
          "We received your message and will reply from support@nexaqr.com.",
      });
      setName("");
      setEmail("");
      setMessage("");
      lastPayloadRef.current = null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error.";
      setPopup({
        open: true,
        type: "error",
        title: "Unable to send",
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot
    const company =
      (new FormData(e.currentTarget).get("company") as string | null)?.trim() ??
      "";
    if (company) {
      setPopup({
        open: true,
        type: "success",
        title: "Received",
        message: "Thanks! We'll get back to you soon.",
      });
      setName("");
      setEmail("");
      setMessage("");
      return;
    }

    const v = validateClient(name, email, message);
    if (!v.ok) {
      setPopup({
        open: true,
        type: "warning",
        title: v.title,
        message: v.msg,
      });
      // focus after popup paints
      setTimeout(() => {
        if (v.field === "name") nameRef.current?.focus();
        else if (v.field === "email") emailRef.current?.focus();
        else messageRef.current?.focus();
      }, 0);
      return;
    }

    lastPayloadRef.current = v.data;
    await send(v.data);
  }

  const popupActions: PopupAction[] = useMemo(() => {
    if (!popup.open) return [];

    if (popup.type === "warning") {
      return [
        {
          label: "Continue editing",
          onClick: closePopup,
          variant: "ghost" as const,
          autoFocus: true,
        },
      ];
    }

    if (popup.type === "error") {
      return [
        { label: "Cancel", onClick: closePopup, variant: "ghost" as const },
        {
          label: "Retry",
          onClick: () => {
            closePopup();
            if (lastPayloadRef.current) void send(lastPayloadRef.current);
          },
          autoFocus: true,
        },
      ];
    }

    // success / info
    return [{ label: "Close", onClick: closePopup, autoFocus: true }];
  }, [popup.open, popup.type]);

  return (
    <Panel className={className}>
      <Title>Contact NexaQR</Title>
      <Description>
        Have a question, feedback, or a partnership idea? Send us a note and
        we’ll reply from support@nexaqr.com.
      </Description>

      <Form onSubmit={onSubmit}>
        <NexaInput
          id="name"
          ariaLabel="Your name"
          placeholder="Your name"
          value={name}
          onChange={setName}
          preset="name"
          maxLength={60}
          validate={validateName}
          autoComplete="name"
          showCounter={false}
        />

        <NexaInput
          id="email"
          ariaLabel="Your email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          type="email"
          maxLength={320}
          autoComplete="email"
          showCounter={false}
        />

        <NexaInput
          id="message"
          ariaLabel="Message"
          placeholder="Tell us a bit about what you need…"
          value={message}
          onChange={setMessage}
          preset="none"
          multiline
          maxLength={5000}
          validate={(v) =>
            v && v.trim().length >= 5
              ? null
              : "Please write at least 5 characters."
          }
          showCounter
        />

        {/* Honeypot */}
        <Hidden aria-hidden>
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </Hidden>

        <ButtonRow>
          <NexaButton type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </NexaButton>
        </ButtonRow>
      </Form>

      <NexaPopup
        open={popup.open}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        actions={popupActions}
        disableBackdropClose={popup.type === "error"}
      />
    </Panel>
  );
}
