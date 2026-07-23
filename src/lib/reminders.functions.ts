import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReminderCategory = "routine" | "product" | "lifestyle" | "appointment";
export type ReminderRepeat = "once" | "daily" | "weekly" | "weekdays" | "weekends" | "custom";
export type ReminderLogStatus = "completed" | "missed" | "snoozed" | "upcoming";

export type ReminderRow = {
  id: string;
  user_id: string;
  category: ReminderCategory;
  name: string;
  repeat: ReminderRepeat;
  repeat_days: number[];
  time_of_day: string; // "HH:MM:SS"
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  notify_minutes_before: number;
  note: string | null;
  steps: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReminderLogRow = {
  id: string;
  user_id: string;
  reminder_id: string;
  scheduled_date: string;
  status: ReminderLogStatus;
  snoozed_until: string | null;
  created_at: string;
};

type AnyClient = { from: (t: string) => any };

const CategoryEnum = z.enum(["routine", "product", "lifestyle", "appointment"]);
const RepeatEnum = z.enum(["once", "daily", "weekly", "weekdays", "weekends", "custom"]);

const CreateInput = z.object({
  category: CategoryEnum.default("routine"),
  name: z.string().min(1).max(80),
  repeat: RepeatEnum.default("daily"),
  repeat_days: z.array(z.number().int().min(0).max(6)).default([]),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default("08:00"),
  start_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
  end_date: z.string().nullable().optional(),
  notify_minutes_before: z.number().int().min(0).max(1440).default(15),
  note: z.string().max(500).nullable().optional(),
  steps: z.array(z.string().min(1).max(60)).max(20).default([]),
});

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data, error } = await client
      .from("reminders")
      .select("*")
      .eq("user_id", context.userId)
      .order("time_of_day", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ReminderRow[];
  });

const IdInput = z.object({ id: z.string().uuid() });

export const getReminder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => IdInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: row, error } = await client
      .from("reminders")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as ReminderRow | null;
  });

export const createReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => CreateInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: row, error } = await client
      .from("reminders")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ReminderRow;
  });

const UpdateInput = CreateInput.partial().extend({ id: z.string().uuid() });

export const updateReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => UpdateInput.parse(v))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const client = context.supabase as unknown as AnyClient;
    const { data: row, error } = await client
      .from("reminders")
      .update(patch)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ReminderRow;
  });

export const toggleReminderActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("reminders")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => IdInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("reminders")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SnoozeInput = z.object({
  id: z.string().uuid(),
  scheduled_date: z.string(),
  minutes: z.number().int().min(1).max(24 * 60),
});

export const snoozeReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => SnoozeInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const snoozedUntil = new Date(Date.now() + data.minutes * 60_000).toISOString();
    const { error } = await client
      .from("reminder_logs")
      .upsert(
        {
          user_id: context.userId,
          reminder_id: data.id,
          scheduled_date: data.scheduled_date,
          status: "snoozed",
          snoozed_until: snoozedUntil,
        },
        { onConflict: "reminder_id,scheduled_date" },
      );
    if (error) throw new Error(error.message);
    return { snoozed_until: snoozedUntil };
  });

const LogInput = z.object({
  id: z.string().uuid(),
  scheduled_date: z.string(),
  status: z.enum(["completed", "missed", "snoozed", "upcoming"]),
});

export const setReminderLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => LogInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("reminder_logs")
      .upsert(
        {
          user_id: context.userId,
          reminder_id: data.id,
          scheduled_date: data.scheduled_date,
          status: data.status,
        },
        { onConflict: "reminder_id,scheduled_date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RangeInput = z.object({
  from: z.string(),
  to: z.string(),
});

export const listReminderLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => RangeInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { data: rows, error } = await client
      .from("reminder_logs")
      .select("*")
      .eq("user_id", context.userId)
      .gte("scheduled_date", data.from)
      .lte("scheduled_date", data.to);
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReminderLogRow[];
  });
