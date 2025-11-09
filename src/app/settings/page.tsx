"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import styled, { css } from "styled-components";
import {
  fetchProfile,
  getSessionUser,
  ProfileRow,
  Tier,
  upsertProfile,
  validatePwMatch,
  validatePwStrong,
} from "../utils";
import {
  NexaInput,
  validateE164,
  validateName,
} from "@/components/NexaInput/page";
import { theme } from "../../../styles/theme";
import { NexaButton } from "@/components/NexaButton/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";
import NexaFooter from "@/components/NexaFooter/page";
import { NexaPopup } from "@/components/NexaPopup/page"; // ⟵ ensure this exists
import { generateToken, rotatePublicToken } from "@/utils/token";

// Types
type TabKey =
  | "profile"
  | "privacy"
  | "notifications"
  | "subscription"
  | "account";

// Breakpoints
const BP = {
  md: "768px",
  sm: "480px",
};

// Styled Components
const StyledSettingsPage = styled.div`
  width: 100%;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  background: #fff;
`;

const StyledSettingsPageHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px;
  gap: 12px;
  border-bottom: 1px solid #eee;
  background: #ffffffcc;
  backdrop-filter: blur(6px);

  @media (min-width: ${BP.md}) {
    padding: 20px 24px;
  }
`;

const StyledSettingsPageHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledSettingsPageSettings = styled.div`
  width: 100%;

  @media (min-width: ${BP.md}) {
    display: grid;
    grid-template-columns: 280px 1fr; /* Desktop: sidebar + content */
  }
`;

// Sidebar transforms to a horizontal, scrollable tab bar on mobile
const StyledSidebar = styled.nav`
  border-bottom: 1px solid #eee;
  padding: 16px 16px;
  background: #fff;
  position: sticky;
  top: 64px;
  z-index: 9;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (min-width: ${BP.md}) {
    position: static;
    border-bottom: none;
    border-right: 1px solid #eee;
    overflow: visible;
  }
`;

const SidebarList = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  @media (min-width: ${BP.md}) {
    flex-direction: column;
    gap: 12px;
  }
`;

const SidebarButton = styled.button<{ $active?: boolean }>`
  flex: 0 0 auto;
  text-align: left;
  padding: 10px 12px;
  border-radius: 999px; /* pill on mobile */
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.2;
  min-height: 44px; /* touch target */
  white-space: nowrap;

  ${(p) =>
    p.$active
      ? css`
          background: #ffecba;
          border-color: ${theme.colors.accent};
          font-weight: 600;
        `
      : css`
          &:hover {
            background: #f5f5f5;
            border-color: #e6e6e6;
          }
        `}

  @media (min-width: ${BP.md}) {
    border-radius: 8px;
    width: 100%;
  }
`;

const Content = styled.main`
  padding: 16px;
  overflow: auto;

  @media (min-width: ${BP.md}) {
    padding: 32px 48px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: clamp(18px, 2vw, 22px);
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
  max-width: 100%;

  @media (min-width: ${BP.md}) {
    gap: 16px;
    max-width: 560px;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
`;

const InputBase = css`
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 16px; /* prevent iOS zoom */
  line-height: 1.3;
  width: 100%;
`;

const Input = styled.input`
  ${InputBase}
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  & > * {
    min-height: 44px; /* touch target */
  }

  @media (min-width: ${BP.sm}) {
    flex-wrap: nowrap;
  }
`;

const Helper = styled.p`
  color: #666;
  font-size: 13px;
  margin: 0;
`;

const Banner = styled.div<{ $type?: "info" | "success" | "error" }>`
  margin: 8px 0 16px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  ${(p) =>
    p.$type === "success"
      ? css`
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        `
      : p.$type === "error"
      ? css`
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `
      : css`
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `}
`;

