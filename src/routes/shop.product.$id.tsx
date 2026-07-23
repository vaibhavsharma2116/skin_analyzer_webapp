import { createFileRoute, useNavigate, notFound, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_PRODUCTS, useFavorites } from "@/lib/favorites-content";
import { getProduct, useCart, formatINR, priceValue } from "@/lib/cart";

export const Route = createFileRoute("/shop/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Product"} — SKIN POP` },
      { name: "description", content: loaderData?.product.subtitle ?? "Product detail" },
    ],
  }),
  notFoundComponent: () => (
    <DeviceFrame title="Not found">
      <p className="text-sm text-muted-foreground">Product not found.</p>
    </DeviceFrame>
  ),
  errorComponent: () => (
    <DeviceFrame title="Error">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
    </DeviceFrame>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const { add, count } = useCart();
  const { isFav, toggle } = useFavorites();
  const [qty, setQty] = useState(1);

  const related = SAVED_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <DeviceFrame
      title="Product Detail"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <Link to="/shop/cart" className="relative icon-button" aria-label="Cart">
          <ShoppingCart className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">{count}</span>
          )}
        </Link>
      }
    >
      <div className={`flex h-56 items-center justify-center rounded-3xl text-7xl ${product.tone}`}>
        {product.emoji}
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{product.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{product.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => toggle("product", product.id)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80"
          aria-label="Favorite"
        >
          <Heart className={`h-4 w-4 ${isFav("product", product.id) ? "fill-coral text-coral" : "text-muted-foreground"}`} />
        </button>
      </div>

      <p className="mt-3 text-2xl font-bold text-primary">{product.price}</p>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">About this product</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Dermatologist-approved formula tailored to your skin profile. Cruelty-free, fragrance-free, and safe for daily use.
        </p>
      </div>

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

      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary" onClick={() => setQty((q) => q + 1)}>
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <Button
          className="h-11 flex-1 rounded-2xl"
          onClick={() => {
            add(product.id, qty);
            navigate({ to: "/shop/added", search: { id: product.id, qty } });
          }}
        >
          Add to Cart · {formatINR(priceValue(product) * qty)}
        </Button>
      </div>
    </DeviceFrame>
  );
}
