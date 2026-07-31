import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Gift, Mail, Megaphone, PackageCheck, Sparkles, TrendingUp } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";

export const Route = createFileRoute("/settings/notifications")({
  component: NotificationsSettingsPage,
});

const STORAGE_KEY = "skinpop.settings.notifications";

type NotifState = Record<string, boolean>;

const PUSH = [
  { key: "push_all", label: "Allow Notifications", desc: "Master toggle for push notifications" },
  { key: "push_scan", label: "Scan Results & Analysis", desc: "Get notified when your scan is ready", icon: Sparkles },
  { key: "push_reminders", label: "Reminders & Routines", desc: "Routine reminders & updates", icon: Bell },
  { key: "push_tips", label: "Tips & Articles", desc: "New tips, articles & expert advice", icon: TrendingUp },
  { key: "push_offers", label: "Product & Offers", desc: "New launches, offers & discounts", icon: Gift },
  { key: "push_orders", label: "Order Updates", desc: "Shipping & order notifications", icon: PackageCheck },
];

const EMAIL = [
  { key: "email_all", label: "Allow Email Notifications", desc: "Master toggle for emails" },
  { key: "email_weekly", label: "Weekly Summary", desc: "Your weekly skin progress report", icon: Mail },
  { key: "email_recs", label: "Product Recommendations", desc: "Personalized product suggestions", icon: Sparkles },
  { key: "email_marketing", label: "Marketing Emails", desc: "Offers, updates & newsletters", icon: Megaphone },
];

const DEFAULTS: NotifState = {
  push_all: true, push_scan: true, push_reminders: true, push_tips: true, push_offers: false, push_orders: true,
  email_all: true, email_weekly: true, email_recs: true, email_marketing: false,
};

function NotificationsSettingsPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<NotifState>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  async function toggle(k: string) {
    let nextValue = !state[k];
    
    // If turning on push_all or any push setting, request permission first
    if (k.startsWith("push_") && nextValue) {
      if ("Notification" in window && "serviceWorker" in navigator) {
        if (Notification.permission !== "granted") {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") {
            toast.error("Notification permission denied");
            nextValue = false; // Revert the change
          }
        }
        
        if (nextValue && k === "push_all") {
          try {
            const registration = await navigator.serviceWorker.ready;
            const existingSub = await registration.pushManager.getSubscription();
            
            if (!existingSub) {
              const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
              if (publicKey) {
                const sub = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: publicKey,
                });
                
                const subJson = sub.toJSON();
                if (subJson.endpoint && subJson.keys) {
                  const { savePushSubscription } = await import("@/lib/push.functions");
                  await savePushSubscription({ 
                    data: {
                      endpoint: subJson.endpoint,
                      keys: {
                        p256dh: subJson.keys.p256dh!,
                        auth: subJson.keys.auth!,
                      }
                    } 
                  });
                  toast.success("Push notifications enabled!");
                }
              }
            }
          } catch (e) {
            console.error("Failed to subscribe to push", e);
            toast.error("Failed to enable push notifications");
          }
        }
      } else {
        toast.error("Your browser does not support notifications");
        nextValue = false;
      }
    }
    
    // If disabling push_all, we could unsubscribe, but for now we just toggle the setting
    if (k === "push_all" && !nextValue) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const { removePushSubscription } = await import("@/lib/push.functions");
          await removePushSubscription({ data: { endpoint: existingSub.endpoint } });
          await existingSub.unsubscribe();
          toast.success("Push notifications disabled");
        }
      } catch (e) {
        console.error("Failed to unsubscribe", e);
      }
    }

    setState((s) => {
      const next = { ...s, [k]: nextValue };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function testNotification() {
    if (!("Notification" in window)) {
      toast.error("Your browser does not support notifications");
      return;
    }
    
    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
    }

    if (perm === "granted") {
      new Notification("Test Notification", {
        body: "Your notifications are working correctly!",
        icon: "/icon-192.png",
      });
      toast.success("Test notification sent!");
    } else {
      toast.error("Please enable push notifications in your browser settings");
    }
  }

  return (
    <DeviceFrame
      title="Notifications"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <Group title="Push Notifications">
        {PUSH.map((r) => (
          <ToggleRow key={r.key} label={r.label} desc={r.desc} icon={r.icon} on={state[r.key]} onToggle={() => toggle(r.key)} />
        ))}
      </Group>

      <Group title="Email Notifications">
        {EMAIL.map((r) => (
          <ToggleRow key={r.key} label={r.label} desc={r.desc} icon={r.icon} on={state[r.key]} onToggle={() => toggle(r.key)} />
        ))}
      </Group>

      <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Stay updated, your way!</p>
            <p className="text-xs text-muted-foreground">You can change notification preferences anytime.</p>
          </div>
        </div>
        <button
          onClick={testNotification}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Test Notification
        </button>
      </div>
    </DeviceFrame>
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
  label, desc, icon: Icon, on, onToggle,
}: { label: string; desc: string; icon?: typeof Bell; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-3">
        {(!label.includes("Scan") && !label.includes("Reminders") && !label.includes("Allow")) && (
          <span className="rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
            COMING SOON
          </span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={onToggle}
          disabled={!label.includes("Scan") && !label.includes("Reminders") && !label.includes("Allow")}
          className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-border"} ${(!label.includes("Scan") && !label.includes("Reminders") && !label.includes("Allow")) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
    </div>
  );
}
