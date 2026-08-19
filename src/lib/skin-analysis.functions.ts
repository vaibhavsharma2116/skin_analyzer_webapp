import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnalyzeInput = z.object({
  imageDataUrl: z
    .string()
    .refine((v) => v.startsWith("data:image/"), "Must be a data URL image"),
  faceFingerprint: z
    .string()
    .regex(/^[0-9a-f]{16}$/i)
    .optional()
    .nullable(),
});

const SEVERITY = ["low", "moderate", "high"] as const;

const MetricsSchema = z.object({
  hydration: z.number().int().min(0).max(100),
  oil_balance: z.number().int().min(0).max(100),
  texture: z.number().int().min(0).max(100),
  pores: z.number().int().min(0).max(100),
  evenness: z.number().int().min(0).max(100),
  elasticity: z.number().int().min(0).max(100),
});

export type ScanMetrics = z.infer<typeof MetricsSchema>;

const AnalysisResultSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  skin_age: z.number().int().min(5).max(100),
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"]),
  summary: z.string().min(10).max(2000),
  metrics: MetricsSchema,
  concerns: z
    .array(
      z.object({
        name: z.string().min(2).max(40),
        severity: z.enum(SEVERITY),
        score: z.number().int().min(0).max(100),
      }),
    )
    .min(0)
    .max(25),
  recommendations: z.array(z.string().min(4).max(300)).min(3).max(30),
});

export type SkinAnalysisResult = z.infer<typeof AnalysisResultSchema>;

const SYSTEM_PROMPT = `You are SKIN POP, a professional AI dermatology assistant.
Analyze the user's selfie and return a highly personalized, detailed skin assessment.
Base your evaluation on visible cues only: tone evenness, texture, hydration signs, oil/shine, pores, redness, dark spots, fine lines, and blemishes.
You are NOT diagnosing medical conditions — provide cosmetic-grade guidance only.

Return ONLY valid JSON matching exactly this shape (no markdown, no prose):
{
  "overall_score": integer 0-100 (higher = healthier looking skin),
  "skin_age": integer estimated apparent skin age in years,
  "skin_type": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "summary": "A highly detailed 2-3 paragraph explanation of their skin health, what you noticed in the image, what looks good, what can be improved, and why you are recommending specific routines. Be very detailed and encouraging. (max 1500 chars)",
  "metrics": {
    "hydration": 0-100, "oil_balance": 0-100, "texture": 0-100, "pores": 0-100, "evenness": 0-100, "elasticity": 0-100
  },
  "concerns": [ 
    // Identify ALL applicable concerns from this master list: 
    // Acne (Pimples), Acne Marks / Post-acne Spots, Dark Spots / Hyperpigmentation, Melasma, Dark Circles, 
    // Eye Bags / Puffy Eyes, Fine Lines, Wrinkles, Open / Enlarged Pores, Blackheads, Whiteheads, 
    // Redness, Uneven Skin Tone, Dull Skin, Dehydrated Skin, Sun Damage / Tanning, Freckles, Texture / Rough Skin, Facial Asymmetry.
    { "name": "Dark Circles", "severity": "low"|"moderate"|"high", "score": 0-100 severity intensity }, 
    ... include ALL detected concerns (0 to 20 items) 
  ],
  "recommendations": [
    // IMPORTANT: The recommendations array MUST contain items with specific prefixes so the app can parse them.
    // Format: "PREFIX: Text" or "PREFIX: Title|Hint|Emoji"
    
    // Provide exactly 2 to 4 MORNING routine steps:
    "MORNING: Gentle Cleanser | To remove overnight impurities | 🧼",
    "MORNING: Vitamin C Serum | For antioxidant protection | 🍊",
    
    // Provide exactly 2 to 4 EVENING routine steps:
    "EVENING: Double Cleanse | To remove sunscreen & makeup | 🫧",
    "EVENING: Retinol | To target fine lines | 🌙",
    
    // Provide 2 to 4 ingredients to USE:
    "USE: Niacinamide",
    "USE: Hyaluronic Acid",
    
    // Provide 1 to 3 ingredients to AVOID:
    "AVOID: Heavy coconut oil",
    "AVOID: Harsh physical scrubs",
    
    // Provide 2 to 4 LIFESTYLE tips based on their scan:
    "LIFESTYLE: Drink at least 8 glasses of water to boost hydration.",
    
    // Provide 2 to 4 BULLET points summarizing their skin health:
    "BULLET: Good hydration levels but visible pores on the nose.",
    "BULLET: Minor pigmentation issues observed on the cheeks."
  ]
}

For metrics, higher = better. E.g. hydration 80 = well hydrated, pores 80 = pores appear tight/minimal, oil_balance 80 = balanced.`;

function hashStringToInt(s: string): number {
  // FNV-1a 32-bit — deterministic seed derived from the image bytes
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

async function callVisionModel(imageDataUrl: string): Promise<{ result: SkinAnalysisResult; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured");

  const modelsToTry = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash"];
  let lastError: Error = new Error("AI request failed");
  
  // Extract mime type and base64 data from the data URL
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];
  const base64Data = imageDataUrl.split(',')[1];

  for (const model of modelsToTry) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Analyze this selfie and respond with JSON only. Be strictly consistent: for the same image always return identical numbers. Evaluate methodically feature-by-feature using only visible pixels. Provide highly personalized product and active ingredient recommendations based specifically on the unique skin concerns detected in this exact image."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        }
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI is rate-limited. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      
      // If the model is experiencing high demand, fallback to the next model
      if (res.status === 503) {
        lastError = new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
        continue;
      }
      
      
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }
    
    // Process successful response
    const json = await res.json() as any;
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an unparseable response");
      parsed = JSON.parse(match[0]);
    }
    const result = AnalysisResultSchema.parse(parsed);
    return { result, model };

  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
    continue;
  }
  }

  throw lastError;
}

