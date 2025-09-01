"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../styles/theme";
import { QrCanvas } from "@/components/QrCanvas";
import { generateToken } from "@/utils/token";

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
`;

const StyledDashboardHeaderSignOutButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  min-width: 44px;
  &:hover {
    cursor: pointer;
  }
`;

const StyledDashboardInfoSection = styled.section`
  display: flex;
  justify-content: center;
  align-items: start;
  gap: 32px;
  padding: 32px 128px;
`;

const StyledDashboardContactsSection = styled.section`
  width: 100%;
  background-color: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 24px;
`;

const StyledDashboardContactsSectionHeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
`;

const StyledDashboardContactsSectionHeader = styled.h2`
  font-weight: 400;
`;

const StyledDashboardContactsSectionAddContactButton = styled.button`
  padding: 6px 12px;
  background-color: ${theme.colors.accent};
  border: none;
  border-radius: 10px;
`;

const StyledDashboardContactsSectionContactCardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledDashboardContactsSectionContactCard = styled.div`
  background-color: ${theme.colors.background};
  width: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
`;

const StyledDashboardContactsSectionContactCardIcon = styled.img`
  width: 30px;
  height: 30px;
`;

const StyledDashboardContactsSectionContactCardInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledDashboardContactsSectionContactCardButtonSection = styled.div`
  display: inline-flex;
  gap: 6px;
`;

const StyledDashboardContactsSectionContactCardName = styled.p`
  font-size: 16px;
  font-weight: bold;
`;

const StyledDashboardContactsSectionContactCardNumber = styled.p`
  font-size: 14px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  &:hover {
    cursor: pointer;
  }
  img {
    width: 20px;
    height: 20px;
  }
`;

const StyledDashboardQRCodeSection = styled.section`
  width: 100%;
  background-color: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 24px;
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
`;

const StyledDashboardQRCodeSectionSubText = styled.p`
  font-size: 12px;
`;

const StyledDashboardQRCodeSectionQRCodeButtonsSection = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const ButtonWithIcon = styled.button`
  width: 100%;
  border-radius: 10px;
  padding: 8px;
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
`;

/* ===== Modal / Popup ===== */
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
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  padding: 4px;
  &:hover {
    cursor: pointer;
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
`;

const Submit = styled.button`
  font-size: 14px;
  border-radius: 10px;
  padding: 10px;
  margin-top: 6px;
  background-color: ${theme.colors.accent};
  border: none;
`;

export default function DashboardPage() {
  const router = useRouter();
  const supa = createClient();

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // modal state
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // QR state
  const [token, setToken] = useState<string | null>(null);
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
      setToken(t);
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
    // fetch existing
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

  async function addContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !phone || !userId) return;
    setSubmitting(true);
    try {
      const phone_e164 = phone.replace(/\s+/g, "");
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

  // close modal on ESC
  useEffect(() => {
    if (!showAdd) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAdd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd]);

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
              <p style={{ opacity: 0.7 }}>No contacts yet.</p>
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
                  <IconButton onClick={() => alert("TODO: edit contact")}>
                    <img src="/edit.png" alt="Edit" />
                  </IconButton>
                  <IconButton onClick={() => alert("TODO: delete contact")}>
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
        // use onMouseDown on backdrop to avoid "drag out, mouseup" close
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
                placeholder="+15551234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Submit type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Contact"}
              </Submit>
            </Form>
          </Modal>
        </Backdrop>
      )}
    </StyledDashboardPage>
  );
}
