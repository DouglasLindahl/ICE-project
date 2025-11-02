"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import { theme } from "../../../styles/theme";
import { NexaButton } from "@/components/NexaButton/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";

/* -------------------- Types -------------------- */
type Tier = {
  id: string;
  name: string;
  price: number | null;
  max_contacts: number | null; // null = unlimited
  description?: string | null;
  is_active?: boolean | null;
};

type ProfileRow = {
  user_id: string;
  subscription_tier_id: string | null;
};

/* -------------------- Styled UI -------------------- */
const Page = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background};
  padding: 28px 16px 64px;
`;

const Container = styled.div`
  max-width: 1040px;
  margin: 0 auto;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;
const BackButtonWrapper = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 50; /* keep it above everything */
`;

const H1 = styled.h1`
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-size: 28px;
`;

const Subtle = styled.p`
  margin: 4px 0 0 0;
  opacity: 0.8;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 16px;
  margin: 12px 0 24px;

  @media (max-width: 940px) {
    grid-template-columns: 1fr;
  }
`;

const CardBase = styled.div`
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
`;

const SummaryCard = styled(CardBase)`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 12px;
`;

const SummaryTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const UsageMeta = styled.div`
  font-size: 13px;
  opacity: 0.85;
`;

const UsageBarWrap = styled.div`
  margin: 10px 0 8px;
  background: ${theme.colors.inputBackground};
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
`;

const UsageBar = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => Math.min(100, Math.max(0, $pct))}%;
  height: 100%;
  background: ${theme.colors.accent};
  transition: width 280ms ease;
`;

const Badge = styled.span<{ $tone?: "accent" | "ok" | "warn" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "warn"
        ? "rgba(255,160,67,0.4)"
        : $tone === "ok"
        ? "rgba(82,196,26,0.4)"
        : `${theme.colors.accent}`};
  background: ${({ $tone }) =>
    $tone === "warn"
      ? "rgba(255,160,67,0.1)"
      : $tone === "ok"
      ? "rgba(82,196,26,0.1)"
      : "transparent"};
  color: ${({ $tone }) =>
    $tone === "warn"
      ? "rgb(255,160,67)"
      : $tone === "ok"
      ? "rgb(82,196,26)"
      : theme.colors.accent};
`;

const TierGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 940px) {
    grid-template-columns: 1fr;
  }
`;

const TierCard = styled(CardBase)<{ $active?: boolean }>`
  position: relative;
  border-color: ${({ $active }) =>
    $active ? theme.colors.accent : theme.colors.border};
  outline: ${({ $active }) =>
    $active ? `2px solid ${theme.colors.accent}33` : "none"};
  transition: transform 200ms ease, box-shadow 200ms ease,
    border-color 200ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }
`;

const Ribbon = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${theme.colors.accent};
  color: white;
  font-size: 12px;
  font-weight: 700;
`;

const Title = styled.h3`
  margin: 0 0 6px 0;
  font-weight: 700;
  font-size: 18px;
`;

const Price = styled.div`
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0 2px 0;
  letter-spacing: -0.02em;

  small {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.8;
    margin-left: 6px;
  }
`;

const Desc = styled.p`
  margin: 8px 0 12px 0;
  opacity: 0.85;
  min-height: 36px;
`;

const Feature = styled.li`
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  opacity: 0.9;

  &:before {
    content: "✓";
    margin-right: 8px;
    font-weight: 900;
    opacity: 0.9;
  }
`;

const FeatureList = styled.ul`
  margin: 0 0 16px 0;
  padding: 0;
  display: grid;
  gap: 6px;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: "primary" | "ghost" }>`
  padding: 11px 12px;
  border-radius: 12px;
  border: ${({ $variant }) =>
    $variant === "ghost" ? `1px solid ${theme.colors.border}` : "none"};
  background: ${({ $variant }) =>
    $variant === "ghost" ? theme.colors.background : theme.colors.accent};
  color: ${({ $variant }) => ($variant === "ghost" ? "inherit" : "#fff")};
  cursor: pointer;
  font-weight: 700;
  width: 100%;
  transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
  box-shadow: ${({ $variant }) =>
    $variant === "ghost" ? "none" : "0 4px 14px rgba(0,0,0,0.08)"};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0px) scale(0.99);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

/* -------------- Loading skeletons -------------- */
const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const Skeleton = styled.div`
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    ${theme.colors.inputBackground} 0%,
    ${theme.colors.border} 50%,
    ${theme.colors.inputBackground} 100%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.2s infinite;
`;

const SkeletonCard = styled(CardBase)`
  height: 170px;
