import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchShopifyProducts, type ShopifyProduct } from "./shopify";

const RecommendInput = z.object({
  concerns: z.array(z.string()).min(1),
});

export const getShopifyRecommendations = createServerFn({ method: "POST" })
  .validator((input: unknown) => RecommendInput.parse(input))
  .handler(async ({ data }): Promise<ShopifyProduct[]> => {
    // Try to find products that match the primary concern
    const primaryConcern = data.concerns[0] || "skincare";
    
    // We just do a search for the first concern for now
    const products = await searchShopifyProducts(primaryConcern);
    
    if (products.length > 0) return products;
    
    // Fallback if no specific products found for the concern
    return searchShopifyProducts("skincare");
  });

export function matchProductToStep(title: string, products: ShopifyProduct[] | undefined): ShopifyProduct | null {
  if (!products) return null;
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("cleanse")) {
    return products.find(p => p.title.toLowerCase().includes("facewash") || p.title.toLowerCase().includes("cleanse")) || null;
  }
  if (lowerTitle.includes("vitamin c")) {
    return products.find(p => p.title.toLowerCase().includes("vitamin c")) || null;
  }
  if (lowerTitle.includes("moisturizer")) {
    return products.find(p => p.title.toLowerCase().includes("moisturizer")) || null;
  }
  if (lowerTitle.includes("niacinamide") || lowerTitle.includes("pigment") || lowerTitle.includes("dark")) {
    return products.find(p => p.title.toLowerCase().includes("pigment") || p.title.toLowerCase().includes("niacinamide")) || null;
  }
  if (lowerTitle.includes("exfoliat") || lowerTitle.includes("scrub") || lowerTitle.includes("aha")) {
    return products.find(p => p.title.toLowerCase().includes("scrub")) || null;
  }
  return null;
}
