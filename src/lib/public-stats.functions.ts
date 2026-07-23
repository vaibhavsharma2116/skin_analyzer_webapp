import { createServerFn } from "@tanstack/react-start";

export const getScanCount = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("skin_scans")
    .select("*", { count: "exact", head: true });
  if (error) return { count: 0 };
  return { count: count ?? 0 };
});
