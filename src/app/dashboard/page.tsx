"use client";
import { useEffect, useMemo, useState, useRef } from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { QrCanvas } from "@/components/QrCanvas";
import { generateToken } from "@/utils/token";
import {
  RestrictedInput,
  validateName,
} from "@/components/RestrictedInput/page";
import {
  getSessionUser,
  fetchProfile,
  fetchContacts as loadContacts,
  insertContact,
  updateContact as patchContact,
  removeContact as deleteContact,
  getOrCreatePublicToken,
  buildPublicUrl,
  updateAdditionalInfo as upsertAdditionalInfo,
  Contact,
} from "../utils";
import { LoadingScreen } from "@/components/LoadingScreen/page";

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

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1.4; /* a bit wider than QR column */
  width: 100%;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  @media (max-width: 900px) {
    order: -1; /* show QR first on small screens */
  }
`;

const StyledDashboardPage = styled.div`
  position: relative;
  background-color: ${theme.colors.background};
  min-height: 100vh;
`;

const StyledDashboardHeader = styled.header`
  position: relative; /* ensure dropdown anchors to header */
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

  /* NEW: hide desktop buttons on small screens */
  @media (max-width: 900px) {
    display: none;
  }
`;
const StyledHamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 10px;
  line-height: 0; /* tighter */
  &:hover {
    cursor: pointer;
  }

  img {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 900px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;
const MobileMenu = styled.div`
  position: absolute;
  right: 16px;
  top: calc(100% + 8px);
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: 8px;
  min-width: 180px;
  z-index: 40;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  @media (min-width: 901px) {
    display: none; /* menu is only for mobile */
  }
`;

const MobileMenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  text-align: left;

  &:hover {
    cursor: pointer;
    background: ${theme.colors.inputBackground};
  }

  img {
    width: 16px;
    height: 16px;
  }
`;

const StyledDashboardHeaderButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  min-width: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  &:hover {
    cursor: pointer;
  }

  img {
    height: 14px;
    width: 14px;
  }

  p {
    height: 14px;
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
    flex-direction: column-reverse;
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

const StyledAdditionalInformationSection = styled(PanelBase)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledAdditionalInformationSectionHeader = styled.h2`
  font-weight: 400;
  margin: 0 0 4px 0;
  font-size: 20px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const StyledAdditionalInformationSectionTextarea = styled.textarea`
  padding: 10px;
  background-color: ${theme.colors.inputBackground};
  border-radius: 10px;
  border: none;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
`;

const StyledAdditionalInformationSectionActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
`;

const StyledAdditionalInformationSectionSubmitButton = styled.button`
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 12px;
  background-color: ${theme.colors.accent};
  border: none;
`;

const Muted = styled.span`
  font-size: 12px;
  opacity: 0.75;
`;

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

// tighten the name line
const StyledDashboardContactsSectionContactCardName = styled.p`
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px; /* space between text and star */
  line-height: 1.2;
`;

// compact star
const PriorityStar = styled.span`
  display: inline-block;
  font-size: 14px;
  line-height: 1; /* prevents extra vertical space */
  color: ${theme.colors.accent};
  transform: translateY(-1px); /* tiny nudge for optical alignment */
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
const StyledDashboardContactsSection = styled(PanelBase)``;
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
  align-items: start;
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
const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Toggle = styled.input.attrs({ type: "checkbox" })`
  width: 42px;
  height: 24px;
  appearance: none;
  background: ${theme.colors.inputBackground};
  border-radius: 999px;
  position: relative;
  outline: none;
  cursor: pointer;
  transition: background 0.2s ease;

  &:checked {
    background: ${theme.colors.accent};
  }

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: ${theme.colors.card};
    border-radius: 50%;
    transition: transform 0.2s ease;
    transform: translateX(0);
  }

  &:checked::after {
    transform: translateX(18px);
  }
