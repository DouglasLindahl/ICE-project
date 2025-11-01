"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import { NexaInput } from "@/components/NexaInput/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";
import { NexaPopup } from "@/components/NexaPopup/page";
import type { User } from "@supabase/supabase-js";
import { validatePwMatch, validatePwStrong } from "../utils";
import NexaLogo from "@/components/NexaLogo/page";

export function hasNoIdentities(user: User | null): boolean {
  return (
    !!user && Array.isArray(user.identities) && user.identities.length === 0
  );
}
// validators
const validateEmail = (s: string) => {
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Enter a valid email.";
};

const validateName = (s: string) => {
  if (!s) return null;
  return s.length >= 2 ? null : "Name must be at least 2 characters.";
};

// country-aware phone validator
type Country = {
  code: string;
  name: string;
  dial: string;
  trunkZero?: boolean;
};
const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial: "1" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "MX", name: "Mexico", dial: "52" },
  { code: "BR", name: "Brazil", dial: "55" },
  { code: "AR", name: "Argentina", dial: "54" },
  { code: "GB", name: "United Kingdom", dial: "44", trunkZero: true },
  { code: "IE", name: "Ireland", dial: "353", trunkZero: true },
  { code: "FR", name: "France", dial: "33", trunkZero: true },
  { code: "DE", name: "Germany", dial: "49", trunkZero: true },
  { code: "ES", name: "Spain", dial: "34", trunkZero: true },
  { code: "PT", name: "Portugal", dial: "351", trunkZero: true },
  { code: "IT", name: "Italy", dial: "39", trunkZero: true },
  { code: "NL", name: "Netherlands", dial: "31", trunkZero: true },
  { code: "BE", name: "Belgium", dial: "32" },
  { code: "SE", name: "Sweden", dial: "46" },
  { code: "NO", name: "Norway", dial: "47" },
  { code: "DK", name: "Denmark", dial: "45" },
  { code: "FI", name: "Finland", dial: "358", trunkZero: true },
  { code: "IS", name: "Iceland", dial: "354" },
  { code: "PL", name: "Poland", dial: "48", trunkZero: true },
  { code: "CZ", name: "Czechia", dial: "420" },
  { code: "AT", name: "Austria", dial: "43", trunkZero: true },
  { code: "CH", name: "Switzerland", dial: "41", trunkZero: true },
  { code: "HU", name: "Hungary", dial: "36", trunkZero: true },
  { code: "RO", name: "Romania", dial: "40", trunkZero: true },
  { code: "GR", name: "Greece", dial: "30", trunkZero: true },
  { code: "TR", name: "Türkiye", dial: "90", trunkZero: true },
  { code: "RU", name: "Russia", dial: "7" },
  { code: "UA", name: "Ukraine", dial: "380" },
  { code: "IL", name: "Israel", dial: "972", trunkZero: true },
  { code: "AE", name: "United Arab Emirates", dial: "971" },
  { code: "SA", name: "Saudi Arabia", dial: "966" },
  { code: "ZA", name: "South Africa", dial: "27", trunkZero: true },
  { code: "EG", name: "Egypt", dial: "20", trunkZero: true },
  { code: "AU", name: "Australia", dial: "61", trunkZero: true },
  { code: "NZ", name: "New Zealand", dial: "64", trunkZero: true },
  { code: "IN", name: "India", dial: "91", trunkZero: true },
  { code: "PK", name: "Pakistan", dial: "92" },
  { code: "BD", name: "Bangladesh", dial: "880", trunkZero: true },
  { code: "CN", name: "China", dial: "86" },
  { code: "JP", name: "Japan", dial: "81", trunkZero: true },
  { code: "KR", name: "South Korea", dial: "82", trunkZero: true },
  { code: "TW", name: "Taiwan", dial: "886", trunkZero: true },
  { code: "SG", name: "Singapore", dial: "65" },
  { code: "MY", name: "Malaysia", dial: "60", trunkZero: true },
  { code: "TH", name: "Thailand", dial: "66", trunkZero: true },
  { code: "PH", name: "Philippines", dial: "63" },
  { code: "VN", name: "Vietnam", dial: "84" },
  { code: "ID", name: "Indonesia", dial: "62" },
];

function cleanPlusDigits(s: string) {
  return s.replace(/[^\d+]/g, "");
}
function toE164WithCountry(
  raw: string,
  country: Country
): { ok: true; e164: string } | { ok: false; reason: string } {
  let v = cleanPlusDigits(raw).trim();
  if (v.startsWith("00")) v = "+" + v.slice(2);
  if (v.startsWith("+")) {
    if (/^\+\d{8,15}$/.test(v)) return { ok: true, e164: v };
    return {
      ok: false,
      reason: "Invalid international format (+ and 8–15 digits).",
    };
  }
  if (country.code === "US" && /^\d{10}$/.test(v))
    return { ok: true, e164: `+1${v}` };
  if (country.trunkZero && v.startsWith("0")) v = v.replace(/^0/, "");
  if (/^\d{6,15}$/.test(v)) return { ok: true, e164: `+${country.dial}${v}` };
  return {
    ok: false,
    reason:
      "Enter a valid number like +4612345678, 004612345678, or local digits with the correct country.",
  };
}
const validatePhoneByCountry = (v: string, c: Country) =>
  !v
    ? "Phone is required."
    : toE164WithCountry(v, c).ok
    ? null
    : "Invalid phone number.";

