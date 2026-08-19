import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchShopifyProducts, type ShopifyProduct } from "./shopify";

const RecommendInput = z.object({
  concerns: z.array(z.string()).min(1),
});

export const getShopifyRecommendations = createServerFn("POST", async (input: z.infer<typeof RecommendInput>): Promise<ShopifyProduct[]> => {
  // Try to find products that match the primary concern
  const primaryConcern = input.concerns[0] || "skincare";
  
  // We just do a search for the first concern for now
  const products = await searchShopifyProducts(primaryConcern);
  
  if (products.length > 0) return products;
  
  // Fallback if no specific products found for the concern
  return searchShopifyProducts("skincare");
});