function inferScanType(): "morning" | "night" {
  const h = new Date().getHours();
  return h >= 5 && h < 17 ? "morning" : "night";
}

export type LocalScanCategory = "morning" | "afternoon" | "evening" | "night";

export function getLocalScanCategory(iso: string): LocalScanCategory {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export function getLocalScanCategoryLabel(cat: LocalScanCategory): string {
  if (cat === "morning") return "Morning Scan";
  if (cat === "afternoon") return "Afternoon Scan";
  if (cat === "evening") return "Evening Scan";
  return "Night Scan";
}

export type ScanRow = {
  id: string;
  overall_score: number;
  skin_age: number | null;
  skin_type: string | null;
  concerns: SkinAnalysisResult["concerns"];
  summary: string | null;
  recommendations: string[];
  metrics: ScanMetrics;
  scan_type: "morning" | "night";
  created_at: string;
};

type AnyClient = {
  from: (t: string) => any;
  rpc?: (...args: unknown[]) => unknown;
};

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Number.parseInt(a[i], 16) ^ Number.parseInt(b[i], 16);
    distance += x.toString(2).replaceAll("0", "").length;
  }
  return distance;
}

export const analyzeSkinPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const image_hash = await sha256Hex(data.imageDataUrl);
    const face_fingerprint_hash = data.faceFingerprint?.toLowerCase() ?? null;

    // Return cached scan for identical image so the same photo always yields the same result
    const cached = await client
      .from("skin_scans")
      .select("*")
      .eq("user_id", context.userId)
      .eq("image_hash", image_hash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached.error) throw new Error(cached.error.message);
    if (cached.data) return cached.data as ScanRow;

    // Return the closest recent scan for the same face, so tiny capture/light differences don't change results.
    if (face_fingerprint_hash) {
      const similar = await client
        .from("skin_scans")
        .select("*")
        .eq("user_id", context.userId)
        .not("face_fingerprint_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(80);
      if (similar.error) throw new Error(similar.error.message);

      const match = ((similar.data ?? []) as Array<ScanRow & { face_fingerprint_hash?: string | null }>)
        .map((row) => ({ row, distance: hammingDistanceHex(face_fingerprint_hash, row.face_fingerprint_hash ?? "") }))
        .filter((item) => item.distance <= 10)
        .sort((a, b) => a.distance - b.distance)[0]?.row;

      if (match) return match as ScanRow;
    }

    const { result, model } = await callVisionModel(data.imageDataUrl);
    const scan_type = inferScanType();

    const { data: row, error } = await client
      .from("skin_scans")
      .insert({
        user_id: context.userId,
        overall_score: result.overall_score,
        skin_age: result.skin_age,
        skin_type: result.skin_type,
        concerns: result.concerns,
        summary: result.summary,
        recommendations: result.recommendations,
        metrics: result.metrics,
        scan_type,
        model,
        image_hash,
        face_fingerprint_hash,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row as ScanRow;
  });

export const getLatestScan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data, error } = await client
      .from("skin_scans")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as ScanRow | null;
  });

export const listMyScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data, error } = await client
      .from("skin_scans")
      .select("id, overall_score, skin_age, skin_type, concerns, summary, recommendations, metrics, scan_type, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return ((data ?? []) as ScanRow[]);
  });

const IdInput = z.object({ id: z.string().uuid() });

export const getScanById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: row, error } = await client
      .from("skin_scans")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as ScanRow | null;
  });

export const deleteScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("skin_scans")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ComparePairInput = z.object({ a: z.string().uuid(), b: z.string().uuid() });

export const getScansForCompare = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ComparePairInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: rows, error } = await client
      .from("skin_scans")
      .select("*")
      .in("id", [data.a, data.b])
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as ScanRow[];
    return {
      a: list.find((r) => r.id === data.a) ?? null,
      b: list.find((r) => r.id === data.b) ?? null,
    };
  });

export type SharedScan = ScanRow;

export const enableScanSharing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;

    const existing = await client
      .from("skin_scans")
      .select("share_token")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (!existing.data) throw new Error("Scan not found");
    if (existing.data.share_token) return { share_token: existing.data.share_token as string };

    const token = crypto.randomUUID();
    const upd = await client
      .from("skin_scans")
      .update({ share_token: token })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("share_token")
      .single();
    if (upd.error || !upd.data) throw new Error(upd.error?.message ?? "Failed to enable sharing");
    return { share_token: upd.data.share_token as string };
  });

export const disableScanSharing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("skin_scans")
      .update({ share_token: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSharedScan = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Server misconfigured");

    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        headers: { "x-share-token": data.token },
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          h.set("x-share-token", data.token);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: row, error } = await supabasePublic
      .from("skin_scans")
      .select(
        "id, overall_score, skin_age, skin_type, concerns, summary, recommendations, metrics, scan_type, created_at",
      )
      .eq("share_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as SharedScan | null) ?? null;
  });


export const getMyScanShareToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: row, error } = await client
      .from("skin_scans")
      .select("share_token")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { share_token: (row?.share_token ?? null) as string | null };
  });