`;

/* -------------------- Component -------------------- */
export default function Subscriptions() {
  const supa = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const currentTier = useMemo(() => {
    if (!profile?.subscription_tier_id) return null;
    return tiers.find((t) => t.id === profile.subscription_tier_id) ?? null;
  }, [tiers, profile]);

  const maxContacts = currentTier?.max_contacts ?? null; // null = unlimited
  const usagePct = useMemo(() => {
    if (maxContacts == null || maxContacts === 0) return 0;
    return (contactsCount / maxContacts) * 100;
  }, [contactsCount, maxContacts]);

  function formatPrice(price: number | null) {
    if (price == null || isNaN(price)) return "$0";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return `$${price}`;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { data: session } = await supa.auth.getSession();
        if (!session.session?.user) {
          router.replace("/login");
          return;
        }
        const userId = session.session.user.id;

        const [tiersRes, profileRes, contactsRes] = await Promise.all([
          supa
            .from("subscription_tiers")
            .select("id,name,price,max_contacts,description,is_active")
            .eq("is_active", true)
            .order("price", { ascending: true }),
          supa
            .from("profiles")
            .select("user_id,subscription_tier_id")
            .eq("user_id", userId)
            .single(),
          supa
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        ]);

        if (tiersRes.error) throw tiersRes.error;
        if (profileRes.error) throw profileRes.error;
        if (contactsRes.error) throw contactsRes.error;

        setTiers(tiersRes.data ?? []);
        setProfile(profileRes.data ?? null);
        setContactsCount(contactsRes.count ?? 0);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Something went wrong loading data.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, supa]);

  async function changePlan(tier: Tier) {
    if (!profile) return;

    // Block downgrade if exceeding contact cap
    if (tier.max_contacts != null && contactsCount > tier.max_contacts) {
      alert(
        `You have ${contactsCount} contacts, but "${tier.name}" allows ${tier.max_contacts}. ` +
          `Delete ${contactsCount - tier.max_contacts} contact${
            contactsCount - tier.max_contacts === 1 ? "" : "s"
          } or pick a higher tier.`
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supa
        .from("profiles")
        .update({
          subscription_tier_id: tier.id,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setProfile((p) => (p ? { ...p, subscription_tier_id: tier.id } : p));
      alert(`Plan changed to ${tier.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not change plan.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- Render -------------------- */
  if (loading) {
    return (
      <LoadingScreen
        message="Loading settings…"
        subtext="Fetching your Information"
      />
    );
  }

  if (error) {
    return (
      <Page>
        <Container>
          <HeaderRow>
            <div>
              <H1>Subscriptions</H1>
              <Subtle role="alert" style={{ color: "#d9534f" }}>
                {error}
              </Subtle>
            </div>
            <NexaButton
              noPadding
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              aria-label="Back to Dashboard"
            >
              Back to Dashboard
            </NexaButton>
          </HeaderRow>
        </Container>
      </Page>
    );
  }

  const usageCopy =
    maxContacts == null
      ? `Unlimited contacts · ${contactsCount} in use`
      : `${contactsCount}/${maxContacts} contacts used`;

  const usageTone: "ok" | "warn" =
    maxContacts != null && contactsCount / maxContacts >= 0.9 ? "warn" : "ok";

  return (
    <Page>
      <BackButtonWrapper>
        <NexaButton
          noPadding
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to Dashboard"
        >
          Back to Dashboard
        </NexaButton>
      </BackButtonWrapper>
      <Container>
        <HeaderRow>
          <div>
            <H1>Subscriptions</H1>
            <Subtle>Manage your plan, usage, and billing.</Subtle>
          </div>
        </HeaderRow>

        <Summary>
          <SummaryCard aria-live="polite">
            <div>
              <SummaryTitle>Contacts usage</SummaryTitle>
              <UsageBarWrap>
                <UsageBar $pct={usagePct} />
              </UsageBarWrap>
              <UsageMeta>{usageCopy}</UsageMeta>
            </div>
            <Badge $tone={usageTone}>
              {usageTone === "warn" ? "Near limit" : "Healthy"}
            </Badge>
          </SummaryCard>

          <SummaryCard>
            <div>
              <SummaryTitle>Current plan</SummaryTitle>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {currentTier?.name ?? "—"}
              </div>
              <UsageMeta>
                {currentTier?.max_contacts == null
                  ? "Unlimited contacts"
                  : `${currentTier?.max_contacts} contact cap`}
              </UsageMeta>
            </div>
            {currentTier && <Badge $tone="accent">Active</Badge>}
          </SummaryCard>
        </Summary>

        <TierGrid>
          {tiers.map((tier) => {
            const isCurrent = tier.id === currentTier?.id;
            const wouldExceed =
              tier.max_contacts != null && contactsCount > tier.max_contacts;
            const priceText = `${formatPrice(tier.price)} `;

            return (
              <TierCard key={tier.id} $active={isCurrent}>
                {isCurrent && <Ribbon>Current</Ribbon>}
                <Title>{tier.name}</Title>
                <Price>
                  {priceText}
                  <small>/mo</small>
                </Price>

                <Desc title={tier.description ?? undefined}>
                  {tier.max_contacts == null
                    ? "Unlimited contacts"
                    : `${tier.max_contacts.toLocaleString()} contacts`}
                  {tier.description ? ` • ${tier.description}` : ""}
                </Desc>

                <FeatureList>
                  <Feature>
                    {tier.max_contacts == null
                      ? "No contact limits"
                      : `${tier.max_contacts.toLocaleString()} total contacts`}
                  </Feature>
                  <Feature>
                    {tier.price && tier.price > 0
                      ? "Priority support"
                      : "Community support"}
                  </Feature>
                  <Feature>Plan switching anytime</Feature>
                </FeatureList>

                <ButtonRow>
                  <Button
                    onClick={() => changePlan(tier)}
                    disabled={saving || isCurrent || wouldExceed}
                    aria-disabled={saving || isCurrent || wouldExceed}
                    title={
                      isCurrent
                        ? "You’re already on this plan"
                        : wouldExceed
                        ? "You have more contacts than this plan allows"
                        : "Switch to this plan"
                    }
                  >
                    {isCurrent
                      ? "Current plan"
                      : wouldExceed
                      ? "Over contact limit"
                      : "Choose plan"}
                  </Button>

                  <Button
                    $variant="ghost"
                    onClick={() =>
                      alert(
                        "Billing portal coming soon (Stripe). This page updates your in-app plan only."
                      )
                    }
                    disabled={saving}
                    title="View or manage billing"
                  >
                    Billing
                  </Button>
                </ButtonRow>
              </TierCard>
            );
          })}
        </TierGrid>
      </Container>
    </Page>
  );
}
