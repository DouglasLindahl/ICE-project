"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../../styles/theme";

type PubContact = {
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

const StyledContactsPage = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${theme.colors.background};
  display: flex;
  justify-content: center;
  align-items: center;
`;
const StyledContactsSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
`;

const StyledCallCard = styled.a`
  width: 70vw;

  background-color: ${theme.colors.card};
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    width: 90vw;
  }
`;

const StyledCallCardImageSection = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const StyledCallCardInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  gap: 6px;
`;
const StyledCallCardInfoSectionName = styled.p`
  font-weight: bold;
  font-size: 18px;
`;
const StyledCallCardInfoSectionPhoneNumber = styled.p`
  font-size: 16px;
`;

export default function QRPublicPage({
  params,
}: {
  params: { token: string };
}) {
  const supa = createClient();
  const [contacts, setContacts] = useState<PubContact[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supa.rpc("get_contacts_by_token", {
        p_token: params.token,
      });
      if (!mounted) return;
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setContacts(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.token, supa]);

  // minimal, no branding
  return (
    <StyledContactsPage>
      <StyledContactsSection>
        {notFound && <p>No active contacts found.</p>}
        {contacts?.map((c, i) => (
          <StyledCallCard href={`tel:${c.phone_e164}`} key={i}>
            <StyledCallCardImageSection>
              <img src="../telephone.png" alt="" />
            </StyledCallCardImageSection>
            <StyledCallCardInfoSection>
              <div>
                <StyledCallCardInfoSectionName>
                  {`${c.name} - ${c.relationship || "Contact"}`}
                </StyledCallCardInfoSectionName>
              </div>
              <StyledCallCardInfoSectionPhoneNumber>
                ({c.phone_e164})
              </StyledCallCardInfoSectionPhoneNumber>
            </StyledCallCardInfoSection>
          </StyledCallCard>
        ))}
      </StyledContactsSection>
    </StyledContactsPage>
  );
}