/* ============================
   Styles
   ============================ */
const Page = styled.div`
  background-color: ${theme.colors.background};
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Card = styled.div`
  background-color: ${theme.colors.card};
  padding: 24px;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Logo = styled.div`
  margin-top: 12px;
  margin-bottom: 24px;
  font-weight: bold;
  font-size: 24px;
`;
const H1 = styled.h1`
  font-size: 24px;
  font-weight: 100;
  text-align: center;
  padding-top: 12px;
`;
const Sub = styled.p`
  font-size: 16px;
  text-align: center;
  padding: 16px;
  margin: 0;
`;
const Field = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 100%;
  gap: 6px;
`;
const Label = styled.label`
  font-size: 12px;
`;
const SubmitBtn = styled.button<{ disabled?: boolean }>`
  width: 100%;
  background-color: ${theme.colors.accent};
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  border: none;
  font-weight: bold;
  margin-top: 16px;
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;
const LinkBtn = styled.button`
  background: none;
  border: none;
  color: gray;
  margin-top: 16px;
  margin-bottom: 16px;
  &:hover {
    cursor: pointer;
  }
`;
const HomeBtn = styled.button`
  width: 100%;
  background-color: ${theme.colors.background};
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid ${theme.colors.border};
  font-weight: bold;
  margin-top: 8px;
`;
const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;
const Row = styled.div`
  display: flex;
  align-items: start;
  width: 100%;
  gap: 12px;
`;
const CountryField = styled.div`
  position: relative;
  width: 100%;
  height: 36px;
`;
const DialDisplay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.inputBackground};
  border-radius: 6px;
  font-size: 14px;
  user-select: none;
`;
const HiddenSelect = styled.select`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const StyledTermsAndConditions = styled.div`
  text-align: center;
  font-size: 14px;
  padding: 12px;
`;

