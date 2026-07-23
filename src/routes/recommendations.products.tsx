import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";
import { recommendationsFor } from "@/lib/recommendations";
import { SAVED_PRODUCTS, useFavorites } from "@/lib/favorites-content";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/recommendations/products")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Product Recommendations — SKIN POP" },
      { name: "description", content: "Curated products for your skin profile." },
    ],
  }),
  component: RecommendedProducts,
});

function RecommendedProducts() {
  const navigate = useNavigate();
  const fetchLatest = useServerFn(getLatestScan);
  const [scan, setScan] = useState<ScanRow | null>(null);
  const { add } = useCart();
  const { isFav, toggle } = useFavorites();

  useEffect(() => {
    let active = true;
    fetchLatest()
      .then((row) => { if (active) setScan((row as ScanRow | null) ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [fetchLatest]);

  const preset = recommendationsFor(scan);
  const products = preset.productIds
    .map((id) => SAVED_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof SAVED_PRODUCTS)[number] => Boolean(p));

  return (
    <DeviceFrame
      title="Product Recommendations"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/recommendations" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-[28px] bg-gradient-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Curated Products
        </div>
        <p className="mt-2 text-xl font-semibold text-foreground">Picked for your skin</p>
        <p className="mt-1 text-sm text-muted-foreground">Dermatologist-approved formulas matched to your latest analysis.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {products.map((p) => (
          <div key={p.id} className="relative rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
            <button
              type="button"
              onClick={() => toggle("product", p.id)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground"
              aria-label="Favorite"
            >
              <Heart className={`h-4 w-4 ${isFav("product", p.id) ? "fill-coral text-coral" : ""}`} />
            </button>
            <Link to="/shop/product/$id" params={{ id: p.id }}>
              <div className={`flex h-20 w-full items-center justify-center rounded-2xl text-3xl ${p.tone}`}>{p.emoji}</div>
              <p className="mt-3 truncate text-sm font-semibold text-foreground">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.subtitle}</p>
              <p className="mt-2 text-base font-semibold text-primary">{p.price}</p>
            </Link>
            <Button
              size="sm"
              className="mt-2 h-9 w-full rounded-xl text-xs"
              onClick={() => { add(p.id, 1); navigate({ to: "/shop/added", search: { id: p.id, qty: 1 } }); }}
            >
              <ShoppingBag className="mr-1 h-3.5 w-3.5" /> Add to Cart
            </Button>
          </div>
        ))}
      </div>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations/routine" })}>
        Continue to Routine Builder
      </Button>
    </DeviceFrame>
  );
}
