import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin.functions";
import { Users, Sparkles, CalendarClock, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type Stats = {
  totalUsers: number;
  totalScans: number;
  scansToday: number;
  totalReminders: number;
};

function AdminDashboard() {
  const fn = useServerFn(getAdminDashboardStats);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fn().then(setStats).catch(() => setStats(null));
  }, [fn]);

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users },
    { label: "Total AI Scans", value: stats?.totalScans ?? "—", icon: Sparkles },
    { label: "Scans Today", value: stats?.scansToday ?? "—", icon: Activity },
    { label: "Active Reminders", value: stats?.totalReminders ?? "—", icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your SKIN POP platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Phase 2 will add User Management and AI Reports. After that: Products, Orders,
          Coupons, Articles, Experts, Revenue, and Analytics.
        </CardContent>
      </Card>
    </div>
  );
}
