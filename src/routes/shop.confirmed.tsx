import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/cart";
import { getLastOrder, type Order } from "@/lib/order";

export const Route = createFileRoute("/shop/confirmed")({
  head: () => ({ meta: [{ title: "Order Confirmed — SKIN POP" }] }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => setOrder(getLastOrder()), []);

  if (!order) {
    return (
      <DeviceFrame title="Order Confirmed">
        <p className="text-sm text-muted-foreground">No recent order.</p>
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame title="Order Confirmed">
      <div className="flex flex-col items-center pt-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage/25">
          <CheckCircle2 className="h-12 w-12 text-sage" strokeWidth={2.2} />
        </div>
        <p className="mt-5 text-xl font-bold text-foreground">Thank you, {order.address.name.split(" ")[0]}!</p>
        <p className="mt-1 text-sm text-muted-foreground">Your order has been placed successfully.</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 text-sm">
        <Row label="Order ID" value={<span className="font-semibold">{order.id}</span>} />
        <Row label="Order Date" value={new Date(order.placedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
        <Row label="Total Paid" value={<span className="font-bold text-foreground">{formatINR(order.total)}</span>} />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">A confirmation email has been sent to</p>
      <p className="text-center text-sm font-semibold text-primary">john.doe@email.com</p>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop" })}>Continue Shopping</Button>
      <Button variant="ghost" className="mt-2 h-11 w-full rounded-2xl text-primary" onClick={() => navigate({ to: "/shop/order" })}>
        View Order Details
      </Button>
    </DeviceFrame>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