const DangerBox = styled.div`
  border: 1px dashed #fca5a5;
  border-radius: 12px;
  padding: 12px;
  max-width: 100%;

  @media (min-width: ${BP.md}) {
    padding: 16px;
    max-width: 560px;
  }
`;
const Checklist = styled.ul`
  list-style: none;
  padding: 8px 10px;
  margin: 0;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  font-size: 13px;
`;

const CheckItem = styled.li<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: ${({ $ok }) => ($ok ? "#065f46" : "#6b7280")};
  &::before {
    content: ${({ $ok }) => ($ok ? "'✓'" : "'•'")};
    display: inline-block;
    width: 1em;
  }
`;

export default function Settings() {
  const router = useRouter();
  const supa = createClient();

  // Session basics
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile
  const [fullName, setFullName] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [originalAdditionalInfo, setOriginalAdditionalInfo] = useState("");

  // Privacy (password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<TabKey>("profile");
  const [banner, setBanner] = useState<{
    type: "info" | "success" | "error";
    msg: string;
  } | null>(null);

  // REMAKE QR modal state
  const [remakeOpen, setRemakeOpen] = useState(false);
  const [remakeBusy, setRemakeBusy] = useState(false);
  const [remakeError, setRemakeError] = useState<string | null>(null);
  const [ackOldStops, setAckOldStops] = useState(false);
  const [ackReprint, setAckReprint] = useState(false);

  // DELETE ACCOUNT modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [contactsCount, setContactsCount] = useState<number>(0);

  const currentTier = useMemo(() => {
    if (!profile?.subscription_tier_id) return null;
    return tiers.find((t) => t.id === profile.subscription_tier_id) ?? null;
  }, [tiers, profile]);

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
      setFullName(profile?.display_name ?? "");
      setOriginalFullName(profile?.display_name ?? "");
      setPhone(profile?.phone_number ?? "");
      setOriginalPhone(profile?.phone_number ?? "");
      setAdditionalInfo(profile?.additional_information ?? "");
      setOriginalAdditionalInfo(profile?.additional_information ?? "");

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
            .select(
              "id,name,price_monthly,price_yearly,max_contacts,description,is_active,can_buy"
            )
            .eq("is_active", true)
            .eq("can_buy", true)
            .order("price_monthly", { ascending: true }),
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

  const saveProfile = async () => {
    if (userId && currentTier) {
      const row = {
        user_id: userId,
        display_name: fullName,
        phone_number: phone,
        additional_information: additionalInfo,
        subscription_tier_id: currentTier?.id,
      };
      console.log(currentTier?.id);
      try {
        await upsertProfile(supa, row);
        setBanner({ type: "success", msg: "Profile saved." });
      } catch (err) {
        setBanner({ type: "error", msg: getErrorMessage(err) });
      }
    } else {
      setBanner({
        type: "error",
        msg: "Something went wrong. Please try again later",
      });
    }
  };

  const changePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBanner(null);

    if (!email)
      return setBanner({ type: "error", msg: "No email found in session." });
    if (!currentPassword || !newPassword || !confirmNewPassword)
      return setBanner({
        type: "error",
        msg: "Please fill out all password fields.",
      });

    const strongErr = validatePwStrong(newPassword);
    if (strongErr) return setBanner({ type: "error", msg: strongErr });

    const matchErr = validatePwMatch(confirmNewPassword, newPassword);
    if (matchErr) return setBanner({ type: "error", msg: matchErr });

    if (newPassword === currentPassword)
      return setBanner({
        type: "error",
        msg: "New password must be different from current.",
      });

    try {
      const { error: signInErr } = await supa.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInErr) throw signInErr;

      const { error: updateErr } = await supa.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      setBanner({ type: "success", msg: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      setBanner({ type: "error", msg: getErrorMessage(err) });
    }
  };

  // --- NEW: delete account flow (reauth + call API) ---
  async function confirmDeleteAccount() {
    if (!email) {
      setDeleteError("No email in session.");
      return;
    }
    if (confirmText.trim().toLowerCase() !== "delete account") {
      setDeleteError('Please type "delete account" to confirm.');
      return;
    }
    if (!deletePw) {
      setDeleteError("Please enter your password.");
      return;
    }
    setDeleteError(null);
    setDeleteBusy(true);

    try {
      // Reauthenticate first
      const { error: reauthErr } = await supa.auth.signInWithPassword({
        email,
        password: deletePw,
      });
      if (reauthErr) throw new Error("Incorrect password.");

      // Call API
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Delete failed.");
      }

      await supa.auth.signOut();
      router.replace("/");
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  const RegenerateQRCode = async () => {
    setRemakeError(null);
    setAckOldStops(false);
    setAckReprint(false);
    setRemakeOpen(true);
  };

  async function confirmRemakeQRCode() {
    if (!userId) return;
    setRemakeBusy(true);
    setRemakeError(null);
    try {
      const newToken = await rotatePublicToken(supa, userId, generateToken);
      // optional: refetch anything that shows the current QR / token
      setBanner({
        type: "success",
        msg: "New QR code generated. Your previous QR is now inactive.",
      });
      setRemakeOpen(false);
      // TODO: trigger UI that re-renders the QR image for the new token
      // e.g., router.refresh() or setSomeTokenState(newToken)
    } catch (err) {
      setRemakeError(getErrorMessage(err));
    } finally {
      setRemakeBusy(false);
    }
  }

  const exportData = () => {};
  const resetProfile = () => {
    setFullName(originalFullName);
    setPhone(originalPhone);
    setAdditionalInfo(originalAdditionalInfo);
  };

  const tabs = useMemo(
    () =>
      [
        { key: "profile", label: "Profile" },
        { key: "privacy", label: "Privacy" },
        { key: "notifications", label: "Notifications" },
        { key: "subscription", label: "Subscription" },
        { key: "account", label: "Account" },
      ] as { key: TabKey; label: string }[],
    []
  );

  if (loading) {
    return (
      <LoadingScreen
        message="Loading settings…"
        subtext="Fetching your Information"
      />
    );
  }

  return (
    <StyledSettingsPage>
      <StyledSettingsPageHeader>
        <StyledSettingsPageHeaderLeft>
          <NexaButton
            noPadding
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            aria-label="Back to Dashboard"
          >
            Back to Dashboard
          </NexaButton>
        </StyledSettingsPageHeaderLeft>
      </StyledSettingsPageHeader>

      <StyledSettingsPageSettings>
        <StyledSidebar aria-label="Settings sections">
          <SidebarList>
            {tabs.map((t) => (
              <SidebarButton
                key={t.key}
                $active={tab === t.key}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
              >
                {t.label}
              </SidebarButton>
            ))}
          </SidebarList>
        </StyledSidebar>

        <Content>
          {banner ? <Banner $type={banner.type}>{banner.msg}</Banner> : null}

          {tab === "profile" && (
            <div>
              <SectionTitle>Profile</SectionTitle>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfile();
                }}
              >
                <Field>
                  <span>Full name</span>
                  <NexaInput
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Jane Doe"
                    name="display_name"
                    preset="name"
                    blockEmoji
                    maxLength={80}
                    validate={validateName}
                    autoComplete="name"
                    ariaLabel="Full name"
                    showCounter
                    showValidity
                    inputMode="text"
                  />
                </Field>

                <Field>
                  <span>Phone number</span>
                  <NexaInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="+15551234567"
                    name="phone_number"
                    preset="e164"
                    blockEmoji
                    maxLength={16}
                    validate={validateE164}
                    inputMode="tel"
                    autoComplete="tel"
                    ariaLabel="Phone number"
                    showCounter
                    showValidity
                  />
                </Field>

                <Field>
                  <span>Additional information</span>
                  <NexaInput
                    value={additionalInfo}
                    onChange={setAdditionalInfo}
                    placeholder="Notes, preferences, etc."
                    name="additional_information"
                    preset="none"
                    multiline
                    maxLength={280}
                    ariaLabel="Additional information"
                    showCounter
                    showValidity={false}
                    inputMode="text"
                  />
                </Field>

                <Row>
                  <NexaButton
                    variant="primary"
                    type="submit"
                    disabled={loading || !userId}
                  >
                    Save changes
                  </NexaButton>
                  <NexaButton
                    type="button"
                    variant="outline"
                    onClick={resetProfile}
                  >
                    Reset
                  </NexaButton>
                </Row>
              </Form>
            </div>
          )}

          {tab === "privacy" && (
            <div>
              <SectionTitle>Privacy</SectionTitle>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePassword(e);
                }}
              >
                <Field>
                  <span>Current password</span>
                  <NexaInput
                    type="password"
                    value={currentPassword}
                    onChange={(v) => {
                      setCurrentPassword(v);
                      setBanner(null);
                    }}
                    name="current_password"
                    autoComplete="current-password"
                    ariaLabel="Current password"
                    maxLength={128}
                    showValidity={false}
                  />
                </Field>

                <Field>
                  <span>New password</span>
                  <NexaInput
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    name="new_password"
                    ariaLabel="New password"
                    maxLength={128}
                    validate={validatePwStrong}
                    showValidity
                  />
                </Field>

                <Field>
                  <span>Confirm new password</span>
                  <NexaInput
                    type="password"
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    name="confirm_new_password"
                    ariaLabel="Confirm new password"
                    maxLength={128}
                    validate={(s) => validatePwMatch(s, newPassword)}
                    showValidity
                  />
                </Field>

                <Row>
                  <NexaButton
                    type="submit"
                    variant="primary"
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmNewPassword ||
                      !!validatePwStrong(newPassword) ||
                      !!validatePwMatch(confirmNewPassword, newPassword) ||
                      newPassword === currentPassword
                    }
                  >
                    Change password
                  </NexaButton>
                </Row>

                <Helper>
                  For security, we re-authenticate using your current password
                  before applying the change.
                </Helper>
              </Form>
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <SectionTitle>Notifications</SectionTitle>
              {/* Add your preferences here */}
            </div>
          )}
          {tab === "subscription" && (
            <div>
              <SectionTitle>Subscription</SectionTitle>
              <p>{currentTier?.name}</p>
              <p>{currentTier?.price_monthly}</p>
              <p>{currentTier?.max_contacts}</p>
              <p>{currentTier?.description}</p>
            </div>
          )}
          {tab === "account" && (
            <div>
              <SectionTitle>Account</SectionTitle>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Field>
                  <span>Export your data</span>
                  <Helper>
                    Download a copy of your profile, contacts, and related
                    settings.
                  </Helper>
                </Field>
                <Row>
                  <NexaButton
                    variant="primary"
                    type="button"
                    onClick={() => {}}
                  >
                    Export
                  </NexaButton>
                </Row>
                <Field>
                  <span>Generate new QR code</span>
                  <Helper>
                    Create a brand new QR code (new link).{" "}
                    <strong>
                      Your current QR will stop working immediately
                    </strong>{" "}
                    and anyone who scans it will see a “Code revoked” message.
                    You’ll need to update any printed cards, wristbands, or
                    shared links.
                  </Helper>
                </Field>
                <Row>
                  <NexaButton
                    variant="primary"
                    type="button"
                    onClick={RegenerateQRCode}
                    aria-label="Generate a new QR code and revoke the current one"
                  >
                    Remake QR Code
                  </NexaButton>
                </Row>

                <Field>
                  <span>Danger zone</span>
                </Field>
                <DangerBox>
                  <Helper>
                    This will permanently delete your account and all associated
                    data. This action is irreversible.
                  </Helper>
                  <Row style={{ marginTop: 12 }}>
                    <NexaButton
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setDeletePw("");
                        setDeleteError(null);
                        setDeleteOpen(true);
                      }}
                    >
                      Delete account
                    </NexaButton>
                  </Row>
                </DangerBox>
              </Form>
            </div>
          )}
        </Content>
      </StyledSettingsPageSettings>

      {/* --- NEW: Remake QR Modal --- */}
      {remakeOpen && (
        <NexaPopup
          open={remakeOpen}
          type="warning"
          title="Remake your QR code?"
          message="This creates a new QR link and disables your current one."
          disableBackdropClose={remakeBusy}
          disableEscClose={remakeBusy}
          onClose={() => !remakeBusy && setRemakeOpen(false)}
          actions={[
            {
              label: remakeBusy ? "Working…" : "Remake QR",
              onClick: confirmRemakeQRCode,
              variant: "primary",
              disabled: remakeBusy || !ackOldStops || !ackReprint,
              autoFocus: true,
            },
            {
              label: "Cancel",
              onClick: () => setRemakeOpen(false),
              variant: "ghost",
              disabled: remakeBusy,
            },
          ]}
        >
          <div style={{ marginTop: 8 }}>
            <Checklist>
              <CheckItem $ok={ackOldStops}>
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={ackOldStops}
                    onChange={(e) => setAckOldStops(e.target.checked)}
                    disabled={remakeBusy}
                  />
                  I understand my current QR code will stop working immediately.
                </label>
              </CheckItem>
              <CheckItem $ok={ackReprint}>
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={ackReprint}
                    onChange={(e) => setAckReprint(e.target.checked)}
                    disabled={remakeBusy}
                  />
                  I will update any printed items or shared links with the new
                  QR.
                </label>
              </CheckItem>
            </Checklist>

            <Helper style={{ marginTop: 10 }}>
              Your saved profile information does not change. Only the QR link
              is rotated. Scans of the old code will show “Code revoked.”
            </Helper>

            {remakeError ? (
              <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
                {remakeError}
              </p>
            ) : null}
          </div>
        </NexaPopup>
      )}

      {/* --- NEW: Delete Account Modal --- */}
      {deleteOpen && (
        <NexaPopup
          open={deleteOpen}
          type="warning"
          title="Delete your account?"
          message="This will permanently remove your account and all associated data. Please confirm below."
          disableBackdropClose={deleteBusy}
          disableEscClose={deleteBusy}
          onClose={() => !deleteBusy && setDeleteOpen(false)}
          actions={[
            {
              label: deleteBusy ? "Deleting…" : "Delete",
              onClick: confirmDeleteAccount,
              variant: "primary",
              disabled:
                deleteBusy ||
                !deletePw ||
                confirmText.trim().toLowerCase() !== "delete account",
              autoFocus: true,
            },
            {
              label: "Cancel",
              onClick: () => setDeleteOpen(false),
              variant: "ghost",
              disabled: deleteBusy,
            },
          ]}
        >
          <div style={{ marginTop: 8 }}>
            <label
              htmlFor="delete_password"
              style={{ fontSize: 12, display: "block", marginBottom: 6 }}
            >
              Confirm with your password
            </label>
            <NexaInput
              id="delete_password"
              type="password"
              name="delete_password"
              ariaLabel="Confirm password to delete account"
              placeholder="Enter your password"
              value={deletePw}
              onChange={setDeletePw}
              maxLength={128}
              showValidity={false}
              disabled={deleteBusy}
            />

            <label
              htmlFor="confirm_text"
              style={{
                fontSize: 12,
                display: "block",
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              Type <strong>&quot;delete account&quot;</strong> to confirm
            </label>
            <NexaInput
              id="confirm_text"
              name="confirm_text"
              ariaLabel="Type delete account to confirm"
              placeholder="delete account"
              value={confirmText}
              onChange={setConfirmText}
              maxLength={32}
              showValidity={false}
              disabled={deleteBusy}
            />

            {deleteError ? (
              <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
                {deleteError}
              </p>
            ) : null}
          </div>
        </NexaPopup>
      )}

      <NexaFooter />
    </StyledSettingsPage>
  );
}

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    return typeof message === "string" ? message : "Unexpected error";
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}
