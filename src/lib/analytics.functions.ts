import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const RangeInput = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

export type AnalyticsSummary = {
  range_days: number;
  totals: {
    users: number;
    new_users: number;
    scans: number;
    new_scans: number;
    reminders: number;
    new_reminders: number;
    orders: number;
    new_orders: number;
    articles: number;
    experts: number;
    products: number;
    coupons: number;
  };
  active_users: number;
  scans_per_user: number;
  onboarding_completion_pct: number;
  reminder_completion_pct: number;
  users_by_day: { date: string; count: number }[];
  scans_by_day: { date: string; count: number }[];
  orders_by_day: { date: string; count: number }[];
  scans_by_type: { type: string; count: number }[];
  skin_type_breakdown: { skin_type: string; count: number }[];
  concern_breakdown: { concern: string; count: number }[];
  language_breakdown: { language: string; count: number }[];
  gender_breakdown: { gender: string; count: number }[];
  score_distribution: { bucket: string; count: number }[];
  reminder_status: { status: string; count: number }[];
  top_active_users: { user_id: string; name: string; scans: number }[];
};

const emptyDayMap = (days: number) => {
  const m = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    m.set(d, 0);
  }
  return m;
};

const bumpDay = (m: Map<string, number>, iso: string) => {
  const d = String(iso).slice(0, 10);
  if (m.has(d)) m.set(d, (m.get(d) ?? 0) + 1);
};

export const getAnalyticsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => RangeInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AnalyticsSummary> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [
      profilesAll,
      scansAll,
      remindersAll,
      ordersAll,
      articlesCount,
      expertsCount,
      productsCount,
      couponsCount,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, gender, skin_type, primary_concern, preferred_language, onboarding_completed, created_at"),
      supabaseAdmin
        .from("skin_scans")
        .select("id, user_id, overall_score, scan_type, created_at"),
      supabaseAdmin.from("reminders").select("id, completed, created_at"),
      supabaseAdmin.from("orders").select("id, created_at"),
      supabaseAdmin.from("articles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("experts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("coupons").select("id", { count: "exact", head: true }),
    ]);

    const profiles = profilesAll.data ?? [];
    const scans = scansAll.data ?? [];
    const reminders = remindersAll.data ?? [];
    const orders = ordersAll.data ?? [];

    const newProfiles = profiles.filter((p: any) => p.created_at >= sinceIso);
    const newScans = scans.filter((s: any) => s.created_at >= sinceIso);
    const newReminders = reminders.filter((r: any) => r.created_at >= sinceIso);
    const newOrders = orders.filter((o: any) => o.created_at >= sinceIso);

    const usersDay = emptyDayMap(data.days);
    for (const p of newProfiles) bumpDay(usersDay, p.created_at);
    const scansDay = emptyDayMap(data.days);
    for (const s of newScans) bumpDay(scansDay, s.created_at);
    const ordersDay = emptyDayMap(data.days);
    for (const o of newOrders) bumpDay(ordersDay, o.created_at);

    const bucket = (m: Map<string, number>) => {
      const arr: { type?: string; skin_type?: string; concern?: string; language?: string; gender?: string; count: number; [k: string]: any }[] = [];
      m.forEach((count, key) => arr.push({ key, count } as any));
      return arr;
    };

    const cnt = <T extends string>(rows: any[], field: string) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const v = (r[field] ?? "unknown") as string;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return Array.from(m.entries())
        .map(([k, count]) => ({ [field === "primary_concern" ? "concern" : field === "preferred_language" ? "language" : field]: k, count }))
        .sort((a: any, b: any) => b.count - a.count);
    };

    const scanByType = cnt(scans, "scan_type").map((x: any) => ({ type: x.scan_type, count: x.count }));
    const skinTypes = cnt(profiles, "skin_type") as any;
    const concerns = cnt(profiles, "primary_concern") as any;
    const languages = cnt(profiles, "preferred_language") as any;
    const genders = cnt(profiles, "gender") as any;

    const buckets = [
      { label: "0–40", min: 0, max: 40 },
      { label: "41–60", min: 41, max: 60 },
      { label: "61–75", min: 61, max: 75 },
      { label: "76–90", min: 76, max: 90 },
      { label: "91–100", min: 91, max: 100 },
    ];
    const score_distribution = buckets.map((b) => ({
      bucket: b.label,
      count: scans.filter((s: any) => {
        const v = Number(s.overall_score ?? -1);
        return v >= b.min && v <= b.max;
      }).length,
    }));

    const reminder_status = [
      { status: "completed", count: reminders.filter((r: any) => r.completed).length },
      { status: "pending", count: reminders.filter((r: any) => !r.completed).length },
    ];

    const activeUserIds = new Set<string>();
    const scanCountByUser = new Map<string, number>();
    for (const s of newScans) {
      activeUserIds.add(s.user_id);
      scanCountByUser.set(s.user_id, (scanCountByUser.get(s.user_id) ?? 0) + 1);
    }

    const topIds = Array.from(scanCountByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const nameMap = new Map<string, string>();
    if (topIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", topIds.map((t) => t[0]));
      for (const p of profs ?? []) nameMap.set(p.id, p.full_name ?? "—");
    }
    const top_active_users = topIds.map(([user_id, scans]) => ({
      user_id,
      name: nameMap.get(user_id) ?? "—",
      scans,
    }));

    const onboardingDone = profiles.filter((p: any) => p.onboarding_completed).length;

    return {
      range_days: data.days,
      totals: {
        users: profiles.length,
        new_users: newProfiles.length,
        scans: scans.length,
        new_scans: newScans.length,
        reminders: reminders.length,
        new_reminders: newReminders.length,
        orders: orders.length,
        new_orders: newOrders.length,
        articles: articlesCount.count ?? 0,
        experts: expertsCount.count ?? 0,
        products: productsCount.count ?? 0,
        coupons: couponsCount.count ?? 0,
      },
      active_users: activeUserIds.size,
      scans_per_user: profiles.length ? scans.length / profiles.length : 0,
      onboarding_completion_pct: profiles.length ? (onboardingDone / profiles.length) * 100 : 0,
      reminder_completion_pct: reminders.length
        ? (reminders.filter((r: any) => r.completed).length / reminders.length) * 100
        : 0,
      users_by_day: Array.from(usersDay.entries()).map(([date, count]) => ({ date, count })),
      scans_by_day: Array.from(scansDay.entries()).map(([date, count]) => ({ date, count })),
      orders_by_day: Array.from(ordersDay.entries()).map(([date, count]) => ({ date, count })),
      scans_by_type: scanByType,
      skin_type_breakdown: skinTypes,
      concern_breakdown: concerns,
      language_breakdown: languages,
      gender_breakdown: genders,
      score_distribution,
      reminder_status,
      top_active_users,
    };
  });
