import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listUsers, setUserAdmin, deleteUser } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

type User = Awaited<ReturnType<typeof listUsers>>[number];

function AdminUsersPage() {
  const listFn = useServerFn(listUsers);
  const setAdminFn = useServerFn(setUserAdmin);
  const deleteFn = useServerFn(deleteUser);

  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(q = "") {
    setLoading(true);
    try {
      const r = await listFn({ data: { search: q || undefined } });
      setUsers(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleAdmin(u: User) {
    const isAdmin = u.roles.includes("admin");
    setBusyId(u.id);
    try {
      await setAdminFn({ data: { userId: u.id, admin: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      await load(search);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: User) {
    setBusyId(u.id);
    try {
      await deleteFn({ data: { userId: u.id } });
      toast.success("User deleted");
      await load(search);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All users {users ? `(${users.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              load(search);
            }}
          >
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Skin</TableHead>
                  <TableHead>Concern</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users === null && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {users?.map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email ?? "—"}
                      </TableCell>
                      <TableCell>{u.skin_type ?? "—"}</TableCell>
                      <TableCell>{u.primary_concern ?? "—"}</TableCell>
                      <TableCell>{u.scan_count}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge>admin</Badge>
                        ) : (
                          <Badge variant="secondary">user</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() => toggleAdmin(u)}
                          >
                            {isAdmin ? (
                              <>
                                <ShieldOff className="mr-1 h-3.5 w-3.5" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                Make admin
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === u.id}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently deletes {u.full_name ?? u.email ?? "the user"}{" "}
                                  and all their data (scans, reminders). This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(u)}>
                                  Delete
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
