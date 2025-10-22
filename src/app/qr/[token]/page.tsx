// src/app/qr/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";
import styled from "styled-components";
import { theme } from "../../../../styles/theme";

/* =========================
   Types
   ========================= */
type PubContact = {
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

type ProfileInfoRow = { additional_information: string | null } | null;

/* =========================
   Styled components (match site theme)
   ========================= */
const Page = styled.main`
  background: ${theme.colors.background};
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 32px 0;

  @media (max-width: 768px) {
    padding: 20px 0;
  }
`;

const Stack = styled.div`
  width: 70vw;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    width: 90vw;
  }
`;

const CardLink = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;

  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  padding: 14px 16px;

  text-decoration: none;
  color: inherit;

  &:hover {
    border-color: ${theme.colors.accent};
  }
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: ${theme.colors.inputBackground};

  img {
    width: 22px;
    height: 22px;
  }
`;

const InfoCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NameLine = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
`;

const PhoneLine = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
`;

const InfoCard = styled.div`
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  padding: 16px;
`;

const InfoTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
`;

const InfoBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap; /* preserve user line breaks */
  color: ${theme.colors.text || "inherit"};
  opacity: 0.95;
`;

const Muted = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.75;
  text-align: center;
`;

/* =========================
   Component
   ========================= */
export default function QRPublicPage({
  params,
}: {
  params: { token: string };
}) {
  const supa = createClient();

  const [contacts, setContacts] = useState<PubContact[] | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<string | null>(null);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load contacts by token
  // Load profile.additional_information by token (via public_pages → profiles)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supa.rpc("get_profile_by_token", {
          p_token: params.token,
        });

        if (!mounted) return;

        if (error) {
          setAdditionalInfo(null);
        } else {
          // data may be a single row or an array depending on your function
          const row = (Array.isArray(data) ? data[0] : data) as {
            additional_information: string | null;
          } | null;

          const text = row?.additional_information?.trim() || null;
          setAdditionalInfo(text);
        }
      } catch {
        if (mounted) setAdditionalInfo(null);
      } finally {
        if (mounted) setLoadingInfo(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params.token, supa]);

  // Load profile.additional_information by token (via public_pages → profiles)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supa.rpc<
          ProfileInfoRow[],
          { p_token: string }
        >("get_profile_by_token", { p_token: params.token });

        if (!mounted) return;

        if (error) {
          setAdditionalInfo(null);
        } else {
          // Some Postgres clients return a single row, some return array; normalize
          const row: ProfileInfoRow = Array.isArray(data) ? data[0] : data;
          const text = row?.additional_information?.trim() || null;
          setAdditionalInfo(text);
        }
      } catch {
        if (mounted) setAdditionalInfo(null);
      } finally {
        if (mounted) setLoadingInfo(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params.token, supa]);

  const loading = loadingContacts || loadingInfo;

  return (
    <Page>
      <Stack>
        {loading && <Muted>Loading…</Muted>}
        {!loading && notFound && <Muted>No active contacts found.</Muted>}

        {!loading &&
          !notFound &&
          contacts?.map((c) => {
            const rel = c.relationship || "Contact";
            const label = `Call ${c.name} (${rel})`;
            return (
              <CardLink
                href={`tel:${c.phone_e164}`}
                key={`${c.phone_e164}-${c.name}`}
                aria-label={label}
              >
                <IconWrap>
                  <img src="/telephone.png" alt="" />
                </IconWrap>

                <InfoCol>
                  <NameLine>
                    {c.name} — {rel}
                  </NameLine>
                  <PhoneLine>{c.phone_e164}</PhoneLine>
                </InfoCol>
              </CardLink>
            );
          })}

        {!loading && !notFound && additionalInfo && (
          <InfoCard aria-label="Additional information">
            <InfoTitle>Additional Information</InfoTitle>
            <InfoBody>{additionalInfo}</InfoBody>
          </InfoCard>
        )}
      </Stack>
    </Page>
  );
}
