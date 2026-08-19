import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchShopifyProducts } from "./shopify";

const SYSTEM_PROMPT = `You are a helpful, friendly, and expert skincare customer support agent for SKNPOP.
Your goal is to assist customers with their skincare routines, answer questions about skin health, and recommend SKNPOP products.
Always maintain a warm, professional, and concise tone.

When you recommend a product, ALWAYS try to use one of the products provided in the context below.
Format your product recommendations clearly.
`;

const ChatInput = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .optional(),
});

export const chatWithAI = createServerFn("POST", async (input: z.infer<typeof ChatInput>) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI service is not configured");
  }

  // Pre-fetch some relevant products from Shopify based on the user's message to inject as context
  const searchTerms = input.message.split(" ").filter(w => w.length > 3).join(" ");
  const products = await searchShopifyProducts(searchTerms || "skincare");
  
  const productsContext = products.length > 0 
    ? `\n\nAVAILABLE SKNPOP PRODUCTS IN STORE:\n` + products.map(p => 
        `- ${p.title} (${p.priceRange.minVariantPrice.currencyCode} ${p.priceRange.minVariantPrice.amount}): ${p.description.substring(0, 100)}... (Link: /shop/product/${p.handle})`
      ).join("\n")
    : "";

  const fullSystemPrompt = SYSTEM_PROMPT + productsContext;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: fullSystemPrompt }]
      },
      contents: [
        ...(input.history || []),
        {
          role: "user",
          parts: [{ text: input.message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
      }
    }),
  });

  if (!res.ok) {
    console.error("Gemini Error:", await res.text());
    throw new Error("Failed to get AI response");
  }

  const data = await res.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request right now.";

  return {
    reply: responseText,
  };
});
