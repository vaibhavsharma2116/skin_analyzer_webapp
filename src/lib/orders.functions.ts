import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OrderStatus = z.enum([
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
]);
const PaymentStatus = z.enum(["unpaid", "paid", "failed", "refunded"]);
export type OrderStatus = z.infer<typeof OrderStatus>;
export type PaymentStatus = z.infer<typeof PaymentStatus>;

const OrderItemInput = z.object({
  product_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  image_url: z.string().trim().max(1000).nullable().optional(),
  unit_price: z.number().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(1000),
});

const CreateOrderInput = z.object({
  items: z.array(OrderItemInput).min(1).max(50),
  customer_name: z.string().trim().max(200).default(""),
  customer_email: z.string().trim().max(200).default(""),
  customer_phone: z.string().trim().max(40).default(""),
  shipping_address: z.string().trim().max(1000).default(""),
  notes: z.string().trim().max(1000).default(""),
  coupon_code: z.string().trim().max(40).nullable().optional(),
  currency: z.string().trim().max(8).default("INR"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInput>;

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

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: items, error: iErr } = await supabaseAdmin
      .from("order_items").select("*").eq("order_id", data.id)
      .order("created_at", { ascending: true });
    if (iErr) throw new Error(iErr.message);
    return { order, items: items ?? [] };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders").select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => CreateOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const subtotal = data.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    let discount = 0;
    let couponCode: string | null = null;

    if (data.coupon_code && data.coupon_code.trim()) {
      const { data: rows, error } = await context.supabase.rpc("redeem_coupon", {
        _code: data.coupon_code.trim(),
      });
      if (error) throw new Error(error.message);
      const c = Array.isArray(rows) ? rows[0] : rows;
      if (!c || c.status !== "ok") {
        throw new Error(`Coupon ${c?.status ?? "invalid"}`);
      }
      couponCode = c.code;
      discount = c.discount_type === "percent"
        ? (subtotal * Number(c.discount_value)) / 100
        : Number(c.discount_value);
      discount = Math.min(discount, subtotal);
    }

    const total = Math.max(0, subtotal - discount);

    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        subtotal, discount, total,
        currency: data.currency,
        coupon_code: couponCode,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        notes: data.notes,
      })
      .select("*").single();
    if (oErr) throw new Error(oErr.message);

    const itemsPayload = data.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id ?? null,
      name: it.name,
      image_url: it.image_url ?? null,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.unit_price * it.quantity,
    }));
    const { error: iErr } = await context.supabase.from("order_items").insert(itemsPayload);
    if (iErr) throw new Error(iErr.message);

    return order;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: OrderStatus }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders").update({ status: data.status }).eq("id", data.id)
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), payment_status: PaymentStatus }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders").update({ payment_status: data.payment_status }).eq("id", data.id)
      .select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateOrderTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      tracking_number: z.string().trim().max(120).nullable().optional(),
      tracking_url: z.string().trim().max(1000).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .update({
        tracking_number: data.tracking_number || null,
        tracking_url: data.tracking_url || null,
      })
      .eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
