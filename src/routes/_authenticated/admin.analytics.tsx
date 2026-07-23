import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary } from "@/lib/analytics.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Users,
  Camera,
  Bell,
  ShoppingBag,
  BookOpen,
  UserCog,
  Package,
  Ticket,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const fn = useServerFn(getAnalyticsSummary);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: () => fn({ data: { days } }),
  });

  const maxUsers = useMemo(
    () => (data?.users_by_day.length ? Math.max(...data.users_by_day.map((d) => d.count), 1) : 1),
    [data],
  );
  const maxScans = useMemo(
    () => (data?.scans_by_day.length ? Math.max(...data.scans_by_day.map((d) => d.count), 1) : 1),
    [data],
  );
  const maxOrders = useMemo(
    () => (data?.orders_by_day.length ? Math.max(...data.orders_by_day.map((d) => d.count), 1) : 1),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return <div>Failed to load analytics.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Product & engagement metrics for the last {data.range_days} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4 text-primary" />} label="Total users" value={data.totals.users} hint={`+${data.totals.new_users} new`} />
        <StatCard icon={<Activity className="h-4 w-4 text-emerald-600" />} label="Active users" value={data.active_users} hint={`in ${data.range_days}d`} />
        <StatCard icon={<Camera className="h-4 w-4 text-blue-600" />} label="Total scans" value={data.totals.scans} hint={`+${data.totals.new_scans} new`} />
        <StatCard icon={<Bell className="h-4 w-4 text-amber-600" />} label="Reminders" value={data.totals.reminders} hint={`+${data.totals.new_reminders} new`} />
        <StatCard icon={<ShoppingBag className="h-4 w-4 text-fuchsia-600" />} label="Orders" value={data.totals.orders} hint={`+${data.totals.new_orders} new`} />
        <StatCard icon={<BookOpen className="h-4 w-4 text-indigo-600" />} label="Articles" value={data.totals.articles} />
        <StatCard icon={<UserCog className="h-4 w-4 text-teal-600" />} label="Experts" value={data.totals.experts} />
        <StatCard icon={<Package className="h-4 w-4 text-rose-600" />} label="Products" value={data.totals.products} hint={`${data.totals.coupons} coupons`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RateCard label="Onboarding completion" pct={data.onboarding_completion_pct} />
        <RateCard label="Reminder completion" pct={data.reminder_completion_pct} />
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Scans per user</div>
            <div className="mt-2 text-2xl font-semibold">{data.scans_per_user.toFixed(2)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {data.totals.scans} scans / {data.totals.users} users
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BarChartCard title="New users / day" data={data.users_by_day} max={maxUsers} colorClass="bg-primary/80" />
        <BarChartCard title="Scans / day" data={data.scans_by_day} max={maxScans} colorClass="bg-blue-500/80" />
        <BarChartCard title="Orders / day" data={data.orders_by_day} max={maxOrders} colorClass="bg-fuchsia-500/80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Scan types" rows={data.scans_by_type.map((s) => ({ label: s.type, count: s.count }))} />
        <BreakdownCard title="Score distribution" rows={data.score_distribution.map((s) => ({ label: s.bucket, count: s.count }))} />
        <BreakdownCard title="Skin types" rows={data.skin_type_breakdown.map((s: any) => ({ label: s.skin_type, count: s.count }))} />
        <BreakdownCard title="Primary concerns" rows={data.concern_breakdown.map((s: any) => ({ label: s.concern, count: s.count }))} />
        <BreakdownCard title="Preferred languages" rows={data.language_breakdown.map((s: any) => ({ label: s.language, count: s.count }))} />
        <BreakdownCard title="Gender" rows={data.gender_breakdown.map((s: any) => ({ label: s.gender, count: s.count }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Reminder status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reminder_status.map((r) => (
                  <TableRow key={r.status}>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Top active users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_active_users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="max-w-[240px] truncate">{u.name}</TableCell>
                    <TableCell className="text-right">{u.scans}</TableCell>
                  </TableRow>
                ))}
                {data.top_active_users.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No active users in this range</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function RateCard({ label, pct }: { label: string; pct: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{pct.toFixed(1)}%</div>
        <Progress value={pct} className="mt-3" />
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  data,
  max,
  colorClass,
}: {
  title: string;
  data: { date: string; count: number }[];
  max: number;
  colorClass: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-1">
          {data.map((d) => (
            <div key={d.date} className="group flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t ${colorClass} transition-all`}
                style={{
                  height: `${(d.count / max) * 100}%`,
                  minHeight: d.count > 0 ? 2 : 0,
                }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
        {rows.map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate">{r.label || "—"}</span>
              <span className="text-muted-foreground">
                {r.count} ({((r.count / total) * 100).toFixed(0)}%)
              </span>
            </div>
            <Progress value={(r.count / total) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
