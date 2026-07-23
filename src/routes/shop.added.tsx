import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_PRODUCTS } from "@/lib/favorites-content";
import { getProduct } from "@/lib/cart";

const search = z.object({ id: z.string().optional(), qty: z.coerce.number().optional() });

export const Route = createFileRoute("/shop/added")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Added to cart — SKIN POP" }] }),
  component: AddedPage,
});

function AddedPage() {
  const { id, qty = 1 } = Route.useSearch();
  const navigate = useNavigate();
  const product = id ? getProduct(id) : undefined;
  const related = SAVED_PRODUCTS.filter((p) => p.id !== id).slice(0, 3);

  return (
    <DeviceFrame
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="flex flex-col items-center pt-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/25">
          <CheckCircle2 className="h-9 w-9 text-sage" strokeWidth={2.2} />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Added to Cart</p>
      </div>

      {product && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${product.tone}`}>{product.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
            <p className="mt-0.5 text-sm font-bold text-primary">{product.price}</p>
            <p className="text-xs text-muted-foreground">Qty: {qty}</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs font-medium text-sage">Added to your cart successfully!</p>

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

      <div className="mt-6 space-y-2">
        <Button className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/cart" })}>View Cart</Button>
        <Button variant="ghost" className="h-11 w-full rounded-2xl text-primary" onClick={() => navigate({ to: "/shop" })}>Continue Shopping</Button>
      </div>
    </DeviceFrame>
  );
}
