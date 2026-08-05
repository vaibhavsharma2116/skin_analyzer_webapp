import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpenText,
  ChevronRight,
  Heart,
  History,
  Home,
  LogOut,
  Menu,
  ScanFace,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DeviceFrame } from "@/components/app/device-frame";
import { scoreTone } from "@/components/app/metric-tokens";
import type { ScanRow } from "@/lib/skin-analysis.functions";

type DashboardProfile = {
  full_name?: string | null;
  skin_type?: string | null;
  primary_concern?: string | null;
};

interface DashboardHomeProps {
  profile: DashboardProfile | null;
  latest: ScanRow | null;
  onSignOut: () => void;
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const scoreAngle = Math.max(0, Math.min(100, score));

  return (
    <div className="relative mx-auto h-32 w-56">
      <div
        className="absolute inset-x-0 top-0 mx-auto h-28 w-56 rounded-t-full"
        style={{
          background: `conic-gradient(from 210deg, var(--coral) 0deg 110deg, var(--primary) 110deg 235deg, var(--sage) 235deg ${210 + scoreAngle * 1.5}deg, color-mix(in oklab, var(--border) 70%, transparent) ${210 + scoreAngle * 1.5}deg 360deg)`,
          WebkitMask: "radial-gradient(circle at bottom, transparent 58%, black 59%)",
          mask: "radial-gradient(circle at bottom, transparent 58%, black 59%)",
        }}
      />
      <div className="absolute inset-x-0 top-10 text-center">
        <div className="text-5xl font-semibold text-primary">{score}</div>
        <div className="text-sm text-muted-foreground">/100</div>
        <div className="mt-1 text-base font-semibold text-sage">{label}</div>
      </div>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof ScanFace;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function HamburgerMenu({ onSignOut }: { onSignOut: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = [
    { icon: Sparkles, label: "AI Recommendations", path: "/recommendations" },
    { icon: Heart, label: "Favorites & Saved", path: "/favorites" },
    { icon: Bell, label: "Reminders", path: "/reminders" },
    { icon: UserRound, label: "Profile", path: "/settings" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const go = (path: string) => {
    setOpen(false);
    navigate({ to: path as any });
  };

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="icon-button" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/70 p-5 text-left">
            <SheetTitle className="text-xl font-bold text-primary">SKIN POP</SheetTitle>
            <p className="text-xs text-muted-foreground">Your daily skin companion</p>
          </SheetHeader>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => go(item.path)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-border/70 p-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-destructive transition hover:bg-destructive/5"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardHome({ profile, latest, onSignOut }: DashboardHomeProps) {
  const navigate = useNavigate();
  const goScan = () => navigate({ to: "/scan" });
  const goHistory = () => navigate({ to: "/history" });
  const firstName = useMemo(() => {
    const raw = profile?.full_name?.trim();
    if (!raw) return "John";
    return raw.split(" ")[0];
  }, [profile?.full_name]);

  return (
    <DeviceFrame
      title="Dashboard"
      leftSlot={
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="Home"><Home className="h-4 w-4" /></button>
          <HamburgerMenu onSignOut={onSignOut} />
        </div>
      }
      rightSlot={<button className="icon-button" aria-label="Notifications" onClick={() => navigate({ to: "/settings/notifications" })}><Bell className="h-4 w-4" /></button>}
      footer={
        <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground">
          {[
            { label: "Home", icon: Home, active: true, onClick: () => {} },
            { label: "History", icon: History, onClick: goHistory },
            { label: "Scan", icon: ScanFace, onClick: goScan },
            { label: "Tips", icon: Sparkles, onClick: () => navigate({ to: "/tips" }) },
            { label: "Profile", icon: UserRound, onClick: () => navigate({ to: "/settings" }) },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={item.active ? "font-semibold text-primary" : undefined}>{item.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="rounded-[28px] bg-gradient-card px-5 py-5 shadow-sm">
        <p className="text-2xl font-semibold text-foreground">Hello, {firstName}! 👋</p>
      </div>

      <div className="mt-5 rounded-[28px] border border-border/70 bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-foreground">
          {latest ? "Latest Skin Score" : "Skin Score"}
        </p>
        {latest ? (
          <>
            <ScoreGauge score={latest.overall_score} label={scoreTone(latest.overall_score).label} />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Scanned {new Date(latest.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <Button
              size="lg"
              className="mt-3 h-11 w-full rounded-2xl"
              onClick={() => navigate({ to: "/history/$id", params: { id: latest.id } })}
            >
              View Detailed Results
            </Button>
          </>
        ) : (
          <>
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No scans yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Run your first scan to see your skin score.</p>
            </div>
            <Button size="lg" className="mt-1 h-11 w-full rounded-2xl" onClick={goScan}>
              Start your first scan
            </Button>
          </>
        )}
      </div>


      <div className="mt-5 space-y-3">
        <MenuRow icon={ScanFace} title="Quick Scan" subtitle="Prep, capture, and start a new analysis" onClick={goScan} />
        <MenuRow icon={History} title="History" subtitle="Compare progress and revisit past scans" onClick={goHistory} />
        <MenuRow icon={BookOpenText} title="Tips" subtitle="Articles, routines, and expert guidance" onClick={() => navigate({ to: "/tips" })} />
        <MenuRow icon={ShoppingBag} title="Shop" subtitle="Curated skincare & sunscreen products" onClick={() => navigate({ to: "/shop" })} />
      </div>
    </DeviceFrame>
  );
}
