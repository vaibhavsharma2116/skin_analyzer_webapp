import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_PRODUCTS, useFavorites } from "@/lib/favorites-content";
import { HeartToggle, FavoritesFooter } from "./favorites.index";

export const Route = createFileRoute("/favorites/products")({
  component: SavedProductsPage,
});

const FILTERS = [
  { key: "all", label: "All Products" },
  { key: "skincare", label: "Skincare" },
  { key: "sunscreen", label: "Sunscreen" },
] as const;

function SavedProductsPage() {
  const navigate = useNavigate();
  const { isFav, toggle } = useFavorites();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const list = useMemo(() => {
    const kept = SAVED_PRODUCTS.filter((p) => isFav("product", p.id));
    if (filter === "all") return kept;
    return kept.filter((p) => p.category === filter);
  }, [filter, isFav]);

  const counts = {
    all: SAVED_PRODUCTS.filter((p) => isFav("product", p.id)).length,
    skincare: SAVED_PRODUCTS.filter((p) => isFav("product", p.id) && p.category === "skincare").length,
    sunscreen: SAVED_PRODUCTS.filter((p) => isFav("product", p.id) && p.category === "sunscreen").length,
  };

  return (
    <DeviceFrame
      title="Products"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/favorites" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></button>
          <button className="relative icon-button" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">2</span>
          </button>
        </div>
      }
      footer={<FavoritesFooter active="favorites" />}
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No saved products in this filter.
          </div>
        )}
        {list.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${p.tone}`}>{p.emoji}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.subtitle}</p>
                <p className="mt-1 text-base font-semibold text-primary">{p.price}</p>
                <p className="text-[11px] text-muted-foreground">Saved on {p.savedOn}</p>
              </div>
              <HeartToggle active={isFav("product", p.id)} onClick={(e) => { e.stopPropagation(); toggle("product", p.id); }} />
            </div>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="mt-6 h-12 w-full rounded-2xl"
        onClick={() => navigate({ to: "/favorites/collections" })}
      >
        View Saved Collections
      </Button>
    </DeviceFrame>
  );
}
