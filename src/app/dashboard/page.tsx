"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { QrCanvas } from "@/components/QrCanvas";
import { generateToken } from "@/utils/token";

/* ============================
   Country data & phone helpers
   ============================ */
type Country = {
  code: string;
  name: string;
  dial: string;
  trunkZero?: boolean;
};

// A compact, sensible set. Add more anytime.
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

// Very light detection just to pre-select in Edit modal
function detectCountryFromE164(phone: string): Country | null {
  if (!phone.startsWith("+")) return null;
  const digits = phone.slice(1);
  // match longest dial code
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) return c;
  }
  return null;
}

function toE164WithCountry(
  raw: string,
  country: Country
): { ok: true; e164: string } | { ok: false; reason: string } {
  let v = cleanPlusDigits(raw).trim();

  // 00… → +
  if (v.startsWith("00")) v = "+" + v.slice(2);

  // Already international?
  if (v.startsWith("+")) {
    if (/^\+\d{8,15}$/.test(v)) return { ok: true, e164: v };
    return {
      ok: false,
      reason: "Invalid E.164 format (use + and digits only, 8–15 digits)",
    };
  }

  // US convenience: exactly 10 digits → +1…
  if (country.code === "US" && /^\d{10}$/.test(v)) {
    return { ok: true, e164: `+1${v}` };
  }

  // If country uses trunk '0', drop one leading '0' (e.g., 070… in SE → +46 70…)
  if (country.trunkZero && v.startsWith("0")) v = v.replace(/^0/, "");

  // If it's purely digits and within reasonable length, prefix selected dial code
  if (/^\d{6,15}$/.test(v)) {
    return { ok: true, e164: `+${country.dial}${v}` };
  }

  return {
    ok: false,
    reason:
      "Enter a valid number. Example: +4612345678, 004612345678, or local digits with correct country selected.",
  };
}

/* ============================
   Types & styled components
   ============================ */
type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

const StyledDashboardPage = styled.div`
  position: relative;
  background-color: ${theme.colors.background};
  min-height: 100vh;
`;

const StyledDashboardHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 128px;
  background-color: ${theme.colors.card};
  border-bottom: 1px solid ${theme.colors.border};

  @media (max-width: 900px) {
    padding: 12px 16px;
  }
`;

const StyledDashboardHeaderLogo = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const StyledDashboardHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;

  @media (max-width: 480px) {
    gap: 8px;
    font-size: 12px;
  }
`;

const StyledDashboardHeaderSignOutButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  min-width: 44px;
  &:hover {
    cursor: pointer;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 12px;
  }
`;

const StyledDashboardInfoSection = styled.section`
  display: flex;
  justify-content: center;
  align-items: start;
  gap: 32px;
  padding: 32px 128px;

  @media (max-width: 1100px) {
    padding: 24px 24px;
    gap: 24px;
  }
  @media (max-width: 900px) {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
  }
`;

const PanelBase = styled.section`
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

const StyledDashboardContactsSection = styled(PanelBase)``;

const StyledDashboardContactsSectionHeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;

  @media (max-width: 480px) {
    padding-bottom: 16px;
  }
`;

const StyledDashboardContactsSectionHeader = styled.h2`
  font-weight: 400;
  margin: 0;
  font-size: 20px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const StyledDashboardContactsSectionAddContactButton = styled.button`
  padding: 8px 12px;
  background-color: ${theme.colors.accent};
  border: none;
  border-radius: 10px;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 12px;
    padding: 6px 10px;
  }
`;

const StyledDashboardContactsSectionContactCardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledDashboardContactsSectionContactCard = styled.div`
  background-color: ${theme.colors.background};
  width: 100%;
  padding: 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};

  @media (max-width: 480px) {
    grid-template-columns: 1fr auto;
    row-gap: 10px;
  }
`;

const StyledDashboardContactsSectionContactCardIcon = styled.img`
  width: 30px;
  height: 30px;

  @media (max-width: 480px) {
    display: none;
  }
`;

const StyledDashboardContactsSectionContactCardInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledDashboardContactsSectionContactCardButtonSection = styled.div`
  display: inline-flex;
  gap: 6px;

  @media (max-width: 480px) {
    grid-column: 2 / 3;
    justify-self: end;
  }
`;

const StyledDashboardContactsSectionContactCardName = styled.p`
  font-size: 16px;
  font-weight: bold;
  margin: 0;
`;

