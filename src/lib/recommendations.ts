import type { ScanRow } from "@/lib/skin-analysis.functions";

export type SkinType = "oily" | "dry" | "combination" | "normal" | "sensitive";

export type RoutineStep = {
  id: string;
  title: string;
  emoji: string;
  hint: string;
};

export type RoutinePreset = {
  am: RoutineStep[];
  pm: RoutineStep[];
  ingredientsUse: string[];
  ingredientsAvoid: string[];
  lifestyleTips: string[];
  productIds: string[];
};

const BASE_AM: RoutineStep[] = [
  { id: "am-cleanse", title: "Gentle Cleanser", emoji: "🧼", hint: "Wash face with lukewarm water" },
  { id: "am-tone", title: "Hydrating Toner", emoji: "💧", hint: "Balance skin pH" },
  { id: "am-vitc", title: "Vitamin C Serum", emoji: "🍊", hint: "Antioxidant glow boost" },
  { id: "am-moist", title: "Moisturizer", emoji: "🧴", hint: "Lock in hydration" },
  { id: "am-spf", title: "Sunscreen SPF 50+", emoji: "☀️", hint: "Broad spectrum protection" },
];

const BASE_PM: RoutineStep[] = [
  { id: "pm-cleanse", title: "Gentle Cleanser", emoji: "🧼", hint: "Remove makeup & sunscreen" },
  { id: "pm-niaci", title: "Niacinamide Serum", emoji: "✨", hint: "Pores & oil control" },
  { id: "pm-moist", title: "Night Moisturizer", emoji: "🌙", hint: "Repair barrier overnight" },
  { id: "pm-eye", title: "Eye Cream (optional)", emoji: "👁️", hint: "Depuff & hydrate" },
];

export function recommendationsFor(scan: ScanRow | null | undefined): RoutinePreset {
  const type = (scan?.skin_type ?? "normal") as SkinType;
  const base: RoutinePreset = {
    am: BASE_AM,
    pm: BASE_PM,
    ingredientsUse: ["Niacinamide", "Hyaluronic Acid", "Vitamin C", "Ceramides"],
    ingredientsAvoid: ["Denatured alcohol", "Fragrance", "Harsh sulphates"],
    lifestyleTips: [
      "Drink 8 glasses of water daily",
      "Get 7–8 hours of sleep",
      "Reapply sunscreen every 2 hours",
      "Avoid touching your face",
    ],
    productIds: ["p1", "p2", "p3", "p4"],
  };

  switch (type) {
    case "oily":
      base.ingredientsUse = ["Niacinamide", "Salicylic Acid", "Zinc PCA", "Green Tea"];
      base.ingredientsAvoid = ["Heavy oils", "Comedogenic butters", "Alcohol denat."];
      base.productIds = ["p4", "p3", "p8", "p1"];
      break;
    case "dry":
      base.ingredientsUse = ["Hyaluronic Acid", "Ceramides", "Squalane", "Shea Butter"];
      base.ingredientsAvoid = ["Salicylic Acid (high %)", "Alcohol denat.", "Harsh scrubs"];
      base.productIds = ["p2", "p6", "p3", "p1"];
      break;
    case "sensitive":
      base.ingredientsUse = ["Centella Asiatica", "Panthenol", "Ceramides", "Oat Extract"];
      base.ingredientsAvoid = ["Fragrance", "Essential oils", "High-strength retinoids"];
      base.productIds = ["p8", "p6", "p7", "p2"];
      break;
    case "combination":
      base.ingredientsUse = ["Niacinamide", "Hyaluronic Acid", "PHA", "Vitamin C"];
      base.ingredientsAvoid = ["Heavy occlusives on T-zone", "Alcohol denat."];
      base.productIds = ["p1", "p4", "p2", "p3"];
      break;
    default:
      break;
  }
  return base;
}

export function scanFocus(scan: ScanRow | null | undefined): string[] {
  return (scan?.concerns ?? []).slice(0, 3).map((c) => c.name);
}