export default function Register() {
  const router = useRouter();
  const supa = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [addCountry, setAddCountry] = useState<Country>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // NEW: popup + overlay
  const [notice, setNotice] = useState<{
    open: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    actions?: {
      label: string;
      onClick: () => void;
      variant?: "primary" | "ghost";
    }[];
  }>({ open: false, type: "info", title: "", message: "" });

  const [overlay, setOverlay] = useState<{
    visible: boolean;
    message: string;
    subtext?: string;
  }>({ visible: false, message: "" });

  // pick default country by locale if possible
  useEffect(() => {
    try {
      const loc = Intl.DateTimeFormat().resolvedOptions().locale;
      const cc = loc.split("-")[1]?.toUpperCase();
      const match = COUNTRIES.find((c) => c.code === cc);
      if (match) setAddCountry(match);
    } catch {}
  }, []);

  // Optional: if user is already signed in, redirect with loader
  useEffect(() => {
    (async () => {
      setOverlay({ visible: true, message: "Checking session…" });
      const { data } = await supa.auth.getSession();
      if (data.session) {
        setOverlay({ visible: true, message: "Redirecting…" });
        router.push("/dashboard");
      } else {
        setOverlay({ visible: false, message: "" });
      }
    })();
  }, [router, supa]);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // you already collect these in the form:
    sessionStorage.setItem(
      "postSignupProfile",
      JSON.stringify({
        display_name: fullName,
        phone_number: phone,
        terms_version: "2025-03-01",
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      })
    );

    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    const pwErr = validatePwStrong(password);
    const matchErr = validatePwMatch(confirmPassword, password);
    const phoneErr = phone ? validatePhoneByCountry(phone, addCountry) : null;

    if (nameErr || emailErr || pwErr || matchErr || phoneErr) {
      setNotice({
        open: true,
        type: "error",
        title: "Fix the form",
        message:
          nameErr ||
          emailErr ||
          pwErr ||
          matchErr ||
          phoneErr ||
          "Please fix the errors above.",
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const TERMS_VERSION = "2025-03-01";

    setSubmitting(true);
    setOverlay({
      visible: true,
      message: "Creating your account…",
      subtext: "Sending confirmation email",
    });

    try {
      // Parse phone to E.164 if provided
      let phoneE164 = "";
      if (phone) {
        const parsed = toE164WithCountry(phone, addCountry);
        if (!parsed.ok) {
          setNotice({
            open: true,
            type: "error",
            title: "Invalid phone",
            message: parsed.reason,
          });
          return;
        }
        phoneE164 = parsed.e164;
      }

      // Store what you want to apply after verification (in callback step)
      sessionStorage.setItem(
        "postSignupProfile",
        JSON.stringify({
          display_name: fullName || "",
          phone_number: phoneE164 || "",
          terms_version: TERMS_VERSION,
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
        })
      );

      const redirectTo = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/callback`
        : `${window.location.origin}/callback`;

      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "signup", // or "invite" if you keep signups disabled
          email,
          password, // REQUIRED for "signup"
          name: fullName,
          phone: phone,
          redirectTo,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to send confirmation email");
      }

      // Tell the user to check inbox; session won’t exist until they click the link
      setNotice({
        open: true,
        type: "success",
        title: "Check your email",
        message:
          "We sent you a confirmation link. Click it to finish creating your account.",
        actions: [
          {
            label: "Open Mail App",
            onClick: () => (window.location.href = "mailto:"),
            variant: "primary",
          },
        ],
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setNotice({
        open: true,
        type: "error",
        title: "Registration failed",
        message,
      });
    } finally {
      setSubmitting(false);
      setOverlay({ visible: false, message: "" });
    }
  }

  const disabled =
    submitting ||
    !!validateName(fullName) ||
    !!validateEmail(email) ||
    !!validatePwStrong(password) ||
    !!validatePwMatch(confirmPassword, password) ||
    !!validatePhoneByCountry(phone, addCountry);

  return (
    <>
      {overlay.visible && (
        <LoadingScreen message={overlay.message} subtext={overlay.subtext} />
      )}

      <Page aria-busy={overlay.visible}>
        {notice.open && (
          <NexaPopup
            open={notice.open}
            type={notice.type}
            title={notice.title}
            message={notice.message}
            actions={notice.actions}
            onClose={() => setNotice((n) => ({ ...n, open: false }))}
          />
        )}

        <Card>
          <NexaLogo mode="dark"></NexaLogo>
          <H1>Set up your safety circle</H1>
          <Sub>Create your contact profile in just a few steps</Sub>

          <Form onSubmit={handleRegister}>
            <Field>
              <Label htmlFor="fullName">Full Name</Label>
              <NexaInput
                id="fullName"
                name="full_name"
                ariaLabel="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={setFullName}
                preset="name"
                maxLength={60}
                validate={validateName}
                showValidity
                showCounter={false}
                disabled={submitting || overlay.visible}
              />
            </Field>

            <Field>
              <Label htmlFor="phone">Phone Number</Label>
              <Row>
                <div style={{ width: "10%" }}>
                  <CountryField>
                    <DialDisplay
                      aria-hidden
                    >{`+${addCountry.dial}`}</DialDisplay>
                    <HiddenSelect
                      id="country"
                      value={addCountry.code}
                      onChange={(e) => {
                        const next = COUNTRIES.find(
                          (c) => c.code === e.target.value
                        )!;
                        setAddCountry(next);
                      }}
                      aria-label="Select country"
                      disabled={submitting || overlay.visible}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} (+{c.dial})
                        </option>
                      ))}
                    </HiddenSelect>
                  </CountryField>
                </div>

                <div style={{ width: "90%" }}>
                  <NexaInput
                    id="phone"
                    name="phone"
                    preset="e164"
                    ariaLabel="Phone Number"
                    placeholder="(123) 456-7890"
                    value={phone}
                    onChange={setPhone}
                    inputMode="tel"
                    maxLength={22}
                    blockEmoji
                    validate={(v) => validatePhoneByCountry(v, addCountry)}
                    showCounter={false}
                    showValidity
                    disabled={submitting || overlay.visible}
                  />
                </div>
              </Row>
            </Field>

            <Field>
              <Label htmlFor="email">Email</Label>
              <NexaInput
                id="email"
                name="email"
                ariaLabel="Email"
                placeholder="Enter your email"
                value={email}
                onChange={setEmail}
                inputMode="email"
                autoComplete="email"
                validate={validateEmail}
                showCounter={false}
                showValidity
                disabled={submitting || overlay.visible}
              />
            </Field>

            <Field>
              <Label htmlFor="password">Password</Label>
              <NexaInput
                id="password"
                name="password"
                ariaLabel="Password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                validate={validatePwStrong}
                showCounter={false}
                showValidity
                disabled={submitting || overlay.visible}
              />
            </Field>

            <Field>
              <Label htmlFor="confirmPassword">Repeat password</Label>
              <NexaInput
                id="confirmPassword"
                name="confirm_password"
                ariaLabel="Repeat password"
                placeholder="Repeat your password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                validate={(s) => validatePwMatch(s, password)}
                showCounter={false}
                showValidity
                disabled={submitting || overlay.visible}
              />
            </Field>

            <SubmitBtn type="submit" disabled={disabled || overlay.visible}>
              {overlay.visible
                ? "Working…"
                : submitting
                ? "Creating..."
                : "Create account"}
            </SubmitBtn>
          </Form>

          <StyledTermsAndConditions>
            <p>By proceeding, you agree to the </p>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              Terms & Conditions
            </a>
            {" and "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>
          </StyledTermsAndConditions>

          <LinkBtn onClick={() => router.push("/login")} type="button">
            Already have an account? Sign in
          </LinkBtn>

          <HomeBtn onClick={() => router.push("/")} type="button">
            Back to home
          </HomeBtn>
        </Card>
      </Page>
    </>
  );
}
