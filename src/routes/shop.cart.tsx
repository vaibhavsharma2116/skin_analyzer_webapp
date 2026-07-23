import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShieldCheck, Trash2, Truck, Undo2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_PRODUCTS } from "@/lib/favorites-content";
import { useCart, formatINR } from "@/lib/cart";

export const Route = createFileRoute("/shop/cart")({
  head: () => ({ meta: [{ title: "My Cart — SKIN POP" }] }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { detailed, setQty, remove, subtotal, gst, total, count } = useCart();
  const related = SAVED_PRODUCTS.filter((p) => !detailed.some((d) => d.product.id === p.id)).slice(0, 3);

  return (
    <DeviceFrame
      title="My Cart"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<span className="text-xs font-semibold text-muted-foreground">{count} Item{count === 1 ? "" : "s"}</span>}
    >
      {detailed.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button className="mt-4 h-11 w-full rounded-2xl" onClick={() => navigate({ to: "/shop" })}>Shop products</Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {detailed.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${product.tone}`}>{product.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{product.subtitle}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{product.price}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-2 py-1">
                    <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full bg-card" onClick={() => setQty(product.id, qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-semibold">{qty}</span>
                    <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full bg-card" onClick={() => setQty(product.id, qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button type="button" className="text-muted-foreground" aria-label="Remove" onClick={() => remove(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Price Details</p>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Shipping Charges" value={<span className="font-semibold text-sage">Free</span>} />
              <Row label="GST (18%)" value={formatINR(gst)} />
              <div className="my-2 h-px bg-border" />
              <Row label={<span className="font-semibold">Total</span>} value={<span className="font-bold">{formatINR(total)}</span>} />
              <p className="pt-1 text-xs font-medium text-sage">You saved ₹0 on this order</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: ShieldCheck, label: "100% Genuine" },
              { icon: Truck, label: "Secure Payment" },
              { icon: Undo2, label: "Easy Returns" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-border/70 bg-card p-2">
                <Icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {related.length > 0 && (
            <>
              <p className="mt-5 text-sm font-semibold text-foreground">You may also like</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {related.map((p) => (
                  <Link key={p.id} to="/shop/product/$id" params={{ id: p.id }} className="rounded-xl border border-border/70 bg-card p-2 text-center">
                    <div className={`flex h-14 items-center justify-center rounded-lg text-2xl ${p.tone}`}>{p.emoji}</div>
                    <p className="mt-1 truncate text-[10px] font-semibold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-primary">{p.price}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/address" })}>
            Proceed to Checkout
          </Button>
        </>
      )}
    </DeviceFrame>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
