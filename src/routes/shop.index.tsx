import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Heart, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_PRODUCTS, useFavorites } from "@/lib/favorites-content";
import { useCart } from "@/lib/cart";

import { getAllShopifyProducts } from "@/lib/shopify.functions";
import type { ShopifyProduct } from "@/lib/shopify";
import { useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — SKIN POP" },
      { name: "description", content: "Discover skincare and sunscreen products curated for your skin profile." },
    ],
  }),
  loader: async () => {
    const products = await getAllShopifyProducts();
    return { products };
  },
  component: ShopPage,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "skincare", label: "Skincare" },
  { key: "sunscreen", label: "Sunscreen" },
] as const;

function ShopPage() {
  const navigate = useNavigate();
  const { isFav, toggle } = useFavorites();
  const { count } = useCart();
  const { products } = useLoaderData({ from: "/shop/" });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const list = useMemo(() => {
    // Basic filter by title keywords, as Shopify doesn't have our internal categories by default
    if (filter === "all") return products;
    return products.filter((p) => p.title.toLowerCase().includes(filter));
  }, [filter, products]);

  const shopifyDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;

  return (
    <DeviceFrame
      title="Shop"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/dashboard" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></button>
          <Link to="/shop/cart" className="relative icon-button" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">{count}</span>
            )}
          </Link>
        </div>
      }
    >
      <div className="rounded-[28px] bg-gradient-card px-5 py-5 shadow-sm">
        <p className="text-2xl font-semibold text-foreground">Curated for you</p>
        <p className="mt-1 text-sm text-muted-foreground">Hand-picked skincare & sunscreen picks.</p>
      </div>

      <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {list.map((p) => {
          const imageUrl = p.images?.edges?.[0]?.node?.url || "";
          const price = p.priceRange?.minVariantPrice;
          const productUrl = `https://${shopifyDomain}/products/${p.handle}`;
          
          return (
            <div
              key={p.id}
              className="relative rounded-2xl border border-border/70 bg-card p-3 shadow-sm cursor-pointer"
              onClick={() => window.open(productUrl, "_blank")}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle("product", p.id); }}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition hover:text-primary z-10"
                aria-label={isFav("product", p.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-4 w-4 ${isFav("product", p.id) ? "fill-coral text-coral" : ""}`} />
              </button>
              
              <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-white overflow-hidden p-2">
                {imageUrl ? (
                  <img src={imageUrl} alt={p.title} className="h-full w-full object-contain" />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <p className="mt-3 truncate text-sm font-semibold text-foreground" title={p.title}>{p.title}</p>
              <p className="mt-2 text-base font-semibold text-primary">
                {price ? `${price.currencyCode === 'INR' ? '₹' : price.currencyCode} ${price.amount}` : "Price TBD"}
              </p>
              
              <Button
                size="sm"
                className="mt-2 h-9 w-full rounded-xl text-xs bg-coral hover:bg-coral/90 text-white"
                onClick={(e) => { e.stopPropagation(); window.open(productUrl, "_blank"); }}
              >
                <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                Buy Now
              </Button>
            </div>
          );
        })}
      </div>
    </DeviceFrame>
  );
}
