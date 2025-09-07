"use client";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";

/* ============================
   Country data & phone helpers
   ============================ */
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
  { code: "BE", name: "Belgium", dial: "32", trunkZero: true },
  { code: "SE", name: "Sweden", dial: "46", trunkZero: true },
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
  { code: "PK", name: "Pakistan", dial: "92", trunkZero: true },
  { code: "BD", name: "Bangladesh", dial: "880", trunkZero: true },
  { code: "CN", name: "China", dial: "86" },
  { code: "JP", name: "Japan", dial: "81", trunkZero: true },
  { code: "KR", name: "South Korea", dial: "82", trunkZero: true },
  { code: "TW", name: "Taiwan", dial: "886", trunkZero: true },
  { code: "SG", name: "Singapore", dial: "65" },
  { code: "MY", name: "Malaysia", dial: "60", trunkZero: true },
  { code: "TH", name: "Thailand", dial: "66", trunkZero: true },
  { code: "PH", name: "Philippines", dial: "63", trunkZero: true },
  { code: "VN", name: "Vietnam", dial: "84", trunkZero: true },
  { code: "ID", name: "Indonesia", dial: "62", trunkZero: true },
];

function cleanPlusDigits(s: string) {
  return s.replace(/[^\d+]/g, "");
}

function toE164WithCountry(
  raw: string,
  country: Country
): { ok: true; e164: string } | { ok: false; reason: string } {
  let v = cleanPlusDigits(raw).trim();

  // 00… => +…
  if (v.startsWith("00")) v = "+" + v.slice(2);

  // already international?
  if (v.startsWith("+")) {
    if (/^\+\d{8,15}$/.test(v)) return { ok: true, e164: v };
    return {
      ok: false,
      reason: "Invalid international format (+ and 8–15 digits).",
    };
  }

  // US convenience: 10 digits → +1…
  if (country.code === "US" && /^\d{10}$/.test(v)) {
    return { ok: true, e164: `+1${v}` };
  }

  // strip trunk zero for countries that use it
  if (country.trunkZero && v.startsWith("0")) v = v.replace(/^0/, "");

  if (/^\d{6,15}$/.test(v)) {
    return { ok: true, e164: `+${country.dial}${v}` };
  }

  return {
    ok: false,
    reason:
      "Enter a valid number like +4612345678, 004612345678, or local digits with the correct country.",
  };
}

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

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: none;
  background-color: ${theme.colors.inputBackground};
  font-size: 14px;
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

const ErrorMsg = styled.div`
  width: 100%;
  margin-top: 12px;
  color: #b00020;
  font-size: 12px;
`;

const InfoMsg = styled.div`
  width: 100%;
  margin-top: 12px;
  color: #0a2540;
  font-size: 12px;
  opacity: 0.9;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

/* layout for country + phone: 10% / 90% */
const Row = styled.div`
  display: grid;
  display: flex;
  justify-content: start;
  align-items: center;
  width: 100%;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/* Fake-looking dial display that still uses a real <select> */
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
  opacity: 0; /* invisible but clickable */
  cursor: pointer;
`;

/* ============================
   Component
   ============================ */
export default function Register() {
  const router = useRouter();
  const supa = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // country + phone
  const [addCountry, setAddCountry] = useState<Country>(COUNTRIES[0]);
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // pick default country by locale if possible
  useEffect(() => {
    try {
      const loc = Intl.DateTimeFormat().resolvedOptions().locale; // e.g., en-US
      const cc = loc.split("-")[1]?.toUpperCase();
      const match = COUNTRIES.find((c) => c.code === cc);
      if (match) setAddCountry(match);
    } catch {}
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      // normalize phone to +E.164 using selected country
      let phoneE164 = "";
      if (phone) {
        const parsed = toE164WithCountry(phone, addCountry);
        if (!parsed.ok) {
          setErrorMsg(parsed.reason);
          setSubmitting(false);
          return;
        }
        phoneE164 = parsed.e164;
      }

      const { data, error } = await supa.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName || "",
            phone_number: phoneE164 || "",
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
            : undefined,
        },
      });

      if (error) {
        if (/already registered/i.test(error.message)) {
          setErrorMsg("That email is already in use. Try signing in instead.");
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      // Supabase "already in use" signal: identities = []
      if (data?.user && Array.isArray((data.user as any).identities)) {
        const identities = (data.user as any).identities as any[];
        if (identities.length === 0) {
          setErrorMsg("That email is already in use. Try signing in instead.");
          return;
        }
      }

      const { data: sessionCheck } = await supa.auth.getSession();
      if (sessionCheck.session) {
        router.push("/dashboard");
      } else {
        setInfoMsg(
          "Check your email to confirm your account. If this email was already registered but unconfirmed, we re-sent the confirmation link."
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page>
      <Card>
        <Logo>Beacon</Logo>
        <H1>Set up your safety circle</H1>
        <Sub>Create your emergency contact profile in just a few steps</Sub>

        <Form onSubmit={handleRegister}>
          <Field>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={60}
            />
          </Field>

          <Field>
            <Label htmlFor="phone">Phone Number</Label>
            <Row>
              <div style={{ width: "10%" }}>
                <CountryField>
                  <DialDisplay aria-hidden>{`+${addCountry.dial}`}</DialDisplay>
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
                <Input
                  id="phone"
                  style={{ width: "100%" }}
                  placeholder="(123) 456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => {
                    const p = toE164WithCountry(phone, addCountry);
                    if (p.ok) setPhone(p.e164);
                  }}
                  inputMode="tel"
                  maxLength={22}
                  pattern="[\d\+\-\s\(\)]*"
                  required
                />
              </div>
            </Row>
          </Field>

          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>

          {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
          {infoMsg && <InfoMsg>{infoMsg}</InfoMsg>}

          <SubmitBtn type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </SubmitBtn>
        </Form>

        <LinkBtn onClick={() => router.push("/login")} type="button">
          Already have an account? Sign in
        </LinkBtn>

        <HomeBtn onClick={() => router.push("/")} type="button">
          Back to home
        </HomeBtn>
      </Card>
    </Page>
  );
}
