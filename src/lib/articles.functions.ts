import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ArticleInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().nullable(),
  cover_image: z.string().trim().url().max(1000).optional().nullable().or(z.literal("")),
  content: z.string().max(100_000).default(""),
  category: z.string().trim().max(80).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  published: z.boolean().default(false),
});

export type ArticleInput = z.infer<typeof ArticleInput>;

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

function normalize(input: ArticleInput) {
  return {
    ...input,
    cover_image: input.cover_image ? input.cover_image : null,
    excerpt: input.excerpt || null,
    category: input.category || null,
  };
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ArticleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      ...normalize(data),
      author_id: context.userId,
      published_at: data.published ? new Date().toISOString() : null,
    };
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), values: ArticleInput }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("published, published_at")
      .eq("id", data.id)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const published_at =
      data.values.published && !existing?.published_at
        ? nowIso
        : !data.values.published
          ? null
          : existing?.published_at ?? nowIso;

    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .update({ ...normalize(data.values), published_at })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
