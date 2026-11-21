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
  { id: "am-cleanse", title: "2% Salicylic Acid + Mandelic Acid Clear Skin Foaming Facewash – 100 ml", emoji: "🫧", hint: "Gently wash face to clear pores & excess sebum" },
  { id: "am-vitc", title: "Vitamin C Radiance Repair Face Serum – 30 ml", emoji: "🍊", hint: "Boost antioxidant protection and morning radiance" },
  { id: "am-moist", title: "Barrier Repair Moisturizer – 50 g", emoji: "🧴", hint: "Seal in hydration and fortify skin lipid barrier" },
  { id: "am-spf", title: "SPF 60 Gel Sunscreen", emoji: "☀️", hint: "High broad-spectrum UVA/UVB defense" },
];

const BASE_PM: RoutineStep[] = [
  { id: "pm-cleanse", title: "2% Salicylic Acid + Mandelic Acid Clear Skin Foaming Facewash – 100 ml", emoji: "🧼", hint: "Deep cleanse environmental impurities & sunscreen" },
  { id: "pm-renew", title: "Anti-Aging & Skin Renewal Face Serum - 30ml", emoji: "🌙", hint: "Promote cell renewal and smooth fine lines overnight" },
  { id: "pm-moist", title: "Barrier Repair Moisturizer – 50 g", emoji: "🌜", hint: "Restore lipid barrier and soothe skin overnight" },
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
  if (scan?.recommendations && scan.recommendations.length > 0) {
    const aiAm: RoutineStep[] = [];
    const aiPm: RoutineStep[] = [];
    const aiUse: string[] = [];
    const aiAvoid: string[] = [];
    const aiTips: string[] = [];

    let amCount = 0;
    let pmCount = 0;

    for (const rec of scan.recommendations) {
      if (rec.startsWith("MORNING:")) {
        const parts = rec.replace("MORNING:", "").split("|").map(s => s.trim());
        aiAm.push({
          id: `ai-am-${amCount++}`,
          title: parts[0] || "Morning Step",
          hint: parts[1] || "",
          emoji: parts[2] || "☀️"
        });
      } else if (rec.startsWith("EVENING:")) {
        const parts = rec.replace("EVENING:", "").split("|").map(s => s.trim());
        aiPm.push({
          id: `ai-pm-${pmCount++}`,
          title: parts[0] || "Evening Step",
          hint: parts[1] || "",
          emoji: parts[2] || "🌙"
        });
      } else if (rec.startsWith("USE:")) {
        aiUse.push(rec.replace("USE:", "").trim());
      } else if (rec.startsWith("AVOID:")) {
        aiAvoid.push(rec.replace("AVOID:", "").trim());
      } else if (rec.startsWith("LIFESTYLE:")) {
        aiTips.push(rec.replace("LIFESTYLE:", "").trim());
      }
    }

    if (aiAm.length > 0) base.am = aiAm;
    if (aiPm.length > 0) base.pm = aiPm;
    if (aiUse.length > 0) base.ingredientsUse = aiUse;
    if (aiAvoid.length > 0) base.ingredientsAvoid = aiAvoid;
    if (aiTips.length > 0) base.lifestyleTips = aiTips;
  }

  return base;
}

export function scanFocus(scan: ScanRow | null | undefined): string[] {
  return (scan?.concerns ?? []).slice(0, 3).map((c) => c.name);
}
