"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import { generateToken } from "@/utils/token";
import styled, { css } from "styled-components";

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
          background: #f5f7ff;
          border-color: #cfd8ff;
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
  const [phone, setPhone] = useState("");

  // Notifications
  const [emailUpdates, setEmailUpdates] = useState<boolean>(true);
  const [marketingEmails, setMarketingEmails] = useState<boolean>(false);
  const [qrCodeScans, setQrCodeScans] = useState<boolean>(true);

  // Privacy (password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Misc (you already had these)
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

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
      const { data: sessionData } = await supa.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!mounted) return;

      setEmail(user.email ?? null);
      setUserId(user.id);

      // Load Profile
      const { data: profileRow } = await supa
        .from("profiles")
        .select(
          "full_name, phone_e164, additional_information, email_updates, marketing_emails, qr_code_scans"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileRow) {
        setFullName(profileRow.full_name ?? "");
        setPhone(profileRow.phone_e164 ?? "");
        setAdditionalInfo(profileRow.additional_information ?? "");
        setEmailUpdates(profileRow.email_updates ?? true);
        setMarketingEmails(profileRow.marketing_emails ?? false);
        setQrCodeScans(profileRow.qr_code_scans ?? true);
      }

      // Load contacts (unchanged from your code, kept as example usage)
      const { data: rows } = await supa
        .from("contacts")
        .select("id,name,relationship,phone_e164,priority")
        .order("priority", { ascending: true });
      if (!mounted) return;
      setContacts(rows ?? []);

      // Ensure public link (token) and build URL
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

    return () => {
      mounted = false;
      unsub?.unsubscribe?.();
    };
  }, [router, supa]);

  // Handlers
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supa.from("profiles").upsert({
      user_id: userId,
      full_name: fullName,
      phone_e164: phone,
      additional_information: additionalInfo,
    });
    if (error) return setBanner({ type: "error", msg: error.message });
    setBanner({ type: "success", msg: "Profile updated." });
  };

  const saveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supa.from("profiles").upsert({
      user_id: userId,
      email_updates: emailUpdates,
      marketing_emails: marketingEmails,
      qr_code_scans: qrCodeScans,
    });
    if (error) return setBanner({ type: "error", msg: error.message });
    setBanner({ type: "success", msg: "Notification preferences saved." });
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!email)
      return setBanner({ type: "error", msg: "No email in session." });
    if (newPassword !== confirmNewPassword)
      return setBanner({ type: "error", msg: "New passwords do not match." });

    // Re-auth by signing in with current password
    const { error: signInErr } = await supa.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInErr) {
      return setBanner({
        type: "error",
        msg: "Current password is incorrect.",
      });
    }

    const { error: updateErr } = await supa.auth.updateUser({
      password: newPassword,
    });
    if (updateErr) return setBanner({ type: "error", msg: updateErr.message });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setBanner({ type: "success", msg: "Password changed." });
  };

  const exportData = async () => {
    try {
      setBanner({ type: "info", msg: "Preparing your export…" });
      // Implement an API route that zips user data and returns a download URL
      const res = await fetch("/api/export", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const { url } = await res.json();
      window.location.href = url; // trigger download
      setBanner({ type: "success", msg: "Export started." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e.message ?? "Export failed" });
    }
  };

  const deleteAccount = async () => {
    const sure = window.prompt(
      "Type DELETE to confirm you want to permanently delete your account."
    );
    if (sure !== "DELETE") return;

    try {
      setBanner({ type: "info", msg: "Deleting account…" });
      // Implement securely server-side (Edge Function / API Route) as this requires elevated privileges
      const res = await fetch("/api/delete-account", { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");
      // After deletion, sign out and redirect
      await supa.auth.signOut();
      router.replace("/goodbye");
    } catch (e: any) {
      setBanner({ type: "error", msg: e.message ?? "Delete failed" });
    }
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

  return (
    <StyledSettingsPage>
      <StyledSettingsPageHeader>
        <StyledSettingsPageHeaderLeft>
          <StyledSettingsPageHeaderReturnButton
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </StyledSettingsPageHeaderReturnButton>
          <StyledSettingsPageHeaderLogo>Settings</StyledSettingsPageHeaderLogo>
        </StyledSettingsPageHeaderLeft>
        {publicUrl ? (
          <Helper>
            Your public page:{" "}
            <a href={publicUrl} target="_blank">
              {publicUrl}
            </a>
          </Helper>
        ) : null}
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
              <Form onSubmit={saveProfile}>
                <Field>
                  <span>Full name</span>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field>
                  <span>Phone number</span>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15551234567"
                  />
                </Field>
                <Field>
                  <span>Additional information</span>
                  <Input
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Notes, preferences, etc."
                  />
                </Field>
                <Row>
                  <Button type="submit">Save changes</Button>
                  <Button
                    type="button"
                    $variant="ghost"
                    onClick={() => {
                      setFullName("");
                      setPhone("");
                    }}
                  >
                    Reset
                  </Button>
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
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <span>New password</span>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <span>Confirm new password</span>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </Field>
                <Row>
                  <Button type="submit">Change password</Button>
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
              <Form onSubmit={saveNotifications}>
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
              </Form>
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
                  <Button type="button" onClick={exportData}>
                    Export
                  </Button>
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
                    <Button
                      type="button"
                      $variant="danger"
                      onClick={deleteAccount}
                    >
                      Delete account
                    </Button>
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
