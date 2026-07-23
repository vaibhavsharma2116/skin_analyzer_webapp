import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function userIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const ok = await userIsAdmin(context.supabase, context.userId);
  if (!ok) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await userIsAdmin(context.supabase, context.userId);
    return { isAdmin };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) return { granted: false };

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insErr && !insErr.message.includes("duplicate")) throw new Error(insErr.message);

    return { granted: true };
  });

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [users, scans, scansToday, reminders] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("skin_scans").select("id", { count: "exact", head: true }),
      context.supabase
        .from("skin_scans")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso),
      context.supabase.from("reminders").select("id", { count: "exact", head: true }),
    ]);

    return {
      totalUsers: users.count ?? 0,
      totalScans: scans.count ?? 0,
      scansToday: scansToday.count ?? 0,
      totalReminders: reminders.count ?? 0,
    };
  });

// ---------- Phase 2: Users ----------

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ search: z.string().trim().max(120).optional() })
      .default({})
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, gender, skin_type, primary_concern, preferred_language, onboarding_completed, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (data.search) {
      query = query.ilike("full_name", `%${data.search}%`);
    }

    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p) => p.id);

    // Fetch emails via Auth admin (paged, small scale ok)
    const emailMap = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data: usersPage, error: uErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (uErr) break;
      for (const u of usersPage.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
      if (usersPage.users.length < 200) break;
      page += 1;
      if (page > 10) break;
    }

    // Fetch roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    // Scan counts per user
    const scanCounts = new Map<string, number>();
    if (ids.length) {
      const { data: scans } = await supabaseAdmin
        .from("skin_scans")
        .select("user_id")
        .in("user_id", ids);
      for (const s of scans ?? []) {
        scanCounts.set(s.user_id, (scanCounts.get(s.user_id) ?? 0) + 1);
      }
    }

    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
      roles: rolesByUser.get(p.id) ?? [],
      scan_count: scanCounts.get(p.id) ?? 0,
    }));
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), admin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.admin) {
      throw new Error("You cannot remove your own admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("You cannot delete your own account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Phase 2: AI Reports (Skin Scans) ----------

export const listAllScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        minScore: z.number().int().min(0).max(100).optional(),
        maxScore: z.number().int().min(0).max(100).optional(),
        scanType: z.string().max(20).optional(),
      })
      .default({})
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("skin_scans")
      .select("id, user_id, overall_score, skin_age, skin_type, scan_type, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (typeof data.minScore === "number") q = q.gte("overall_score", data.minScore);
    if (typeof data.maxScore === "number") q = q.lte("overall_score", data.maxScore);
    if (data.scanType) q = q.eq("scan_type", data.scanType);

    const { data: scans, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((scans ?? []).map((s) => s.user_id)));
    const nameMap = new Map<string, string | null>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profs ?? []) nameMap.set(p.id, p.full_name);
    }

    return (scans ?? []).map((s) => ({
      ...s,
      user_name: nameMap.get(s.user_id) ?? null,
    }));
  });

export const getScanDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: scan, error } = await supabaseAdmin
      .from("skin_scans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!scan) throw new Error("Scan not found");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, gender, skin_type, primary_concern")
      .eq("id", scan.user_id)
      .maybeSingle();

    return { scan, profile };
  });
