import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRevenueSummary } from "@/lib/revenue.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, ShoppingBag, Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/revenue")({
  component: RevenuePage,
});

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function RevenuePage() {
  const [days, setDays] = useState(30);
  const fn = useServerFn(getRevenueSummary);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "revenue", days],
    queryFn: () => fn({ data: { days } }),
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: data?.currency || "INR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const maxDay = useMemo(
    () => (data?.by_day?.length ? Math.max(...data.by_day.map((d) => d.revenue), 1) : 1),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return <div>Failed to load revenue.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Revenue</h1>
          <p className="text-sm text-muted-foreground">
            Sales performance over the last {data.range_days} days
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Gross revenue"
          value={fmt(data.gross_revenue)}
          hint={`${data.paid_orders} paid orders`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Net revenue"
          value={fmt(data.net_revenue)}
          hint={`Refunds ${fmt(data.refunds)}`}
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}
          label="Avg order value"
          value={fmt(data.avg_order_value)}
          hint={`${data.total_orders} total orders`}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-amber-600" />}
          label="Pending payment"
          value={fmt(data.pending_amount)}
          hint={`Discounts ${fmt(data.discounts)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-end gap-1">
            {data.by_day.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                  style={{
                    height: `${(d.revenue / maxDay) * 100}%`,
                    minHeight: d.revenue > 0 ? 2 : 0,
                  }}
                  title={`${d.date}: ${fmt(d.revenue)} (${d.orders} orders)`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{data.by_day[0]?.date}</span>
            <span>{data.by_day[data.by_day.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By order status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_status.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right">{fmt(s.amount)}</TableCell>
                  </TableRow>
                ))}
                {data.by_status.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By payment status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_payment_status.map((s) => (
                  <TableRow key={s.payment_status}>
                    <TableCell><Badge variant="outline">{s.payment_status}</Badge></TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right">{fmt(s.amount)}</TableCell>
                  </TableRow>
                ))}
                {data.by_payment_status.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Top products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_products.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="max-w-[240px] truncate">{p.name}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(p.revenue)}</TableCell>
                  </TableRow>
                ))}
                {data.top_products.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No paid orders yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Top coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Uses</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_coupons.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="text-right">{c.uses}</TableCell>
                    <TableCell className="text-right">{fmt(c.discount)}</TableCell>
                  </TableRow>
                ))}
                {data.top_coupons.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No coupons used</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent paid orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_paid.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{o.customer_name || "—"}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{fmt(o.total)}</TableCell>
                </TableRow>
              ))}
              {data.recent_paid.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No paid orders in this range</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
  value: string;
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
