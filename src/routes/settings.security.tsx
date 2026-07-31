import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Fingerprint, ShieldAlert, LogOut, Trash2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/settings/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const navigate = useNavigate();
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null);
  
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // MFA Flow States
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [setupFactorId, setSetupFactorId] = useState("");

  useEffect(() => {
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totpFactors = data.totp || [];
      const verified = totpFactors.find(f => f.status === "verified");
      setTwoFaEnabled(!!verified);
      setEnrolledFactorId(verified?.id || null);
    } catch (e) {
      console.error("Failed to check MFA status", e);
    }
  }

  async function updatePassword() {
    setMsg(null);
    if (next.length < 8) return setMsg({ kind: "err", text: "Password must be at least 8 characters" });
    if (next !== confirm) return setMsg({ kind: "err", text: "Passwords don't match" });
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      setMsg({ kind: "ok", text: "Password updated" });
      setCurr(""); setNext(""); setConfirm("");
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleTwoFa() {
    if (twoFaEnabled) {
      // Disable MFA
      if (!enrolledFactorId) return;
      const confirmDisable = window.confirm("Are you sure you want to disable Two-Factor Authentication?");
      if (!confirmDisable) return;
      
      try {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId });
        if (error) throw error;
        setTwoFaEnabled(false);
        setEnrolledFactorId(null);
      } catch (e) {
        alert("Failed to disable 2FA: " + (e as Error).message);
      }
    } else {
      // Enable MFA - Start Setup
      try {
        setMfaError("");
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (error) throw error;
        
        setSetupFactorId(data.id);
        setQrCodeUri(data.totp.qr_code);
        setTotpSecret(data.totp.secret);
        setShowMfaSetup(true);
      } catch (e) {
        alert("Failed to start 2FA setup: " + (e as Error).message);
      }
    }
  }

  async function verifyAndEnableMfa() {
    setMfaError("");
    if (!verificationCode || verificationCode.length !== 6) {
      setMfaError("Please enter a valid 6-digit code.");
      return;
    }
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: setupFactorId });
      if (challenge.error) throw challenge.error;
      
      const verify = await supabase.auth.mfa.verify({
        factorId: setupFactorId,
        challengeId: challenge.data.id,
        code: verificationCode
      });
      if (verify.error) throw verify.error;
      
      // Success
      setShowMfaSetup(false);
      setVerificationCode("");
      await checkMfaStatus();
    } catch (e) {
      setMfaError((e as Error).message);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate({ to: "/auth" });
    }
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.prompt("Are you sure? This action is irreversible. Type 'DELETE' to confirm.");
    if (confirmDelete === "DELETE") {
      try {
        const { error } = await supabase.rpc("delete_user_account");
        if (error) throw error;
        // Sign out locally
        await supabase.auth.signOut();
        navigate({ to: "/auth" });
      } catch (e) {
        alert("Failed to delete account. Note: You must run the SQL setup snippet in Supabase first. Error: " + (e as Error).message);
      }
    }
  }

  return (
    <DeviceFrame
      title="Account & Security"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <Group title="Change Password">
        <div className="space-y-3 p-4">
          <PasswordField label="New Password" value={next} onChange={setNext} show={show} toggle={() => setShow(!show)} />
          <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} show={show} toggle={() => setShow(!show)} />
          {msg && (
            <p className={`rounded-xl px-3 py-2 text-xs ${msg.kind === "ok" ? "bg-primary/10 text-primary" : "bg-coral/10 text-coral"}`}>
              {msg.text}
            </p>
          )}
          <Button size="lg" className="h-11 w-full rounded-2xl" disabled={saving || !next} onClick={updatePassword}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </Group>

      <Group title="Security">
        <ToggleRow
          icon={ShieldAlert}
          label="Two-Factor Authentication"
          desc="Add extra security to your account"
          on={twoFaEnabled}
          onToggle={toggleTwoFa}
        />
      </Group>

      {/* MFA Setup Modal / Section */}
      {showMfaSetup && (
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-foreground">Setup 2FA</h3>
          <p className="mb-4 text-xs text-muted-foreground">Scan this QR code with your Authenticator app (like Google Authenticator or Authy).</p>
          
          {/* We parse the URI from Supabase directly instead of rendering it as SVG string if we want, 
              but Supabase actually returns a valid URI that qrcode.react can use */}
          <div className="mb-4 flex justify-center rounded-xl bg-white p-4">
            <QRCodeSVG value={qrCodeUri} size={160} />
          </div>
          
          <p className="mb-4 text-center text-xs text-muted-foreground">
            Secret: <span className="font-mono text-foreground">{totpSecret}</span>
          </p>
          
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            {mfaError && <p className="text-xs text-coral">{mfaError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setShowMfaSetup(false)}>Cancel</Button>
              <Button className="w-full" onClick={verifyAndEnableMfa}>Verify</Button>
            </div>
          </div>
        </div>
      )}

      <Group title="Account">
        <RowLink icon={LogOut} label="Sign Out" desc="Sign out of your account on this device" onClick={handleSignOut} />
        <RowLink icon={Trash2} label="Delete Account" desc="Permanently delete your account and data" danger onClick={handleDeleteAccount} />
      </Group>
    </DeviceFrame>
  );
}

function PasswordField({
  label, value, onChange, show, toggle,
}: { label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="pr-10"
        />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle visibility">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">{children}</div>
    </div>
  );
}

function ToggleRow({
  icon: Icon, label, desc, on, onToggle,
}: { icon: typeof Fingerprint; label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function RowLink({
  icon: Icon, label, desc, danger, onClick
}: { icon: typeof Fingerprint; label: string; desc: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-secondary/40"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
