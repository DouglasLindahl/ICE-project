"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import { generateToken } from "@/utils/token";
import styled, { css } from "styled-components";
import {
  buildPublicUrl,
  fetchContacts,
  fetchProfile,
  getOrCreatePublicToken,
  getSessionUser,
  updateAdditionalInfo,
  upsertProfile,
} from "../utils";
import {
  RestrictedInput,
  validateE164,
  validateName,
} from "@/components/RestrictedInput/page";
import { profile } from "console";
import { theme } from "../../../styles/theme";
import { CustomButton } from "@/components/CustomButton/page";
import { LoadingScreen } from "@/components/LoadingScreen/page";
import { AuthError } from "@supabase/supabase-js";

// Types
type Contact = {
  id: string;
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

// Tabs
type TabKey = "profile" | "privacy" | "notifications" | "account";

// Styled Components
const StyledSettingsPage = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
`;

const StyledSettingsPageHeader = styled.div`
  width: 100%;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  gap: 16px;
  border-bottom: 1px solid #eee;
`;

const StyledSettingsPageHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StyledSettingsPageHeaderReturnButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
`;

const StyledSettingsPageHeaderLogo = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const StyledSettingsPageSettings = styled.div`
  width: 100%;
  height: calc(100vh - 90px);
  display: grid;
  grid-template-columns: 280px 1fr;
`;

const StyledSidebar = styled.div`
  border-right: 1px solid #eee;
  padding: 24px;
`;

const SidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SidebarButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  ${(p) =>
    p.$active
      ? css`
          background: #ffecbaff;
          border-color: ${theme.colors.accent};
          font-weight: 600;
        `
      : css`
          &:hover {
            background: #fafafa;
            border-color: #eee;
          }
        `}
`;

const Content = styled.div`
  padding: 32px 48px;
  overflow: auto;
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px;
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 560px;
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
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
`;

const Button = styled.button<{ $variant?: "primary" | "ghost" | "danger" }>`
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  ${(p) =>
    p.$variant === "danger"
      ? css`
          background: #ffeaea;
          border-color: #ffc7c7;
          color: #a00000;
        `
      : p.$variant === "ghost"
      ? css`
          background: transparent;
          border-color: #ddd;
        `
      : css`
          background: #111827;
          color: white;
        `}
`;

const Helper = styled.p`
  color: #666;
  font-size: 13px;
  margin: 0;
`;

const Banner = styled.div<{ $type?: "info" | "success" | "error" }>`
  margin: 8px 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
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
  padding: 16px;
  max-width: 560px;
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

  const saveProfile = async () => {
    const row = {
      user_id: userId,
      display_name: fullName,
      phone_number: phone,
      additional_information: additionalInfo,
    };

    try {
      await upsertProfile(supa, row);
      console.log("Profile saved!");
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };
  const changePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBanner(null);

    if (!email) {
      setBanner({ type: "error", msg: "No email found in session." });
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setBanner({ type: "error", msg: "Please fill out all password fields." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setBanner({ type: "error", msg: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setBanner({
        type: "error",
        msg: "Password must be at least 8 characters.",
      });
      return;
    }

    try {
      // 1) Re-authenticate to be safe
      const { error: signInErr } = await supa.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInErr) throw signInErr;

      // 2) Update password
      const { error: updateErr } = await supa.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      setBanner({ type: "success", msg: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      setBanner({
        type: "error",
        msg: getErrorMessage(err),
      });
    }
  };

  const saveNotifications = () => {};
  const exportData = () => {};
  const deleteAccount = () => {};
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
          <CustomButton
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </CustomButton>
          <StyledSettingsPageHeaderLogo>
            Profile Settings
          </StyledSettingsPageHeaderLogo>
        </StyledSettingsPageHeaderLeft>
      </StyledSettingsPageHeader>

      <StyledSettingsPageSettings>
        <StyledSidebar>
          <SidebarList>
            {tabs.map((t) => (
              <SidebarButton
                key={t.key}
                $active={tab === t.key}
                onClick={() => setTab(t.key)}
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
                  <RestrictedInput
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
                  <RestrictedInput
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
                  <RestrictedInput
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
                  <CustomButton
                    variant="primary"
                    type="submit"
                    disabled={loading || !userId}
                  >
                    Save changes
                  </CustomButton>
                  <CustomButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetProfile();
                    }}
                  >
                    Reset
                  </CustomButton>
                </Row>
              </Form>
            </div>
          )}

          {tab === "privacy" && (
            <div>
              <SectionTitle>Privacy</SectionTitle>
              <Form onSubmit={changePassword}>
                <Field>
                  <span>Current password</span>
                  <RestrictedInput
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    name="current_password"
                    autoComplete="current-password"
                    ariaLabel="Current password"
                    maxLength={128}
                    showValidity={false}
                  />
                </Field>

                <Field>
                  <span>New password</span>
                  <RestrictedInput
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    name="new_password"
                    autoComplete="new-password"
                    ariaLabel="New password"
                    maxLength={128}
                    showValidity
                  />
                </Field>

                <Field>
                  <span>Confirm new password</span>
                  <RestrictedInput
                    type="password"
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    name="confirm_new_password"
                    autoComplete="new-password"
                    ariaLabel="Confirm new password"
                    maxLength={128}
                    validate={(s) =>
                      !s
                        ? null
                        : s !== newPassword
                        ? "Passwords don't match."
                        : null
                    }
                    showValidity
                  />
                </Field>

                <Row>
                  <CustomButton
                    type="submit"
                    variant="primary"
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmNewPassword ||
                      newPassword !== confirmNewPassword ||
                      newPassword.length < 8
                    }
                  >
                    Change password
                  </CustomButton>
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
              {/*  <Form onSubmit={saveNotifications}>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={emailUpdates}
                    onChange={(e) => setEmailUpdates(e.target.checked)}
                  />
                  <span>Email updates</span>
                </CheckboxRow>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                  />
                  <span>Marketing emails</span>
                </CheckboxRow>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={qrCodeScans}
                    onChange={(e) => setQrCodeScans(e.target.checked)}
                  />
                  <span>QR code scans</span>
                </CheckboxRow>
                <Row>
                  <Button type="submit">Save preferences</Button>
                </Row>
              </Form>*/}
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
                  <CustomButton
                    variant="primary"
                    type="button"
                    onClick={exportData}
                  >
                    Export
                  </CustomButton>
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
                    <CustomButton
                      type="button"
                      variant="danger"
                      onClick={deleteAccount}
                    >
                      Delete account
                    </CustomButton>
                  </Row>
                </DangerBox>
              </Form>
            </div>
          )}
        </Content>
      </StyledSettingsPageSettings>
    </StyledSettingsPage>
  );
}
function getErrorMessage(err: unknown): string {
  throw new Error("Function not implemented.");
}
