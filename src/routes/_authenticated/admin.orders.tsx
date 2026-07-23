import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listOrders, getOrder, updateOrderStatus, updatePaymentStatus, updateOrderTracking, deleteOrder,
  type OrderStatus, type PaymentStatus,
} from "@/lib/orders.functions";
import { toast } from "sonner";
import { Eye, Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
});

type Order = Awaited<ReturnType<typeof listOrders>>[number];
type OrderDetail = Awaited<ReturnType<typeof getOrder>>;

const ORDER_STATUSES: OrderStatus[] = [
  "pending","confirmed","processing","shipped","delivered","cancelled","refunded",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid","paid","failed","refunded"];

const statusVariant: Record<OrderStatus, "default" | "secondary" | "outline" | "coral" | "sage" | "sand"> = {
  pending: "secondary",
  confirmed: "sand",
  processing: "sand",
  shipped: "default",
  delivered: "sage",
  cancelled: "coral",
  refunded: "coral",
};

const paymentVariant: Record<PaymentStatus, "default" | "secondary" | "outline" | "coral" | "sage" | "sand"> = {
  unpaid: "secondary",
  paid: "sage",
  failed: "coral",
  refunded: "coral",
};

function fmt(n: number | string, cur: string) {
  return `${cur} ${Number(n).toFixed(2)}`;
}

function AdminOrdersPage() {
  const listFn = useServerFn(listOrders);
  const getFn = useServerFn(getOrder);
  const statusFn = useServerFn(updateOrderStatus);
  const payFn = useServerFn(updatePaymentStatus);
  const trackFn = useServerFn(updateOrderTracking);
  const deleteFn = useServerFn(deleteOrder);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tracking, setTracking] = useState({ number: "", url: "" });

  async function load() {
    try {
      const r = await listFn();
      setOrders(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return null;
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        return (
          o.order_number.toLowerCase().includes(needle) ||
          (o.customer_name ?? "").toLowerCase().includes(needle) ||
          (o.customer_email ?? "").toLowerCase().includes(needle) ||
          (o.customer_phone ?? "").toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [orders, filter, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    for (const s of ORDER_STATUSES) c[s] = 0;
    for (const o of orders ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await getFn({ data: { id } });
      setDetail(d);
      setTracking({
        number: d.order.tracking_number ?? "",
        url: d.order.tracking_url ?? "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load order");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(o: Order, next: OrderStatus) {
    setBusyId(o.id);
    try {
      await statusFn({ data: { id: o.id, status: next } });
      toast.success(`Status → ${next}`);
      await load();
      if (detail && detail.order.id === o.id) {
        setDetail({ ...detail, order: { ...detail.order, status: next } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function changePayment(o: Order, next: PaymentStatus) {
    setBusyId(o.id);
    try {
      await payFn({ data: { id: o.id, payment_status: next } });
      toast.success(`Payment → ${next}`);
      await load();
      if (detail && detail.order.id === o.id) {
        setDetail({ ...detail, order: { ...detail.order, payment_status: next } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function saveTracking() {
    if (!detail) return;
    setBusyId(detail.order.id);
    try {
      const row = await trackFn({
        data: {
          id: detail.order.id,
          tracking_number: tracking.number || null,
          tracking_url: tracking.url || null,
        },
      });
      setDetail({ ...detail, order: row });
      toast.success("Tracking saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(o: Order) {
    setBusyId(o.id);
    try {
      await deleteFn({ data: { id: o.id } });
      toast.success("Order removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            View orders, update fulfillment status, mark payments, and set tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, name, email…"
            className="w-64"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({counts.all})</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} ({counts[s] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ORDER_STATUSES.map((s) => (
          <Card key={s} className="cursor-pointer" onClick={() => setFilter(s)}>
            <CardContent className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{s}</div>
              <div className="mt-1 text-2xl font-semibold">{counts[s] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Orders {filtered ? `(${filtered.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered === null && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {filtered?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No orders match this filter.
                    </TableCell>
                  </TableRow>
                )}
                {filtered?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      <code className="rounded bg-muted px-2 py-1 text-xs">{o.order_number}</code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{o.customer_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.customer_email || o.customer_phone || ""}</div>
                    </TableCell>
                    <TableCell>{fmt(o.total, o.currency)}</TableCell>
                    <TableCell>
                      <Select
                        value={o.payment_status}
                        disabled={busyId === o.id}
                        onValueChange={(v) => changePayment(o, v as PaymentStatus)}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <Badge variant={paymentVariant[o.payment_status as PaymentStatus]}>
                            {o.payment_status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        disabled={busyId === o.id}
                        onValueChange={(v) => changeStatus(o, v as OrderStatus)}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <Badge variant={statusVariant[o.status as OrderStatus]}>
                            {o.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openDetail(o.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={busyId === o.id}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                              <AlertDialogDescription>
                                “{o.order_number}” and its items will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(o)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Order {detail?.order.order_number ?? ""}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {detail && (
            <div className="grid gap-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">Customer</div>
                  <div className="mt-1 text-sm font-medium">{detail.order.customer_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{detail.order.customer_email}</div>
                  <div className="text-xs text-muted-foreground">{detail.order.customer_phone}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">Shipping</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">
                    {detail.order.shipping_address || "—"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Order status</Label>
                  <Select
                    value={detail.order.status}
                    onValueChange={(v) => changeStatus(detail.order, v as OrderStatus)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Payment status</Label>
                  <Select
                    value={detail.order.payment_status}
                    onValueChange={(v) => changePayment(detail.order, v as PaymentStatus)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {it.image_url ? (
                              <img src={it.image_url} alt={it.name}
                                   className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted" />
                            )}
                            <span className="text-sm">{it.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{fmt(it.unit_price, detail.order.currency)}</TableCell>
                        <TableCell className="text-right">{fmt(it.subtotal, detail.order.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt(detail.order.subtotal, detail.order.currency)}</span>
                </div>
                {Number(detail.order.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Discount {detail.order.coupon_code ? `(${detail.order.coupon_code})` : ""}
                    </span>
                    <span>− {fmt(detail.order.discount, detail.order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span>{fmt(detail.order.total, detail.order.currency)}</span>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border p-3">
                <div className="text-sm font-medium">Tracking</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Tracking number</Label>
                    <Input
                      value={tracking.number}
                      onChange={(e) => setTracking({ ...tracking, number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tracking URL</Label>
                    <Input
                      value={tracking.url}
                      onChange={(e) => setTracking({ ...tracking, url: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Button size="sm" onClick={saveTracking} disabled={busyId === detail.order.id}>
                    Save tracking
                  </Button>
                </div>
              </div>

              {detail.order.notes && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="text-xs uppercase text-muted-foreground">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap">{detail.order.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
