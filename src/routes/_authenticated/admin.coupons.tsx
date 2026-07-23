import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listCoupons, createCoupon, updateCoupon, deleteCoupon, setCouponActive,
  type CouponInput,
} from "@/lib/coupons.functions";
import { toast } from "sonner";
import { Copy, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCouponsPage,
});

type Coupon = Awaited<ReturnType<typeof listCoupons>>[number];

function randomCode(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const empty: CouponInput = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  max_uses: null,
  active: false,
  expires_at: null,
  note: "",
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string) {
  if (!v) return null;
  return new Date(v).toISOString();
}

function AdminCouponsPage() {
  const listFn = useServerFn(listCoupons);
  const createFn = useServerFn(createCoupon);
  const updateFn = useServerFn(updateCoupon);
  const deleteFn = useServerFn(deleteCoupon);
  const activateFn = useServerFn(setCouponActive);

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponInput>(empty);
  const [expiresLocal, setExpiresLocal] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const r = await listFn();
      setCoupons(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load coupons");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty, code: randomCode() });
    setExpiresLocal("");
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type as "percent" | "fixed",
      discount_value: Number(c.discount_value),
      max_uses: c.max_uses,
      active: c.active,
      expires_at: c.expires_at,
      note: c.note ?? "",
    });
    setExpiresLocal(toLocalInput(c.expires_at));
    setOpen(true);
  }

  async function save() {
    const payload: CouponInput = {
      ...form,
      code: form.code.trim().toUpperCase(),
      expires_at: expiresLocal ? fromLocalInput(expiresLocal) : null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, values: payload } });
        toast.success("Coupon updated");
      } else {
        await createFn({ data: payload });
        toast.success(payload.active ? "Coupon created & activated" : "Coupon created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    setBusyId(c.id);
    try {
      await activateFn({ data: { id: c.id, active: !c.active } });
      toast.success(!c.active ? "Activated" : "Deactivated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c: Coupon) {
    setBusyId(c.id);
    try {
      await deleteFn({ data: { id: c.id } });
      toast.success("Coupon removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-muted-foreground">
            Generate discount codes, activate them, and share with customers.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> New coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit coupon" : "Generate coupon"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="uppercase tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ ...form, code: randomCode() })}
                    title="Generate random code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Discount type</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(v: "percent" | "fixed") =>
                      setForm({ ...form, discount_type: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent (%)</SelectItem>
                      <SelectItem value="fixed">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({ ...form, discount_value: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Max uses (optional)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.max_uses ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_uses: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="unlimited"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Expires at (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={expiresLocal}
                    onChange={(e) => setExpiresLocal(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Internal note</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Diwali launch campaign"
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
                <div>
                  <Label>Activate immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Only active coupons can be redeemed by customers.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving || !form.code.trim() || form.discount_value <= 0}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All coupons {coupons ? `(${coupons.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons === null && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {coupons?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No coupons yet. Click “New coupon” to generate one.
                    </TableCell>
                  </TableRow>
                )}
                {coupons?.map((c) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  const exhausted = c.max_uses != null && c.times_used >= c.max_uses;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-sm font-semibold tracking-wider">
                            {c.code}
                          </code>
                          <Button size="icon" variant="ghost" onClick={() => copyCode(c.code)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {c.note && (
                          <div className="mt-1 text-xs text-muted-foreground">{c.note}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.discount_type === "percent"
                          ? `${Number(c.discount_value)}%`
                          : `${Number(c.discount_value).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {c.times_used}
                        {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.expires_at ? new Date(c.expires_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={c.active}
                            disabled={busyId === c.id}
                            onCheckedChange={() => toggleActive(c)}
                          />
                          {expired ? (
                            <Badge variant="secondary">expired</Badge>
                          ) : exhausted ? (
                            <Badge variant="secondary">exhausted</Badge>
                          ) : c.active ? (
                            <Badge>active</Badge>
                          ) : (
                            <Badge variant="secondary">inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                disabled={busyId === c.id}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove this coupon?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  “{c.code}” will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(c)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
