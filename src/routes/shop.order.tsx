import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { getLastOrder, orderDetailedItems, type Order } from "@/lib/order";

export const Route = createFileRoute("/shop/order")({
  head: () => ({ meta: [{ title: "Order Details — SKIN POP" }] }),
  component: OrderPage,
});

const STEPS = [
  { label: "Order Confirmed", when: "12 May 2024, 10:45 AM", done: true },
  { label: "Packed", when: "12 May 2024, 02:30 PM", done: true },
  { label: "Shipped", when: "13 May 2024, 11:15 AM", done: true },
  { label: "Out for Delivery", when: "14 May 2024, 09:30 AM", done: false },
  { label: "Delivered", when: "Expected by 15 May 2024", done: false },
];

function OrderPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => setOrder(getLastOrder()), []);

  if (!order) {
    return (
      <DeviceFrame
        title="Order Details"
        leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop" })}><ArrowLeft className="h-4 w-4" /></button>}
      >
        <p className="text-sm text-muted-foreground">No recent order.</p>
      </DeviceFrame>
    );
  }

  const items = orderDetailedItems(order);

  return (
    <DeviceFrame
      title="Order Details"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/confirmed" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="text-sm font-bold text-foreground">#{order.id}</p>
          </div>
          <span className="rounded-full bg-sage/20 px-3 py-1 text-[11px] font-semibold text-sage">Confirmed</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Placed on {new Date(order.placedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {items.map(({ product, qty }) => (
          <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${product.tone}`}>{product.emoji}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {qty}</p>
            </div>
            <p className="text-sm font-bold text-primary">{product.price}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-foreground">Order Tracking</p>
      <div className="mt-3 space-y-4">
        {STEPS.map((s, idx) => (
          <div key={s.label} className="flex items-start gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              {s.done ? (
                <CheckCircle2 className="h-5 w-5 text-sage" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
              {idx < STEPS.length - 1 && <span className={`mt-1 h-8 w-px ${s.done ? "bg-sage" : "bg-border"}`} />}
            </div>
            <div className="pb-2">
              <p className={`text-sm font-semibold ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.when}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-6 h-12 w-full rounded-2xl">Download Invoice</Button>
      <Button className="mt-2 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/track" })}>
        Track Order
      </Button>
    </DeviceFrame>
  );
}
