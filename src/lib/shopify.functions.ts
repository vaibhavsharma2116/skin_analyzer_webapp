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
    if (keywords.some((k) => k.includes("acne") || k.includes("pimple") || k.includes("red") || k.includes("rosacea") || k.includes("hormon") || k.includes("breakout") || k.includes("inflam"))) {
      expandedKeywords.add("acne");
      expandedKeywords.add("redness");
      expandedKeywords.add("azelaic");
      expandedKeywords.add("salicylic");
    }
    if (keywords.some((k) => k.includes("barrier") || k.includes("stinging") || k.includes("dehydrat") || k.includes("sensit") || k.includes("flak") || k.includes("parched"))) {
      expandedKeywords.add("barrier");
      expandedKeywords.add("hydration");
      expandedKeywords.add("ceramide");
      expandedKeywords.add("moisturizer");
    }
    if (keywords.some((k) => k.includes("dark") || k.includes("spot") || k.includes("melasma") || k.includes("tranexamic") || k.includes("licorice"))) {
      expandedKeywords.add("dark spot");
      expandedKeywords.add("tranexamic");
    }
    if (keywords.some((k) => k.includes("pigment") || k.includes("mark") || k.includes("pie") || k.includes("pih") || k.includes("tone") || k.includes("arbutin") || k.includes("niacinamide"))) {
      expandedKeywords.add("pigmentation");
      expandedKeywords.add("uneven tone");
      expandedKeywords.add("arbutin");
    }
    if (keywords.some((k) => k.includes("firm") || k.includes("laxity") || k.includes("sag") || k.includes("elastic"))) {
      expandedKeywords.add("firming");
      expandedKeywords.add("peptide");
    }
    if (keywords.some((k) => k.includes("line") || k.includes("wrinkle") || k.includes("age") || k.includes("aging") || k.includes("renewal"))) {
      expandedKeywords.add("anti-aging");
      expandedKeywords.add("skin renewal");
      expandedKeywords.add("retinal");
    }
    if (keywords.some((k) => k.includes("dull") || k.includes("radiance") || k.includes("glow") || k.includes("tan") || k.includes("sun"))) {
      expandedKeywords.add("vitamin c");
      expandedKeywords.add("radiance");
      expandedKeywords.add("de-tan");
      expandedKeywords.add("sunscreen");
      expandedKeywords.add("spf");
    }
    if (keywords.some((k) => k.includes("pore") || k.includes("blackhead") || k.includes("whitehead") || k.includes("clog") || k.includes("oil") || k.includes("shine") || k.includes("sebum"))) {
      expandedKeywords.add("salicylic");
      expandedKeywords.add("mandelic");
      expandedKeywords.add("facewash");
      expandedKeywords.add("cleanse");
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

  // 1. Direct handle or title substring matches for SKNPOP catalog
  if (lowerTitle.includes("barrier repair moisturizer") || (lowerTitle.includes("moisturizer") && !lowerTitle.includes("serum"))) {
    const p = products.find((p) => p.handle.includes("barrier-repair-moisturizer") || p.title.toLowerCase().includes("barrier repair moisturizer") || p.title.toLowerCase().includes("moisturizer"));
    if (p) return p;
  }
  if (lowerTitle.includes("spf") || lowerTitle.includes("sunscreen")) {
    const p = products.find((p) => p.handle.includes("spf-60") || p.title.toLowerCase().includes("sunscreen") || p.title.toLowerCase().includes("spf"));
    if (p) return p;
  }
  if (lowerTitle.includes("salicylic") || lowerTitle.includes("mandelic") || lowerTitle.includes("facewash") || lowerTitle.includes("cleanse")) {
    const p = products.find((p) => p.handle.includes("salicylic") || p.title.toLowerCase().includes("foaming facewash") || p.title.toLowerCase().includes("facewash"));
    if (p) return p;
  }
  if (lowerTitle.includes("scrub") || lowerTitle.includes("polish") || lowerTitle.includes("exfoliat")) {
    const p = products.find((p) => p.handle.includes("polish-scrub") || p.title.toLowerCase().includes("polish scrub"));
    if (p) return p;
  }
  if (lowerTitle.includes("de-tan") || lowerTitle.includes("tan soap") || lowerTitle.includes("glow reset")) {
    const p = products.find((p) => p.handle.includes("de-tan") || p.title.toLowerCase().includes("de-tan"));
    if (p) return p;
  }

  // 2. Exact Serum Matching for all 7 Serums
  if (lowerTitle.includes("copper peptide") || lowerTitle.includes("firming")) {
    const p = products.find((p) => p.handle.includes("firming-anti-aging") || p.title.toLowerCase().includes("firming"));
    if (p) return p;
  }
  if (lowerTitle.includes("retinal") || lowerTitle.includes("skin renewal") || (lowerTitle.includes("anti-aging") && !lowerTitle.includes("firming"))) {
    const p = products.find((p) => p.handle.includes("anti-aging-skin-renewal") || p.title.toLowerCase().includes("anti-aging & skin renewal"));
    if (p) return p;
  }
  if (lowerTitle.includes("azelaic") || lowerTitle.includes("acne & redness") || lowerTitle.includes("redness control")) {
    const p = products.find((p) => p.handle.includes("acne-redness-control") || p.title.toLowerCase().includes("acne & redness"));
    if (p) return p;
  }
  if (lowerTitle.includes("skin barrier repair & hydration") || lowerTitle.includes("barrier repair & hydration") || lowerTitle.includes("ceramide") || lowerTitle.includes("hydration serum") || lowerTitle.includes("barrier serum")) {
    const p = products.find((p) => p.handle.includes("skin-barrier-repair-hydration") || p.title.toLowerCase().includes("skin barrier repair & hydration"));
    if (p) return p;
  }
  if (lowerTitle.includes("dark spot") || lowerTitle.includes("tranexamic") || lowerTitle.includes("licorice")) {
    const p = products.find((p) => p.handle.includes("dark-spot-uneven-tone") || p.title.toLowerCase().includes("dark spot & uneven tone"));
    if (p) return p;
  }
  if (lowerTitle.includes("pigmentation") || lowerTitle.includes("arbutin") || lowerTitle.includes("niacinamide")) {
    const p = products.find((p) => p.handle.includes("pigmentation-uneven-tone") || p.title.toLowerCase().includes("pigmentation & uneven tone"));
    if (p) return p;
  }
  if (lowerTitle.includes("vitamin c") || lowerTitle.includes("radiance repair") || lowerTitle.includes("radiance")) {
    const p = products.find((p) => p.handle.includes("vitamin-c-radiance-repair") || p.title.toLowerCase().includes("vitamin c radiance"));
    if (p) return p;
  }

  // 3. General Fallbacks
  if (lowerTitle.includes("peptide")) {
    const p = products.find((p) => p.title.toLowerCase().includes("peptide"));
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

  // 4. Fuzzy match: check if any word (>3 chars) matches product title
  const words = lowerTitle.split(/[\s,()|/-]+/).filter((w) => w.length > 3);
  for (const w of words) {
    const p = products.find((p) => p.title.toLowerCase().includes(w));
    if (p) return p;
  }

  return null;
}
