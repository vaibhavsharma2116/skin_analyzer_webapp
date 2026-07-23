import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/delivered")({
  head: () => ({ meta: [{ title: "Order Delivered — SKIN POP" }] }),
  component: DeliveredPage,
});

function DeliveredPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);

  return (
    <DeviceFrame
      title="Order Delivered"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/track" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="flex flex-col items-center pt-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage/25">
          <CheckCircle2 className="h-12 w-12 text-sage" strokeWidth={2.2} />
        </div>
        <p className="mt-5 text-lg font-bold text-foreground">Your order has been delivered.</p>
        <p className="mt-1 text-center text-sm text-muted-foreground">We hope you loved your experience!</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 text-center">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Delivered on</p>
        <p className="mt-1 text-base font-bold text-foreground">15 May 2024, 04:15 PM</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-5 text-center">
        <p className="text-sm font-semibold text-foreground">How was your experience?</p>
        <p className="mt-1 text-xs text-muted-foreground">Rate your experience</p>
        <div className="mt-3 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
        <button className="mt-3 text-xs font-semibold text-primary">Write a Review</button>
      </div>

      <Button variant="outline" className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop" })}>
        Continue Shopping
      </Button>
    </DeviceFrame>
  );
}