const StyledDashboardContactsSectionContactCardNumber = styled.p`
  font-size: 14px;
  margin: 0;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 8px;
  &:hover {
    cursor: pointer;
    background: ${theme.colors.inputBackground};
  }
  img {
    width: 20px;
    height: 20px;
  }
`;

const StyledDashboardQRCodeSection = styled(PanelBase)`
  @media (max-width: 900px) {
    order: -1; /* show QR first on small screens */
  }
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StyledDashboardQRCodeSectionHeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledDashboardQRCodeSectionHeader = styled.h2`
  font-weight: 400;
  margin: 0;
  font-size: 20px;
`;

const StyledDashboardQRCodeSectionQRCodeImageSection = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledDashboardQRCodeSectionQRCodeTextSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
`;

const StyledDashboardQRCodeSectionSubHeader = styled.h3`
  font-size: 16px;
  margin: 0;
`;

const StyledDashboardQRCodeSectionSubText = styled.p`
  font-size: 12px;
  margin: 0;
`;

const StyledDashboardQRCodeSectionQRCodeButtonsSection = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 24px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const ButtonWithIcon = styled.button`
  width: 100%;
  border-radius: 10px;
  padding: 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
`;

const StyledDashboardQRCodeSectionQRCodeDownloadButton = styled(ButtonWithIcon)`
  border: none;
  background-color: ${theme.colors.accent};
`;

const StyledDashboardQRCodeSectionQRCodeShareButton = styled(ButtonWithIcon)`
  border: 1px solid ${theme.colors.border};
  background-color: ${theme.colors.background};
`;

const StyledDashboardQRCodeSectionQRCodeDisclaimer = styled.p`
  text-align: center;
  font-size: 12px;
  background: rgba(255, 183, 3, 0.12);
  padding: 8px;
  border-radius: 10px;
  margin: 0;
`;

