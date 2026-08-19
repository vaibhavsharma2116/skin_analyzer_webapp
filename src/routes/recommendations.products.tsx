import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";
import { getShopifyRecommendations } from "@/lib/shopify.functions";
import { useQuery } from "@tanstack/react-query";

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

  useEffect(() => {
    let active = true;
    fetchLatest()
      .then((row) => { if (active) setScan((row as ScanRow | null) ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [fetchLatest]);

  const concerns = scan?.concerns?.map(c => c.name) || ["skincare"];

  const { data: products, isLoading } = useQuery({
    queryKey: ["shopify-recommendations-full", concerns],
    queryFn: () => getShopifyRecommendations({ data: { concerns } }),
    staleTime: 1000 * 60 * 5,
    enabled: !!scan
  });

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
        <p className="mt-1 text-sm text-muted-foreground">Expert-approved formulas matched to your latest analysis from SKNPOP.</p>
      </div>

      {isLoading && (
        <div className="mt-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading personalized products...
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {products?.map((p) => (
          <div key={p.id} className="relative flex flex-col rounded-2xl border border-border/70 bg-card p-3 shadow-sm group hover:shadow-md transition-shadow">
            <a href={`https://sknpop.in/products/${p.handle}`} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-1">
              <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden relative">
                {p.images.edges[0]?.node?.url ? (
                  <img 
                    src={p.images.edges[0].node.url} 
                    alt={p.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground line-clamp-2 leading-tight flex-1">{p.title}</p>
              <p className="mt-2 text-base font-bold text-primary">
                {p.priceRange.minVariantPrice.currencyCode === 'INR' ? '₹' : p.priceRange.minVariantPrice.currencyCode} 
                {parseFloat(p.priceRange.minVariantPrice.amount).toLocaleString()}
              </p>
            </a>
            <a
              href={`https://sknpop.in/products/${p.handle}`} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-semibold uppercase"
            >
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy Now
            </a>
          </div>
        ))}
      </div>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations/routine" })}>
        Continue to Routine Builder
      </Button>
    </DeviceFrame>
  );
}
