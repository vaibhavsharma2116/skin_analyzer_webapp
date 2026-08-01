import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Globe2,
  HardDrive,
  HelpCircle,
  Home,
  Info,
  LogOut,
  Palette,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profiles.functions";

export const Route = createFileRoute("/settings/")({
  component: SettingsHome,
});

function SettingsHome() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const [name, setName] = useState("Guest");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
    void fetchProfile()
      .then((p) => {
        const full = (p as { full_name?: string | null } | null)?.full_name?.trim();
        if (full) setName(full);
      })
      .catch(() => {});
  }, [fetchProfile]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DeviceFrame
      title="Settings"
      leftSlot={
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="icon-button"
          aria-label="Back to home"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      }
      rightSlot={<button className="icon-button" aria-label="Notifications" onClick={() => navigate({ to: "/settings/notifications" })}><Bell className="h-4 w-4" /></button>}
    >
      <button
        type="button"
        onClick={() => navigate({ to: "/settings/personal" })}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">Hi, {name.split(" ")[0]} 👋</p>
          <p className="truncate text-xs text-muted-foreground">{email || "Tap to view profile"}</p>
        </div>
        <span className="text-xs font-medium text-primary">Edit</span>
      </button>

      <Section title="Account">
        <Row icon={UserRound} label="Personal Information" onClick={() => navigate({ to: "/settings/personal" })} />
        <Row icon={Sparkles} label="Skin Profile" onClick={() => navigate({ to: "/settings/personal" })} />
        <Row icon={ShieldCheck} label="Account & Security" onClick={() => navigate({ to: "/settings/security" })} />
      </Section>

      <Section title="Preferences">
        <Row icon={BellRing} label="Notifications" onClick={() => navigate({ to: "/settings/notifications" })} />
        <Row icon={Bell} label="Reminders" onClick={() => navigate({ to: "/reminders" })} />
        <Row icon={Globe2} label="Units & Language" onClick={() => navigate({ to: "/settings/preferences" })} />
        <Row icon={Palette} label="Appearance" onClick={() => navigate({ to: "/settings/preferences" })} trailing="Light" />
      </Section>

      <Section title="App Settings">
        <Row icon={Shield} label="Privacy & Data" onClick={() => navigate({ to: "/settings/security" })} />
        <Row icon={Fingerprint} label="Permission Manager" onClick={() => navigate({ to: "/settings/security" })} />
        <Row icon={HardDrive} label="Data & Storage" onClick={() => navigate({ to: "/settings/preferences" })} />
      </Section>

      <Section title="Support">
        <Row icon={HelpCircle} label="Help & Support" onClick={() => navigate({ to: "/settings/support" })} />
        <Row icon={Star} label="Rate Skin Pop" />
        <Row icon={Info} label="About Skin Pop" trailing="v2.4.0" />
      </Section>

      <button
        type="button"
        onClick={signOut}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </DeviceFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  trailing?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left last:border-b-0 hover:bg-secondary/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {trailing && <span className="text-xs text-muted-foreground">{trailing}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
