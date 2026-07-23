import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DashboardHome } from "@/components/app/dashboard-home";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profiles.functions";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — SKIN POP" },
      {
        name: "description",
        content: "View your skin score preview, quick scan actions, and personalized skincare dashboard.",
      },
    ],
  }),
  component: DashboardPage,
});

type ProfileRecord = {
  full_name?: string | null;
  skin_type?: string | null;
  primary_concern?: string | null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchLatest = useServerFn(getLatestScan);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [latest, setLatest] = useState<ScanRow | null>(null);

  useEffect(() => {
    let active = true;

    void fetchProfile()
      .then((result) => {
        if (active) setProfile((result as ProfileRecord | null) ?? null);
      })
      .catch(() => {
        navigate({ to: "/auth", replace: true });
      });

    void fetchLatest()
      .then((row) => {
        if (active) setLatest((row as ScanRow | null) ?? null);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      active = false;
    };
  }, [fetchProfile, fetchLatest, navigate]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return <DashboardHome profile={profile} latest={latest} onSignOut={handleSignOut} />;
}

