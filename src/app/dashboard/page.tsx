"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../styles/theme";

type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

const StyledDashboardPage = styled.div`
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

const StyledDashboardContactsSectionContactCardRelation = styled.p`
  font-size: 14px;
  opacity: 0.8;
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
  img {
    border: 2px solid ${theme.colors.border};
    padding: 24px;
    height: 200px;
    width: 200px;
    border-radius: 12px;
    object-fit: contain;
  }
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

const StyledDashboardQRCodeSectionQRCodeDownloadButton = styled.button`
  width: 100%;
  border: none;
  background-color: ${theme.colors.accent};
  border-radius: 10px;
  padding: 8px;
  font-size: 12px;
`;

const StyledDashboardQRCodeSectionQRCodeShareButton = styled.button`
  width: 100%;
  border: 1px solid ${theme.colors.border};
  background-color: ${theme.colors.background};
  border-radius: 10px;
  padding: 8px;
  font-size: 12px;
`;

const StyledDashboardQRCodeSectionQRCodeDisclaimer = styled.p`
  text-align: center;
  font-size: 12px;
  background: rgba(255, 183, 3, 0.12); /* subtle accent tint */
  padding: 8px;
  border-radius: 10px;
`;

export default function DashboardPage() {
  const router = useRouter();
  const supa = createClient();

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      // Check session
      const { data: sessionData } = await supa.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!mounted) return;

      setEmail(user.email ?? null);

      // Load contacts
      const { data: rows, error } = await supa
        .from("contacts")
        .select("id,name,relationship,phone_e164,priority")
        .order("priority", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error(error);
        setContacts([]);
      } else {
        setContacts(rows ?? []);
      }

      // Auth change listener → kick to /login if signed out
      const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
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
              onClick={() => alert("TODO: open Add Contact modal")}
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
                    {c.name}
                  </StyledDashboardContactsSectionContactCardName>
                  <div>
                    <StyledDashboardContactsSectionContactCardRelation>
                      {c.relationship || "Contact"}
                    </StyledDashboardContactsSectionContactCardRelation>
                    {" — "}
                    <StyledDashboardContactsSectionContactCardNumber>
                      {c.phone_e164}
                    </StyledDashboardContactsSectionContactCardNumber>
                  </div>
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

        {/* QR section (static placeholder for now) */}
        <StyledDashboardQRCodeSection>
          <StyledDashboardQRCodeSectionHeaderSection>
            <StyledDashboardQRCodeSectionHeader>
              Your Emergency QR Code
            </StyledDashboardQRCodeSectionHeader>
          </StyledDashboardQRCodeSectionHeaderSection>

          <StyledDashboardQRCodeSectionQRCodeImageSection>
            <img src="/qr-code.png" alt="Your QR code" />
          </StyledDashboardQRCodeSectionQRCodeImageSection>

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
              onClick={() => alert("TODO: download QR")}
            >
              Download
            </StyledDashboardQRCodeSectionQRCodeDownloadButton>
            <StyledDashboardQRCodeSectionQRCodeShareButton
              onClick={() => alert("TODO: share link")}
            >
              Share
            </StyledDashboardQRCodeSectionQRCodeShareButton>
          </StyledDashboardQRCodeSectionQRCodeButtonsSection>

          <StyledDashboardQRCodeSectionQRCodeDisclaimer>
            Print this QR on keychains, wristbands, or wallet cards for quick
            emergency access.
          </StyledDashboardQRCodeSectionQRCodeDisclaimer>
        </StyledDashboardQRCodeSection>
      </StyledDashboardInfoSection>
    </StyledDashboardPage>
  );
}
