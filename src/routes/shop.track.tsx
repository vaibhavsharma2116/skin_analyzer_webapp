import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, MapPin } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/track")({
  head: () => ({ meta: [{ title: "Track Order — SKIN POP" }] }),
  component: TrackPage,
});

const EVENTS = [
  { label: "Shipped", note: "Your order has been shipped", when: "13 May, 11:15 AM", done: true },
  { label: "Out for Delivery", note: "Your order is out for delivery", when: "14 May, 09:30 AM", done: true },
  { label: "Expected Delivery", note: "Your order will be delivered today", when: "15 May, 08:00 PM", done: false },
];

function TrackPage() {
  const navigate = useNavigate();
  return (
    <DeviceFrame
      title="Track Order"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/order" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-sage/15 to-coral/10">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.25) 0 8px, transparent 9px), radial-gradient(circle at 70% 60%, hsl(var(--primary)/0.25) 0 8px, transparent 9px)" }} />
        <MapPin className="h-10 w-10 text-primary drop-shadow" />
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Estimated Delivery</p>
        <p className="mt-1 text-lg font-bold text-foreground">15 May 2024</p>
        <p className="text-xs text-muted-foreground">By 8:00 PM</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Delivery</p>
        <p className="mt-1 text-sm font-semibold text-foreground">Tracking ID: 1234567890</p>
      </div>

      <div className="mt-5 space-y-4">
        {EVENTS.map((e, idx) => (
          <div key={e.label} className="flex items-start gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              {e.done ? <CheckCircle2 className="h-5 w-5 text-sage" /> : <Circle className="h-5 w-5 text-muted-foreground/50" />}
              {idx < EVENTS.length - 1 && <span className={`mt-1 h-10 w-px ${e.done ? "bg-sage" : "bg-border"}`} />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{e.when}</p>
              <p className={`text-sm font-semibold ${e.done ? "text-foreground" : "text-muted-foreground"}`}>{e.label}</p>
              <p className="text-xs text-muted-foreground">{e.note}</p>
            </div>
          </div>
        ))}
      </div>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/delivered" })}>
        Mark as Delivered (demo)
      </Button>
    </DeviceFrame>
  );
}