`;

/* ============================
   Component
   ============================ */
export default function DashboardPage() {
  const router = useRouter();
  const supa = createClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

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
  const [addPriority, setAddPriority] = useState(false);

  // Edit Contact modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCountry, setEditCountry] = useState<Country>(COUNTRIES[0]);
  const [editPriority, setEditPriority] = useState(false);
  // Delete Contact modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Additional info state
  // Additional Information (inline debounce + status)
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSavedAt, setAiSavedAt] = useState<string | null>(null);

  // debounce internals
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiLatestRef = useRef<string>("");

  const ADDITIONAL_INFO_MAX = 1000;
  // ===== Country-aware phone validation for RestrictedInput =====

  const validatePhoneByCountry = (v: string) => {
    if (!v) return "Phone is required.";
    const p = toE164WithCountry(v, addCountry);
    return p.ok ? null : p.reason;
  };

  // QR state
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
      const user = await getSessionUser(supa);
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!mounted) return;

      setEmail(user.email ?? null);
      setUserId(user.id);

      // Profile
      const profile = await fetchProfile(supa, user.id);
      if (!mounted) return;
      setAdditionalInfo(profile?.additional_information ?? "");

      // Contacts
      const rows = await loadContacts(supa);
      if (!mounted) return;
      setContacts(rows);
      console.log(rows);

      // Public URL (QR)
      const token = await getOrCreatePublicToken(supa, user.id, generateToken);
      if (!mounted) return;
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setPublicUrl(buildPublicUrl(token, origin));

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
      const position = (contacts?.length ?? 0) + 1;

      await insertContact(supa, {
        user_id: userId,
        name,
        relationship: relationship || null,
        phone_e164,
        position,
        priority: addPriority, // NEW
      });

      setContacts(await loadContacts(supa));
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
      await deleteContact(supa, deleteTarget.id);
      setContacts(await loadContacts(supa));
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
    setEditPriority(!!c.priority); // NEW

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

      await patchContact(supa, editId, {
        name: editName,
        relationship: editRelationship || null,
        phone_e164,
        priority: editPriority, // NEW
      });

      setContacts((cs) =>
        cs.map((c) =>
          c.id === editId
            ? {
                ...c,
                name: editName,
                relationship: editRelationship || null,
                phone_e164,
                priority: editPriority, // NEW
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
  async function writeAdditionalInfoNow(text: string) {
    if (!userId) return;
    setAiSaving(true);
    try {
      await upsertAdditionalInfo(supa, userId, text);

      setAiSavedAt(new Date().toLocaleString());
    } catch (e) {
      console.error("Saving additional information failed:", e);
      alert("Could not save additional information. Please try again.");
    } finally {
      setAiSaving(false);
    }
  }

  // 5s debounce: call this from onChange
  function updateAdditionalInformation(text: string) {
    setAdditionalInfo(text);
    aiLatestRef.current = text;

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      void writeAdditionalInfoNow(aiLatestRef.current);
    }, 5000);
  }
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
        if (aiLatestRef.current)
          void writeAdditionalInfoNow(aiLatestRef.current);
      }
    };
  }, []);

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
      <LoadingScreen
        message="Loading Dashboard..."
        subtext="Fetching Your Information"
      />
    );
  }

  return (
    <StyledDashboardPage>
      <StyledDashboardHeader>
        <StyledDashboardHeaderLogo>Beacon</StyledDashboardHeaderLogo>

        {/* Desktop actions (hidden on mobile) */}
        <StyledDashboardHeaderRight>
          <StyledDashboardHeaderButton
            onClick={async () => {
              window.alert("Take user to shop");
            }}
          >
            <img src="shopping-bag.png" alt="" />
            <p>Shop</p>
          </StyledDashboardHeaderButton>
          <StyledDashboardHeaderButton
            onClick={async () => {
              router.replace("/settings");
            }}
          >
            <img src="setting.png" alt="" />
            <p>Settings</p>
          </StyledDashboardHeaderButton>
          <StyledDashboardHeaderButton
            onClick={async () => {
              await supa.auth.signOut();
              router.replace("/login");
            }}
          >
            <img src="logout.png" alt="" />
            <p>Sign Out</p>
          </StyledDashboardHeaderButton>
        </StyledDashboardHeaderRight>

        {/* Mobile hamburger (hidden on desktop) */}
        <StyledHamburgerButton
          ref={menuBtnRef}
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <img src="hamburger.png" alt="" />
        </StyledHamburgerButton>

        {/* Dropdown menu for mobile */}
        {menuOpen && (
          <MobileMenu id="mobile-menu" role="menu" ref={menuRef}>
            <MobileMenuItem
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                window.alert("Take user to shop");
              }}
            >
              <img src="shopping-bag.png" alt="" />
              Shop
            </MobileMenuItem>
            <MobileMenuItem
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                window.alert("Take user to settings");
              }}
            >
              <img src="setting.png" alt="" />
              Settings
            </MobileMenuItem>
            <MobileMenuItem
              role="menuitem"
              onClick={async () => {
                setMenuOpen(false);
                await supa.auth.signOut();
                router.replace("/login");
              }}
            >
              <img src="logout.png" alt="" />
              Sign Out
            </MobileMenuItem>
          </MobileMenu>
        )}
      </StyledDashboardHeader>

      <StyledDashboardInfoSection>
        {/* LEFT COLUMN: Contacts + Additional Info */}
        <LeftColumn>
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
                      {c.priority && (
                        <PriorityStar aria-label="Priority">★</PriorityStar>
                      )}
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

          {/* Additional Information (now directly under Contacts) */}
          <StyledAdditionalInformationSection>
            <StyledAdditionalInformationSectionHeader>
              Additional Information
            </StyledAdditionalInformationSectionHeader>

            <RestrictedInput
              value={additionalInfo}
              onChange={setAdditionalInfo}
              placeholder="Notes, preferences, etc."
              name="additional_information"
              preset="none"
              maxLength={280}
              ariaLabel="Additional information"
              showCounter
              showValidity={false}
              inputMode="text"
              multiline
            />

            <StyledAdditionalInformationSectionActions>
              <Muted>
                {additionalInfo.length}/{ADDITIONAL_INFO_MAX}
              </Muted>
              <StyledAdditionalInformationSectionSubmitButton
                onClick={() => writeAdditionalInfoNow(additionalInfo)}
                disabled={aiSaving}
              >
                {aiSaving ? "Saving…" : "Save"}
              </StyledAdditionalInformationSectionSubmitButton>
            </StyledAdditionalInformationSectionActions>
          </StyledAdditionalInformationSection>
        </LeftColumn>

        {/* RIGHT COLUMN: QR */}
        <RightColumn>
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
              emergency access. You can also visit our shop to purchase already
              made items, ready for immediate use.
            </StyledDashboardQRCodeSectionQRCodeDisclaimer>
          </StyledDashboardQRCodeSection>
        </RightColumn>
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
              <RestrictedInput
                id="name"
                ariaLabel="Name"
                placeholder="Enter contact name"
                value={name}
                onChange={setName}
                preset="name"
                maxLength={60}
                validate={validateName}
                showCounter={false}
              />

              <Label htmlFor="relationship">Relationship</Label>
              <RestrictedInput
                id="relationship"
                ariaLabel="Relationship"
                placeholder="Parent, Partner, Friend…"
                value={relationship}
                onChange={setRelationship}
                preset="name"
                maxLength={32}
                showValidity={false} // no error text for this one
                showCounter={false}
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
                  <RestrictedInput
                    id="phone"
                    ariaLabel="Phone Number"
                    placeholder="(123) 456-7890 or +1…"
                    value={phone}
                    onChange={setPhone}
                    inputMode="tel"
                    maxLength={22}
                    blockEmoji
                    // We keep country-aware validation, allowing local digits.
                    // Final normalization still happens in addContact via toE164WithCountry.
                    validate={validatePhoneByCountry}
                    showCounter={false}
                  />
                </div>
              </Row>
              <ToggleRow>
                <Toggle
                  checked={addPriority}
                  onChange={(e) => setAddPriority(e.target.checked)}
                  aria-label="Make this a priority contact"
                />
                <span>Mark as priority contact</span>
              </ToggleRow>

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
              <RestrictedInput
                id="ename"
                ariaLabel="Name"
                placeholder="Enter contact name"
                value={editName}
                onChange={setEditName}
                preset="name"
                maxLength={60}
                validate={validateName}
                showCounter={false}
                // required? Your original had required — add if desired:
                // validate={(v) => (!v ? "Name is required." : validateName(v))}
              />

              <Label htmlFor="erel">Relationship</Label>
              <RestrictedInput
                id="erel"
                ariaLabel="Relationship"
                placeholder="Parent, Partner, Friend…"
                value={editRelationship}
                onChange={setEditRelationship}
                preset="name"
                maxLength={32}
                showValidity={false}
                showCounter={false}
              />

              <Label htmlFor="ephone">Phone Number</Label>
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
                  <RestrictedInput
                    id="ephone"
                    ariaLabel="Phone Number"
                    placeholder="(123) 456-7890 or +1…"
                    value={editPhone}
                    onChange={setEditPhone}
                    inputMode="tel"
                    maxLength={22}
                    blockEmoji
                    // same validator pattern as Add modal, but using editCountry:
                    validate={(v) => {
                      if (!v) return "Phone is required.";
                      const p = toE164WithCountry(v, editCountry);
                      return p.ok ? null : p.reason;
                    }}
                    showCounter={false}
                  />
                </div>
              </Row>
              <ToggleRow>
                <Toggle
                  checked={editPriority}
                  onChange={(e) => setEditPriority(e.target.checked)}
                  aria-label="Make this a priority contact"
                />
                <span>Mark as priority contact</span>
              </ToggleRow>

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
