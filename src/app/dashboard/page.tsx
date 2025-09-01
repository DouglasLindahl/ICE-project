"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { QrCanvas } from "@/components/QrCanvas";
import { generateToken } from "@/utils/token";

// --- Phone helpers (basic, US-first) ---
function cleanDigits(s: string) {
  return s.replace(/[^\d+]/g, "");
}

function toE164US(
  raw: string
): { ok: true; e164: string } | { ok: false; reason: string } {
  const v = cleanDigits(raw).trim();

  // already +E.164?
  if (v.startsWith("+")) {
    // minimal validation: + then 8-15 digits (common E.164 bounds)
    if (/^\+\d{8,15}$/.test(v)) return { ok: true, e164: v };
    return { ok: false, reason: "Invalid E.164 format" };
  }

  // allow leading 1 for NANP
  if (/^1\d{10}$/.test(v)) {
    return { ok: true, e164: `+${v}` }; // already 1 + 10 digits
  }

  // plain 10 digits -> assume US (+1)
  if (/^\d{10}$/.test(v)) {
    return { ok: true, e164: `+1${v}` };
  }

  // anything else fails our simple rules
  return { ok: false, reason: "Enter 10 digits (US) or a full +E.164 number" };
}

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

const StyledDashboardContactsSectionPermanentContactCard = styled.div`
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

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const StyledDashboardContactsSectionContactCardNumber = styled.p`
  font-size: 14px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 13px;
  }
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

  @media (max-width: 480px) {
    font-size: 18px;
  }
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

  @media (max-width: 480px) {
    font-size: 14px;
  }
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

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
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
  background: #ef4444; /* red-500 */
  color: white;
  font-size: 14px;
`;

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
  const [submitting, setSubmitting] = useState(false);

  // Edit Contact modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Delete Contact modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  // QR state
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

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

  // CREATE
  async function addContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !phone || !userId) return;
    setSubmitting(true);
    try {
      const parsed = toE164US(phone);
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
      alert(
        "Could not add contact. Please check the phone format (e.g. +15551234567) and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // DELETE (open)
  function openDelete(c: Contact) {
    setDeleteTarget(c);
    setShowDelete(true);
  }

  // DELETE (confirm)
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // optimistic remove
      setContacts((cs) => cs.filter((x) => x.id !== deleteTarget.id));
      const { error } = await supa
        .from("contacts")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;

      // optional re-fetch to ensure order kept
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

  // EDIT (open)
  function openEdit(c: Contact) {
    setEditId(c.id);
    setEditName(c.name);
    setEditRelationship(c.relationship ?? "");
    setEditPhone(c.phone_e164);
    setShowEdit(true);
  }

  // EDIT (submit)
  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editId) return;
    try {
      const parsed = toE164US(editPhone);
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
      alert("Update failed. Please check the phone format and try again.");
    }
  }

  // ESC closers
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
                required
              />

              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                placeholder="Parent, Partner, Friend…"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />

              <Label htmlFor="phone">Phone Number (E.164)</Label>
              <Input
                id="phone"
                placeholder="(618) 340-1982 or +16183401982"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => {
                  const parsed = toE164US(phone);
                  if (parsed.ok) setPhone(parsed.e164);
                }}
                required
              />

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
                required
              />

              <Label htmlFor="erel">Relationship</Label>
              <Input
                id="erel"
                value={editRelationship}
                onChange={(e) => setEditRelationship(e.target.value)}
              />

              <Label htmlFor="ephone">Phone Number (E.164)</Label>
              <Input
                id="ephone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />

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
