import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { useCart, formatINR } from "@/lib/cart";
import { useSelectedAddress } from "./shop.address";
import { useSelectedPayment } from "./shop.payment";

export const Route = createFileRoute("/shop/review")({
  head: () => ({ meta: [{ title: "Review Order — SKIN POP" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const { detailed, subtotal, gst, total, clear } = useCart();
  const { address } = useSelectedAddress();
  const { method } = useSelectedPayment();

  const placeOrder = () => {
    if (typeof window !== "undefined") {
      const order = {
        id: `SKPOP${Math.floor(100000 + Math.random() * 900000)}`,
        placedAt: new Date().toISOString(),
        items: detailed.map((d) => ({ id: d.product.id, qty: d.qty })),
        total,
        subtotal,
        gst,
        address,
        method,
      };
      localStorage.setItem("skinpop.lastOrder", JSON.stringify(order));
    }
    clear();
    navigate({ to: "/shop/confirmed" });
  };

  return (
    <DeviceFrame
      title="Review Order"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/payment" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Delivery Address</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{address.label}</p>
            <p className="text-sm text-foreground">{address.name}</p>
            <p className="whitespace-pre-line text-xs text-muted-foreground">{address.line}</p>
            <p className="text-xs text-muted-foreground">{address.phone}</p>
          </div>
          <button className="text-xs font-semibold text-primary" onClick={() => navigate({ to: "/shop/address" })}>Change</button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Order Items ({detailed.length})</p>
        <div className="mt-3 space-y-3">
          {detailed.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${product.tone}`}>{product.emoji}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.subtitle}</p>
                <p className="text-sm font-bold text-primary">{product.price}</p>
              </div>
              <span className="text-xs text-muted-foreground">Qty: {qty}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Price Details</p>
        <div className="mt-3 space-y-2 text-sm">
          <PriceRow label="Subtotal" value={formatINR(subtotal)} />
          <PriceRow label="Shipping Charges" value={<span className="font-semibold text-sage">Free</span>} />
          <PriceRow label="GST (18%)" value={formatINR(gst)} />
          <div className="my-2 h-px bg-border" />
          <PriceRow label={<span className="font-semibold">Total Payable</span>} value={<span className="font-bold">{formatINR(total)}</span>} />
          <p className="pt-1 text-xs font-medium text-sage">You saved ₹0 on this order</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Payment Method</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {method === "card" ? "Visa •••• 3456" : method.toUpperCase()}
          </p>
        </div>
        <button className="text-xs font-semibold text-primary" onClick={() => navigate({ to: "/shop/payment" })}>Change</button>
      </div>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={placeOrder} disabled={detailed.length === 0}>
        Place Order
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        By placing this order, you agree to our{" "}
        <span className="font-semibold text-primary">Terms &amp; Conditions</span> and{" "}
        <span className="font-semibold text-primary">Privacy Policy</span>
      </p>
    </DeviceFrame>
  );
}

function PriceRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
