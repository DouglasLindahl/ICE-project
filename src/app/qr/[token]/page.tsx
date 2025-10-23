// src/app/qr/[token]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
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
  priority: boolean; // boolean priority
  position: number | null; // ordering within each group
};

type ProfileInfoRow = { additional_information: string | null };

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

// transient prop to avoid passing to DOM
const CardLink = styled.a<{ $priority?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;

  background: ${({ $priority }) =>
    $priority
      ? `linear-gradient(0deg, ${theme.colors.card}, ${theme.colors.card})`
      : theme.colors.card};
  border: 1px solid
    ${({ $priority }) =>
      $priority ? theme.colors.accent : theme.colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;

  /* subtle emphasis for priority */
  ${({ $priority }) =>
    $priority
      ? `
    box-shadow: 0 0 0 3px rgba(255, 183, 3, 0.12);
    background: ${theme.colors.card};
  `
      : ""}

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
`;

const PriorityStar = styled.span`
  display: inline-block;
  font-size: 14px;
  line-height: 1;
  color: ${theme.colors.accent};
  transform: translateY(-1px);
`;

const PhoneLine = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
`;

const GroupTitle = styled.h4`
  margin: 16px 0 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.8;
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
  // In Next.js 15/React 19, params is a Promise in client components
  params: Promise<{ token: string }>;
}) {
  // Unwrap once, use the plain value everywhere (including deps)
  const { token } = use(params);
  const supa = createClient();

  const [contacts, setContacts] = useState<PubContact[] | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<string | null>(null);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load contacts by token
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supa.rpc("get_contacts_by_token", {
          p_token: token,
        });
        if (error) {
          console.error("[RPC get_contacts_by_token]", {
            status,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
          setContacts(null);
          setNotFound(true);
          return;
        }
        if (!mounted) return;

        if (error) {
          setContacts(null);
          setNotFound(true);
        } else {
          const list = (
            Array.isArray(data) ? data : data ? [data] : []
          ) as PubContact[];

          // Sort: priority first, then by position (nulls last), then by name
          const sorted = [...list].sort((a, b) => {
            if (a.priority !== b.priority) return a.priority ? -1 : 1; // priority on top
            const pa = a.position ?? Number.POSITIVE_INFINITY;
            const pb = b.position ?? Number.POSITIVE_INFINITY;
            if (pa !== pb) return pa - pb;
            return a.name.localeCompare(b.name);
          });

          setContacts(sorted);
          setNotFound(sorted.length === 0);
        }
      } catch {
        if (mounted) {
          setContacts(null);
          setNotFound(true);
        }
      } finally {
        if (mounted) setLoadingContacts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, supa]);

  // Load profile.additional_information by token
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supa.rpc("get_profile_by_token", {
          p_token: token,
        });

        if (!mounted) return;

        if (error) {
          setAdditionalInfo(null);
        } else {
          const row = Array.isArray(data)
            ? (data?.[0] as ProfileInfoRow | null) ?? null
            : (data as ProfileInfoRow) ?? null;
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
  }, [token, supa]);

  const loading = loadingContacts || loadingInfo;

  // Split into groups for display
  const priorityContacts = (contacts ?? []).filter((c) => c.priority);
  const otherContacts = (contacts ?? []).filter((c) => !c.priority);

  return (
    <Page>
      <Stack>
        {loading && <Muted>Loading…</Muted>}
        {!loading && notFound && <Muted>No active contacts found.</Muted>}

        {!loading && !notFound && priorityContacts.length > 0 && (
          <>
            <GroupTitle>Priority contacts</GroupTitle>
            {priorityContacts.map((c) => {
              const rel = c.relationship || "Contact";
              const label = `Call ${c.name} (${rel})`;
              return (
                <CardLink
                  href={`tel:${c.phone_e164}`}
                  key={`${c.phone_e164}-${c.name}-priority`}
                  aria-label={label}
                  $priority
                >
                  <IconWrap>
                    <img src="/telephone.png" alt="" />
                  </IconWrap>

                  <InfoCol>
                    <NameLine>
                      {c.name} — {rel}
                      <PriorityStar aria-hidden>★</PriorityStar>
                    </NameLine>
                    <PhoneLine>{c.phone_e164}</PhoneLine>
                  </InfoCol>
                </CardLink>
              );
            })}
          </>
        )}

        {!loading && !notFound && otherContacts.length > 0 && (
          <>
            {priorityContacts.length > 0 && (
              <GroupTitle>Other contacts</GroupTitle>
            )}
            {otherContacts.map((c) => {
              const rel = c.relationship || "Contact";
              const label = `Call ${c.name} (${rel})`;
              return (
                <CardLink
                  href={`tel:${c.phone_e164}`}
                  key={`${c.phone_e164}-${c.name}-other`}
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
          </>
        )}

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
