import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Fingerprint, ShieldAlert, Smartphone, Trash2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings/security")({
  component: SecurityPage,
});

const STORAGE_KEY = "skinpop.settings.security";

type SecState = { biometric: boolean; twofa: boolean };
const DEFAULTS: SecState = { biometric: true, twofa: false };

function SecurityPage() {
  const navigate = useNavigate();
  const [sec, setSec] = useState<SecState>(DEFAULTS);
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSec({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function toggle<K extends keyof SecState>(k: K) {
    setSec((s) => {
      const n = { ...s, [k]: !s[k] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); } catch {}
      return n;
    });
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

  return (
    <DeviceFrame
      title="Account & Security"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <Group title="Change Password">
        <div className="space-y-3 p-4">
          <PasswordField label="Current Password" value={curr} onChange={setCurr} show={show} toggle={() => setShow(!show)} />
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
          icon={Fingerprint}
          label="Biometric Login"
          desc="Use Face ID / Fingerprint to login"
          on={sec.biometric}
          onToggle={() => toggle("biometric")}
        />
        <ToggleRow
          icon={ShieldAlert}
          label="Two-Factor Authentication"
          desc="Add extra security to your account"
          on={sec.twofa}
          onToggle={() => toggle("twofa")}
        />
      </Group>

      <Group title="Account">
        <RowLink icon={Smartphone} label="Manage Devices" desc="View and manage your logged in devices" />
        <RowLink icon={Trash2} label="Delete Account" desc="Permanently delete your account and data" danger />
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
  icon: Icon, label, desc, danger,
}: { icon: typeof Fingerprint; label: string; desc: string; danger?: boolean }) {
  return (
    <button
      type="button"
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
