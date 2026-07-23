import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Settings — SKIN POP" },
      { name: "description", content: "Personalize your SKIN POP experience — profile, notifications, preferences and security." },
    ],
  }),
  component: () => <Outlet />,
});
