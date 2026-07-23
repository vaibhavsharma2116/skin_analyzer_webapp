import { useEffect, useState, useCallback } from "react";

export type SavedProduct = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  category: "skincare" | "sunscreen";
  savedOn: string;
  emoji: string;
  tone: string;
};

export const SAVED_PRODUCTS: SavedProduct[] = [
  { id: "p1", name: "Brightening Serum", subtitle: "For dark spots & uneven tone", price: "₹799", category: "skincare", savedOn: "12 May 2024", emoji: "🧴", tone: "bg-coral/15" },
  { id: "p2", name: "Hydrating Moisturizer", subtitle: "For hydration & barrier repair", price: "₹649", category: "skincare", savedOn: "11 May 2024", emoji: "🧴", tone: "bg-primary/15" },
  { id: "p3", name: "Sunscreen SPF 50+", subtitle: "Broad spectrum protection", price: "₹599", category: "sunscreen", savedOn: "10 May 2024", emoji: "🧴", tone: "bg-amber-200/40" },
  { id: "p4", name: "Niacinamide Serum", subtitle: "For pores & oil control", price: "₹799", category: "skincare", savedOn: "10 May 2024", emoji: "🧴", tone: "bg-sage/20" },
  { id: "p5", name: "Vitamin C Booster", subtitle: "Glow & antioxidant defense", price: "₹899", category: "skincare", savedOn: "08 May 2024", emoji: "🧴", tone: "bg-amber-200/40" },
  { id: "p6", name: "Ceramide Cream", subtitle: "Barrier repair for dry skin", price: "₹749", category: "skincare", savedOn: "06 May 2024", emoji: "🧴", tone: "bg-primary/15" },
  { id: "p7", name: "Mineral Sunscreen SPF 50", subtitle: "Gentle, tinted, no white cast", price: "₹1,099", category: "sunscreen", savedOn: "04 May 2024", emoji: "🧴", tone: "bg-amber-200/40" },
  { id: "p8", name: "Gentle Cleanser", subtitle: "Sulphate-free daily cleanse", price: "₹499", category: "skincare", savedOn: "02 May 2024", emoji: "🧴", tone: "bg-sage/20" },
];

export type SavedRoutine = {
  id: string;
  name: string;
  steps: number;
  cadence: "Daily" | "Weekly";
  slot: "morning" | "evening" | "weekly";
  date: string;
  emoji: string;
  tone: string;
};

export const SAVED_ROUTINES: SavedRoutine[] = [
  { id: "r1", name: "Morning Routine for Glowing Skin", steps: 5, cadence: "Daily", slot: "morning", date: "12 May 2024", emoji: "☀️", tone: "bg-amber-200/40" },
  { id: "r2", name: "Night Routine for Clear Skin", steps: 6, cadence: "Daily", slot: "evening", date: "11 May 2024", emoji: "🌙", tone: "bg-primary/15" },
  { id: "r3", name: "Acne Care Routine", steps: 5, cadence: "Daily", slot: "morning", date: "09 May 2024", emoji: "🫧", tone: "bg-coral/15" },
  { id: "r4", name: "Weekend Self Care Routine", steps: 7, cadence: "Weekly", slot: "weekly", date: "07 May 2024", emoji: "🌿", tone: "bg-sage/20" },
  { id: "r5", name: "Evening Wind-down Ritual", steps: 4, cadence: "Daily", slot: "evening", date: "05 May 2024", emoji: "🌙", tone: "bg-primary/15" },
  { id: "r6", name: "Weekly Exfoliation Reset", steps: 3, cadence: "Weekly", slot: "weekly", date: "01 May 2024", emoji: "✨", tone: "bg-amber-200/40" },
];

export type Collection = {
  id: string;
  name: string;
  count: number;
  emojis: string[];
  tone: string;
};

export const COLLECTIONS: Collection[] = [
  { id: "c1", name: "My Morning Routine", count: 5, emojis: ["🧴", "☀️", "💧"], tone: "bg-primary/10" },
  { id: "c2", name: "Acne Care Essentials", count: 6, emojis: ["🫧", "🧴", "✨"], tone: "bg-coral/10" },
  { id: "c3", name: "Weekend Self Care", count: 7, emojis: ["🌿", "💆", "🕯️"], tone: "bg-sage/15" },
  { id: "c4", name: "Sunscreen Favorites", count: 4, emojis: ["☀️", "🧴", "🌞"], tone: "bg-amber-200/30" },
];

/** localStorage-backed favorites set for optimistic hearting. */
const KEY = "skinpop.favorites.v1";
type FavKind = "product" | "article" | "routine" | "expert";

function readAll(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function keyFor(kind: FavKind, id: string) {
  return `${kind}:${id}`;
}

export function useFavorites() {
  const [map, setMap] = useState<Record<string, true>>({});
  useEffect(() => {
    setMap(readAll());
  }, []);

  const isFav = useCallback((kind: FavKind, id: string) => map[keyFor(kind, id)] === true, [map]);

  const toggle = useCallback((kind: FavKind, id: string) => {
    setMap((prev) => {
      const k = keyFor(kind, id);
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { isFav, toggle };
}

/** Seed defaults so the "Saved" screens are populated on first visit. */
export function useSeedFavorites() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY)) return;
    const seed: Record<string, true> = {};
    SAVED_PRODUCTS.forEach((p) => (seed[`product:${p.id}`] = true));
    SAVED_ROUTINES.forEach((r) => (seed[`routine:${r.id}`] = true));
    // seed a few articles & experts
    ["hyaluronic-acid-hydration-hero", "niacinamide-skins-best-friend", "sunscreen-101", "morning-vs-night-routine"].forEach(
      (s) => (seed[`article:${s}`] = true),
    );
    ["ananya-sharma", "raghav-bansal", "priya-malhotra"].forEach((e) => (seed[`expert:${e}`] = true));
    try {
      localStorage.setItem(KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
  }, []);
}