/* ===== Modal / Popup base ===== */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
`;

const Modal = styled.div`
  background-color: ${theme.colors.card};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(520px, 92vw);
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  padding: 4px;
  border-radius: 8px;
  &:hover {
    cursor: pointer;
    background: ${theme.colors.inputBackground};
  }
  img {
    width: 20px;
    height: 20px;
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 12px;
`;

const Input = styled.input`
  padding: 10px;
  background-color: ${theme.colors.inputBackground};
  border-radius: 10px;
  border: none;
  font-size: 14px;
`;

// --- replace your existing Row + Select with these ---

const Row = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 12px;
`;

/* A wrapper that lets us keep the native select (so the dropdown looks the same),
   but visually show only “+dial” as the button label. */
const CountryField = styled.div`
  position: relative;
  height: 40px; /* matches Input height (10px padding + 14px font roughly) */
`;

/* Shows the +dial text as the visible “button” */
const DialDisplay = styled.button`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: ${theme.colors.inputBackground};
  border: none;
  font-size: 14px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* clicks go to the select overlay */
`;

/* Native select sits on top (transparent), so clicking opens the normal menu */
const HiddenSelect = styled.select`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0; /* invisible but fully interactive */
  appearance: auto; /* keep native platform look for the dropdown */
  cursor: pointer;
`;

const Select = styled.select`
  padding: 10px;
  background-color: ${theme.colors.inputBackground};
  border-radius: 10px;
  border: none;
  font-size: 14px;
`;

const Submit = styled.button`
  font-size: 14px;
  border-radius: 10px;
  padding: 10px;
  margin-top: 6px;
  background-color: ${theme.colors.accent};
  border: none;

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
`;

/* ===== Delete modal specific ===== */
const DangerBar = styled.div`
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.25);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
`;

const ModalActionsRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const SecondaryBtn = styled.button`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  font-size: 14px;
`;

const DangerBtn = styled.button`
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: #ef4444;
  color: white;
  font-size: 14px;
`;

/* ============================
   Component
   ============================ */
export default function DashboardPage() {
  const router = useRouter();
  const supa = createClient();

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Add Contact modal state
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [addCountry, setAddCountry] = useState<Country>(COUNTRIES[0]); // default US (change if you prefer)
  const [submitting, setSubmitting] = useState(false);

  // Edit Contact modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCountry, setEditCountry] = useState<Country>(COUNTRIES[0]);

  // Delete Contact modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  // QR state
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // (Optional) pick default by browser locale
  useEffect(() => {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. en-US
      const countryPart = locale.split("-")[1]?.toUpperCase();
      const match = COUNTRIES.find((c) => c.code === countryPart);
      if (match) setAddCountry(match);
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      const { data: sessionData } = await supa.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!mounted) return;

      setEmail(user.email ?? null);
      setUserId(user.id);

      // load contacts
      const { data: rows } = await supa
        .from("contacts")
        .select("id,name,relationship,phone_e164,priority")
        .order("priority", { ascending: true });
      if (!mounted) return;
      setContacts(rows ?? []);

      // ensure public link (token) and build URL
      const t = await ensurePublicLink(user.id);
      if (!mounted) return;
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setPublicUrl(`${origin}/qr/${t}`);

      // auth listener
      const { data: sub } = supa.auth.onAuthStateChange((_e, session) => {
        if (!session) router.replace("/login");
      });
      unsub = sub.subscription;

      setLoading(false);
    })();

    return () => {
      mounted = false;
      unsub?.unsubscribe?.();
    };
  }, [router, supa]);

  async function ensurePublicLink(userId: string) {
    const { data: existing } = await supa
      .from("public_pages")
      .select("token,is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.token && existing.is_active) return existing.token;

    const newToken = generateToken();
    const { error } = await supa.from("public_pages").upsert({
      user_id: userId,
      token: newToken,
      is_active: true,
      last_rotated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return newToken;
  }

  /* ========== CREATE ========== */
  async function addContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !phone || !userId) return;
    setSubmitting(true);
    try {
      const parsed = toE164WithCountry(phone, addCountry);
      if (!parsed.ok) {
        alert(parsed.reason);
        setSubmitting(false);
        return;
      }
      const phone_e164 = parsed.e164;
      const priority = (contacts?.length ?? 0) + 1;

      const { error } = await supa.from("contacts").insert([
        {
          user_id: userId,
          name,
          relationship: relationship || null,
          phone_e164,
          priority,
        },
      ]);
      if (error) throw error;

      const { data: rows } = await supa
        .from("contacts")
        .select("id,name,relationship,phone_e164,priority")
        .order("priority", { ascending: true });
      setContacts(rows ?? []);
      setShowAdd(false);
      setName("");
      setRelationship("");
      setPhone("");
    } catch (err) {
      console.error(err);
      alert("Could not add contact. Please check the number and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ========== DELETE ========== */
  function openDelete(c: Contact) {
    setDeleteTarget(c);
    setShowDelete(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      setContacts((cs) => cs.filter((x) => x.id !== deleteTarget.id));
      const { error } = await supa
        .from("contacts")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;

      const { data: rows } = await supa
        .from("contacts")
        .select("id,name,relationship,phone_e164,priority")
        .order("priority", { ascending: true });
      setContacts(rows ?? []);
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  /* ========== EDIT ========== */
  function openEdit(c: Contact) {
    setEditId(c.id);
    setEditName(c.name);
    setEditRelationship(c.relationship ?? "");
    setEditPhone(c.phone_e164);

    const guess = detectCountryFromE164(c.phone_e164);
    setEditCountry(guess ?? COUNTRIES[0]);

    setShowEdit(true);
  }

  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editId) return;
    try {
      const parsed = toE164WithCountry(editPhone, editCountry);
      if (!parsed.ok) {
        alert(parsed.reason);
        return;
      }
      const phone_e164 = parsed.e164;

      const { error } = await supa
        .from("contacts")
        .update({
          name: editName,
          relationship: editRelationship || null,
          phone_e164,
        })
        .eq("id", editId);
      if (error) throw error;

      setContacts((cs) =>
        cs.map((c) =>
          c.id === editId
            ? {
                ...c,
                name: editName,
                relationship: editRelationship || null,
                phone_e164,
              }
            : c
        )
      );
      setShowEdit(false);
      setEditId(null);
    } catch (err) {
      console.error(err);
      alert("Update failed. Please check the number and try again.");
    }
  }

  /* ========== ESC to close modals ========== */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showAdd) setShowAdd(false);
      if (showEdit) setShowEdit(false);
      if (showDelete) setShowDelete(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd, showEdit, showDelete]);

  if (loading) {
    return (
      <main style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
        Loading…
      </main>
    );
  }

  return (
    <StyledDashboardPage>
      <StyledDashboardHeader>
        <StyledDashboardHeaderLogo>Beacon</StyledDashboardHeaderLogo>
        <StyledDashboardHeaderRight>
          <span>{email}</span>
          <StyledDashboardHeaderSignOutButton
            onClick={async () => {
              await supa.auth.signOut();
              router.replace("/login");
            }}
          >
            Sign Out
          </StyledDashboardHeaderSignOutButton>
        </StyledDashboardHeaderRight>
      </StyledDashboardHeader>

      <StyledDashboardInfoSection>
        {/* Contacts */}
        <StyledDashboardContactsSection>
          <StyledDashboardContactsSectionHeaderSection>
            <StyledDashboardContactsSectionHeader>
              Emergency Contacts
            </StyledDashboardContactsSectionHeader>
            <StyledDashboardContactsSectionAddContactButton
              onClick={() => setShowAdd(true)}
            >
              + Add Contact
            </StyledDashboardContactsSectionAddContactButton>
          </StyledDashboardContactsSectionHeaderSection>

          <StyledDashboardContactsSectionContactCardSection>
            {contacts.length === 0 && (
              <p style={{ opacity: 0.7, margin: 0 }}>No contacts yet.</p>
            )}

            {contacts.map((c) => (
              <StyledDashboardContactsSectionContactCard key={c.id}>
                <StyledDashboardContactsSectionContactCardIcon
                  src="/telephone.png"
                  alt=""
                />
                <StyledDashboardContactsSectionContactCardInfoSection>
                  <StyledDashboardContactsSectionContactCardName>
                    {c.name} ({c.relationship || "Contact"})
                  </StyledDashboardContactsSectionContactCardName>
                  <StyledDashboardContactsSectionContactCardNumber>
                    {c.phone_e164}
                  </StyledDashboardContactsSectionContactCardNumber>
                </StyledDashboardContactsSectionContactCardInfoSection>

                <StyledDashboardContactsSectionContactCardButtonSection>
                  <IconButton
                    onClick={() => openEdit(c)}
                    aria-label="Edit contact"
                  >
                    <img src="/edit.png" alt="Edit" />
                  </IconButton>
                  <IconButton
                    onClick={() => openDelete(c)}
                    aria-label="Delete contact"
                  >
                    <img src="/delete.png" alt="Delete" />
                  </IconButton>
                </StyledDashboardContactsSectionContactCardButtonSection>
              </StyledDashboardContactsSectionContactCard>
            ))}
          </StyledDashboardContactsSectionContactCardSection>
        </StyledDashboardContactsSection>

        {/* QR section */}
        <StyledDashboardQRCodeSection>
          <StyledDashboardQRCodeSectionHeaderSection>
            <StyledDashboardQRCodeSectionHeader>
              Your Emergency QR Code
            </StyledDashboardQRCodeSectionHeader>
          </StyledDashboardQRCodeSectionHeaderSection>

          {publicUrl ? (
            <StyledDashboardQRCodeSectionQRCodeImageSection>
              <QrCanvas text={publicUrl} />
            </StyledDashboardQRCodeSectionQRCodeImageSection>
          ) : (
            <p>Loading QR…</p>
          )}

          <StyledDashboardQRCodeSectionQRCodeTextSection>
            <StyledDashboardQRCodeSectionSubHeader>
              Scan to access emergency contacts
            </StyledDashboardQRCodeSectionSubHeader>
            <StyledDashboardQRCodeSectionSubText>
              Anyone can scan this code to see your emergency contact
              information you chose to share.
            </StyledDashboardQRCodeSectionSubText>
          </StyledDashboardQRCodeSectionQRCodeTextSection>

          <StyledDashboardQRCodeSectionQRCodeButtonsSection>
            <StyledDashboardQRCodeSectionQRCodeDownloadButton
              onClick={() => {
                const canvas = document.querySelector(
                  "canvas"
                ) as HTMLCanvasElement | null;
                if (!canvas) return;
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "beacon-qr.png";
                link.click();
              }}
            >
              <img src="/download.png" alt="" width={16} height={16} />
              Download
            </StyledDashboardQRCodeSectionQRCodeDownloadButton>

            <StyledDashboardQRCodeSectionQRCodeShareButton
              onClick={async () => {
                if (!publicUrl) return;
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "My emergency contacts",
                      url: publicUrl,
                    });
                  } catch {}
                } else {
                  await navigator.clipboard.writeText(publicUrl);
                  alert("Link copied!");
                }
              }}
            >
              <img src="/share.png" alt="" width={16} height={16} />
              Share
            </StyledDashboardQRCodeSectionQRCodeShareButton>
          </StyledDashboardQRCodeSectionQRCodeButtonsSection>

          <StyledDashboardQRCodeSectionQRCodeDisclaimer>
            Print this QR on keychains, wristbands, or wallet cards for quick
            emergency access.
          </StyledDashboardQRCodeSectionQRCodeDisclaimer>
        </StyledDashboardQRCodeSection>
      </StyledDashboardInfoSection>

      {/* Add Contact Modal */}
      {showAdd && (
        <Backdrop
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add Emergency Contact"
          >
            <ModalHeader>
              <ModalTitle>Add Emergency Contact</ModalTitle>
              <CloseBtn onClick={() => setShowAdd(false)} aria-label="Close">
                <img src="/cross.png" alt="Close" />
              </CloseBtn>
            </ModalHeader>

            <Form onSubmit={addContact}>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter contact name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
              />

              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                placeholder="Parent, Partner, Friend…"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                maxLength={32}
              />

              <Label htmlFor="phone">Phone Number</Label>
              <Row>
                <div>
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
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} (+{c.dial})
                        </option>
                      ))}
                    </HiddenSelect>
                  </CountryField>
                </div>

                <div style={{ width: "100%" }}>
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

              <Submit type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Contact"}
              </Submit>
            </Form>
          </Modal>
        </Backdrop>
      )}

      {/* Edit Contact Modal */}
      {showEdit && (
        <Backdrop
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowEdit(false);
          }}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit Emergency Contact"
          >
            <ModalHeader>
              <ModalTitle>Edit Contact</ModalTitle>
              <CloseBtn onClick={() => setShowEdit(false)} aria-label="Close">
                <img src="/cross.png" alt="Close" />
              </CloseBtn>
            </ModalHeader>

            <Form onSubmit={submitEdit}>
              <Label htmlFor="ename">Name</Label>
              <Input
                id="ename"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                required
              />

              <Label htmlFor="erel">Relationship</Label>
              <Input
                id="erel"
                value={editRelationship}
                onChange={(e) => setEditRelationship(e.target.value)}
                maxLength={32}
              />
              <Label htmlFor="phone">Phone Number</Label>
              <Row>
                <div>
                  <CountryField>
                    <DialDisplay
                      aria-hidden
                    >{`+${editCountry.dial}`}</DialDisplay>
                    <HiddenSelect
                      id="ecountry"
                      value={editCountry.code}
                      onChange={(e) => {
                        const next = COUNTRIES.find(
                          (c) => c.code === e.target.value
                        )!;
                        setEditCountry(next);
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

                <div style={{ width: "100%" }}>
                  <Input
                    id="ephone"
                    style={{ width: "100%" }}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    onBlur={() => {
                      const p = toE164WithCountry(editPhone, editCountry);
                      if (p.ok) setEditPhone(p.e164);
                    }}
                    inputMode="tel"
                    maxLength={22}
                    pattern="[\d\+\-\s\(\)]*"
                    required
                  />
                </div>
              </Row>

              <Submit type="submit">Save Changes</Submit>
            </Form>
          </Modal>
        </Backdrop>
      )}

      {/* Delete Contact Modal */}
      {showDelete && deleteTarget && (
        <Backdrop
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDelete(false);
          }}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Delete Contact Confirmation"
          >
            <ModalHeader>
              <ModalTitle>Delete Contact</ModalTitle>
              <CloseBtn onClick={() => setShowDelete(false)} aria-label="Close">
                <img src="/cross.png" alt="Close" />
              </CloseBtn>
            </ModalHeader>

            <DangerBar>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>
              {deleteTarget.relationship
                ? ` (${deleteTarget.relationship})`
                : ""}
              ?
              <br />
              <span style={{ opacity: 0.8 }}>
                Phone: {deleteTarget.phone_e164}
              </span>
            </DangerBar>

            <ModalActionsRow>
              <SecondaryBtn onClick={() => setShowDelete(false)}>
                Cancel
              </SecondaryBtn>
              <DangerBtn onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </DangerBtn>
            </ModalActionsRow>
          </Modal>
        </Backdrop>
      )}
    </StyledDashboardPage>
  );
}
