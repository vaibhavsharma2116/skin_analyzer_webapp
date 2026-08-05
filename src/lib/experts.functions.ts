import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ExpertInput = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase, digits and dashes only"),
  name: z.string().trim().min(1).max(200),
  title: z.string().trim().max(120).default(""),
  years: z.string().trim().max(60).default(""),
  rating: z.number().min(0).max(5).default(5),
  answers_count: z.number().int().min(0).max(1_000_000).default(0),
  followers: z.string().trim().max(60).default(""),
  positive: z.string().trim().max(20).default(""),
  bio: z.string().trim().max(2000).default(""),
  initials: z.string().trim().max(6).default(""),
  tone: z.string().trim().max(120).default("bg-primary/15 text-primary"),
  active: z.boolean().default(true),
});

export type ExpertInput = z.infer<typeof ExpertInput>;

export const listExperts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("experts")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listExpertAnswers = createServerFn({ method: "GET" })
  .validator((expertId: string | undefined) => z.string().optional().parse(expertId))
  .handler(async ({ data: expertId }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("expert_answers").select("*").order("created_at", { ascending: false });
    if (expertId) {
      query = query.eq("expert_id", expertId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getExpert = createServerFn({ method: "GET" })
  .validator((idOrSlug: string) => z.string().parse(idOrSlug))
  .handler(async ({ data: idOrSlug }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = supabaseAdmin.from("experts").select("*");
    if (isUuid) {
      query = query.eq("id", idOrSlug);
    } else {
      query = query.eq("slug", idOrSlug);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const createExpert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ExpertInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("experts")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateExpert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), values: ExpertInput }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("experts")
      .update(data.values)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteExpert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("experts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
