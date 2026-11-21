import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchShopifyProducts, type ShopifyProduct } from "./shopify";
export type { ShopifyProduct };

const RecommendInput = z.object({
  concerns: z.array(z.string()).min(1),
});

export const getShopifyRecommendations = createServerFn({ method: "POST" })
  .validator((input: unknown) => RecommendInput.parse(input))
  .handler(async ({ data }): Promise<ShopifyProduct[]> => {
    // 1. Fetch all store products first
    const allProducts = await searchShopifyProducts("");
    if (!allProducts || allProducts.length === 0) return [];

    // 2. Extract keywords from detected concerns
    const keywords = (data.concerns || [])
      .flatMap((c) => c.toLowerCase().split(/[\s,()\/|]+/))
      .filter((w) => w.length > 2);

    // Map common concern words to product ingredients / types
    const expandedKeywords = new Set<string>(keywords);
    if (keywords.some((k) => k.includes("acne") || k.includes("pimple") || k.includes("pore") || k.includes("blackhead"))) {
      expandedKeywords.add("salicylic");
      expandedKeywords.add("niacinamide");
      expandedKeywords.add("cleanse");
      expandedKeywords.add("facewash");
    }
    if (keywords.some((k) => k.includes("pigment") || k.includes("dark") || k.includes("spot") || k.includes("melasma") || k.includes("dull") || k.includes("tan"))) {
      expandedKeywords.add("vitamin c");
      expandedKeywords.add("arbutin");
      expandedKeywords.add("tranexamic");
      expandedKeywords.add("brightening");
    }
    if (keywords.some((k) => k.includes("line") || k.includes("wrinkle") || k.includes("aging") || k.includes("texture"))) {
      expandedKeywords.add("retin");
      expandedKeywords.add("peptide");
    }
    if (keywords.some((k) => k.includes("dry") || k.includes("dehydrat") || k.includes("barrier") || k.includes("sensit"))) {
      expandedKeywords.add("hyaluronic");
      expandedKeywords.add("barrier");
      expandedKeywords.add("moisturizer");
      expandedKeywords.add("cream");
    }

    const keyList = Array.from(expandedKeywords);
    const matched = allProducts.filter((p) => {
      const text = (p.title + " " + (p.description || "")).toLowerCase();
      return keyList.some((k) => text.includes(k));
    });

    if (matched.length > 0) {
      // Prioritize matched products, append remaining catalog to give full choices
      const rest = allProducts.filter((p) => !matched.some((m) => m.id === p.id));
      return [...matched, ...rest];
    }

    // Always fallback to all real SKNPOP products, never empty
    return allProducts;
  });

export const getAllShopifyProducts = createServerFn({ method: "GET" })
  .handler(async (): Promise<ShopifyProduct[]> => {
    // Empty search term fetches all products from Shopify
    return searchShopifyProducts("");
  });

export function matchProductToStep(title: string, products: ShopifyProduct[] | undefined): ShopifyProduct | null {
  if (!products || products.length === 0) return null;
  const lowerTitle = title.toLowerCase();

  // 1. Specific Active Ingredient / Keyword Matches
  if (lowerTitle.includes("salicylic")) {
    const p = products.find((p) => p.title.toLowerCase().includes("salicylic"));
    if (p) return p;
  }
  if (lowerTitle.includes("niacinamide")) {
    const p = products.find((p) => p.title.toLowerCase().includes("niacinamide"));
    if (p) return p;
  }
  if (lowerTitle.includes("vitamin c")) {
    const p = products.find((p) => p.title.toLowerCase().includes("vitamin c"));
    if (p) return p;
  }
  if (lowerTitle.includes("retinal") || lowerTitle.includes("retinol")) {
    const p = products.find((p) => p.title.toLowerCase().includes("retin"));
    if (p) return p;
  }
  if (lowerTitle.includes("arbutin")) {
    const p = products.find((p) => p.title.toLowerCase().includes("arbutin"));
    if (p) return p;
  }
  if (lowerTitle.includes("tranexamic")) {
    const p = products.find((p) => p.title.toLowerCase().includes("tranexamic"));
    if (p) return p;
  }
  if (lowerTitle.includes("azelaic")) {
    const p = products.find((p) => p.title.toLowerCase().includes("azelaic"));
    if (p) return p;
  }
  if (lowerTitle.includes("hyaluronic")) {
    const p = products.find((p) => p.title.toLowerCase().includes("hyaluronic"));
    if (p) return p;
  }
  if (lowerTitle.includes("peptide")) {
    const p = products.find((p) => p.title.toLowerCase().includes("peptide"));
    if (p) return p;
  }
  if (lowerTitle.includes("caffeine") || lowerTitle.includes("eye")) {
    const p = products.find((p) => p.title.toLowerCase().includes("caffeine") || p.title.toLowerCase().includes("eye"));
    if (p) return p;
  }
  if (lowerTitle.includes("sunscreen") || lowerTitle.includes("spf") || lowerTitle.includes("matte")) {
    const p = products.find((p) => p.title.toLowerCase().includes("sunscreen") || p.title.toLowerCase().includes("spf"));
    if (p) return p;
  }
  if (lowerTitle.includes("moisturizer") || lowerTitle.includes("cream") || lowerTitle.includes("gel") || lowerTitle.includes("repair")) {
    const p = products.find((p) => p.title.toLowerCase().includes("moisturizer") || p.title.toLowerCase().includes("cream") || p.title.toLowerCase().includes("gel"));
    if (p) return p;
  }
  if (lowerTitle.includes("cleanse") || lowerTitle.includes("wash")) {
    const p = products.find((p) => p.title.toLowerCase().includes("cleanse") || p.title.toLowerCase().includes("facewash"));
    if (p) return p;
  }
  if (lowerTitle.includes("exfoliat") || lowerTitle.includes("scrub") || lowerTitle.includes("aha") || lowerTitle.includes("bha")) {
    const p = products.find((p) => p.title.toLowerCase().includes("scrub") || p.title.toLowerCase().includes("exfoliat"));
    if (p) return p;
  }

  // 2. Fuzzy match: check if any word (>3 chars) matches product title
  const words = lowerTitle.split(/[\s,()|/-]+/).filter((w) => w.length > 3);
  for (const w of words) {
    const p = products.find((p) => p.title.toLowerCase().includes(w));
    if (p) return p;
  }

  return null;
}
