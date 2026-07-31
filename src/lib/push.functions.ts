import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PushSubscriptionInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

type AnyClient = { from: (t: string) => any };

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => PushSubscriptionInput.parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("push_subscriptions")
      .upsert({
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      }, { onConflict: "endpoint" });

    if (error) {
      console.error("Failed to save push subscription:", error);
      throw new Error("Failed to save push subscription");
    }

    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ endpoint: z.string().url() }).parse(v))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as AnyClient;
    const { error } = await client
      .from("push_subscriptions")
      .delete()
      .match({ user_id: context.userId, endpoint: data.endpoint });

    if (error) {
      console.error("Failed to remove push subscription:", error);
      throw new Error("Failed to remove push subscription");
    }

    return { ok: true };
  });
