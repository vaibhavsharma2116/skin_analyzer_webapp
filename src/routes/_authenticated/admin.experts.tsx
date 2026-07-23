import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  listExperts, createExpert, updateExpert, deleteExpert,
  type ExpertInput,
} from "@/lib/experts.functions";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/experts")({
  component: AdminExpertsPage,
});

type Expert = Awaited<ReturnType<typeof listExperts>>[number];

const empty: ExpertInput = {
  slug: "",
  name: "",
  title: "",
  years: "",
  rating: 5,
  answers_count: 0,
  followers: "",
  positive: "",
  bio: "",
  initials: "",
  tone: "bg-primary/15 text-primary",
  active: true,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function initialsOf(s: string) {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function AdminExpertsPage() {
  const listFn = useServerFn(listExperts);
  const createFn = useServerFn(createExpert);
  const updateFn = useServerFn(updateExpert);
  const deleteFn = useServerFn(deleteExpert);

  const [experts, setExperts] = useState<Expert[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expert | null>(null);
  const [form, setForm] = useState<ExpertInput>(empty);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const r = await listFn();
      setExperts(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load experts");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(x: Expert) {
    setEditing(x);
    setForm({
      slug: x.slug,
      name: x.name,
      title: x.title ?? "",
      years: x.years ?? "",
      rating: Number(x.rating),
      answers_count: x.answers_count,
      followers: x.followers ?? "",
      positive: x.positive ?? "",
      bio: x.bio ?? "",
      initials: x.initials ?? "",
      tone: x.tone ?? "bg-primary/15 text-primary",
      active: x.active,
    });
    setOpen(true);
  }

  async function save() {
    const payload: ExpertInput = {
      ...form,
      slug: form.slug || slugify(form.name),
      initials: form.initials || initialsOf(form.name),
    };
    setSaving(true);
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, values: payload } });
        toast.success("Expert updated");
      } else {
        await createFn({ data: payload });
        toast.success("Expert added");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: Expert) {
    setBusyId(x.id);
    try {
      await deleteFn({ data: { id: x.id } });
      toast.success("Expert removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Experts</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, and remove skincare experts shown in the app.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Add expert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit expert" : "Add expert"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Ananya Sharma" />
                </div>
                <div className="grid gap-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Dermatologist" />
                </div>
                <div className="grid gap-2">
                  <Label>Experience</Label>
                  <Input value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} placeholder="8+ Years Experience" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Rating</Label>
                  <Input type="number" min={0} max={5} step="0.1" value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Answers</Label>
                  <Input type="number" min={0} value={form.answers_count}
                    onChange={(e) => setForm({ ...form, answers_count: Number(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Followers</Label>
                  <Input value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} placeholder="12k+" />
                </div>
                <div className="grid gap-2">
                  <Label>Positive</Label>
                  <Input value={form.positive} onChange={(e) => setForm({ ...form, positive: e.target.value })} placeholder="98%" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Initials</Label>
                  <Input value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} placeholder="auto from name" />
                </div>
                <div className="grid gap-2">
                  <Label>Tone (Tailwind classes)</Label>
                  <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="bg-primary/15 text-primary" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Bio</Label>
                <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Active (visible in app)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Experts {experts ? `(${experts.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Answers</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experts === null && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {experts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No experts yet. Click “Add expert” to get started.
                    </TableCell>
                  </TableRow>
                )}
                {experts?.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${x.tone || "bg-primary/15 text-primary"}`}>
                          {x.initials || initialsOf(x.name)}
                        </div>
                        <div>
                          <div className="font-medium">{x.name}</div>
                          <div className="text-xs text-muted-foreground">{x.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{x.title || "—"}</TableCell>
                    <TableCell>{Number(x.rating).toFixed(1)}</TableCell>
                    <TableCell>{x.answers_count}</TableCell>
                    <TableCell className="text-muted-foreground">{x.followers || "—"}</TableCell>
                    <TableCell>
                      {x.active ? <Badge>active</Badge> : <Badge variant="secondary">hidden</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(x)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={busyId === x.id}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this expert?</AlertDialogTitle>
                              <AlertDialogDescription>
                                “{x.name}” will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(x)}>Remove</AlertDialogAction>
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
    </div>
  );
}
