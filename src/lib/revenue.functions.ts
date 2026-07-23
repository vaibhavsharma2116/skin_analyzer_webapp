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

export type RevenueSummary = {
  range_days: number;
  currency: string;
  gross_revenue: number;
  net_revenue: number;
  discounts: number;
  refunds: number;
  paid_orders: number;
  total_orders: number;
  avg_order_value: number;
  pending_amount: number;
  by_day: { date: string; revenue: number; orders: number }[];
  by_status: { status: string; count: number; amount: number }[];
  by_payment_status: { payment_status: string; count: number; amount: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
  top_coupons: { code: string; uses: number; discount: number }[];
  recent_paid: {
    id: string;
    total: number;
    currency: string;
    customer_name: string;
    created_at: string;
  }[];
};

export const getRevenueSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => RangeInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<RevenueSummary> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = orders ?? [];
    const currency = rows[0]?.currency || "INR";

    const paid = rows.filter((o: any) => o.payment_status === "paid");
    const refunded = rows.filter((o: any) => o.payment_status === "refunded");
    const gross = paid.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const refundAmt = refunded.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const discounts = rows.reduce((s: number, o: any) => s + Number(o.discount || 0), 0);
    const pending = rows
      .filter((o: any) => o.payment_status === "unpaid")
      .reduce((s: number, o: any) => s + Number(o.total || 0), 0);

    const byDayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      byDayMap.set(d, { revenue: 0, orders: 0 });
    }
    for (const o of paid) {
      const d = String(o.created_at).slice(0, 10);
      const cur = byDayMap.get(d) ?? { revenue: 0, orders: 0 };
      cur.revenue += Number(o.total || 0);
      cur.orders += 1;
      byDayMap.set(d, cur);
    }
    const by_day = Array.from(byDayMap.entries()).map(([date, v]) => ({ date, ...v }));

    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const o of rows) {
      const s = o.status || "pending";
      const cur = statusMap.get(s) ?? { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += Number(o.total || 0);
      statusMap.set(s, cur);
    }
    const payMap = new Map<string, { count: number; amount: number }>();
    for (const o of rows) {
      const s = o.payment_status || "unpaid";
      const cur = payMap.get(s) ?? { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += Number(o.total || 0);
      payMap.set(s, cur);
    }

    // Top products from order_items joined to paid orders
    const paidIds = paid.map((o: any) => o.id);
    let top_products: RevenueSummary["top_products"] = [];
    if (paidIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("name, quantity, subtotal, order_id")
        .in("order_id", paidIds);
      const map = new Map<string, { quantity: number; revenue: number }>();
      for (const it of items ?? []) {
        const cur = map.get(it.name) ?? { quantity: 0, revenue: 0 };
        cur.quantity += Number(it.quantity || 0);
        cur.revenue += Number(it.subtotal || 0);
        map.set(it.name, cur);
      }
      top_products = Array.from(map.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }

    const coupMap = new Map<string, { uses: number; discount: number }>();
    for (const o of rows) {
      if (!o.coupon_code) continue;
      const cur = coupMap.get(o.coupon_code) ?? { uses: 0, discount: 0 };
      cur.uses += 1;
      cur.discount += Number(o.discount || 0);
      coupMap.set(o.coupon_code, cur);
    }
    const top_coupons = Array.from(coupMap.entries())
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 10);

    return {
      range_days: data.days,
      currency,
      gross_revenue: gross,
      net_revenue: gross - refundAmt,
      discounts,
      refunds: refundAmt,
      paid_orders: paid.length,
      total_orders: rows.length,
      avg_order_value: paid.length ? gross / paid.length : 0,
      pending_amount: pending,
      by_day,
      by_status: Array.from(statusMap.entries()).map(([status, v]) => ({ status, ...v })),
      by_payment_status: Array.from(payMap.entries()).map(([payment_status, v]) => ({
        payment_status,
        ...v,
      })),
      top_products,
      top_coupons,
      recent_paid: paid.slice(0, 10).map((o: any) => ({
        id: o.id,
        total: Number(o.total || 0),
        currency: o.currency,
        customer_name: o.customer_name || "",
        created_at: o.created_at,
      })),
    };
  });
