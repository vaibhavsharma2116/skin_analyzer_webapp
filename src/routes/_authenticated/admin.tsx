import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { checkIsAdmin, claimFirstAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const isAdminFn = useServerFn(checkIsAdmin);
  const claimFn = useServerFn(claimFirstAdmin);
  const [state, setState] = useState<"loading" | "admin" | "denied">("loading");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const check = () => {
    setState("loading");
    isAdminFn()
      .then((r) => setState(r.isAdmin ? "admin" : "denied"))
      .catch(() => setState("denied"));
  };

  useEffect(check, [isAdminFn]);

  async function handleClaim() {
    setClaiming(true);
    setClaimError(null);
    try {
      const r = await claimFn();
      if (r.granted) {
        check();
      } else {
        setClaimError("An admin already exists. Ask them to grant you access.");
      }
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Failed to claim admin");
    } finally {
      setClaiming(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have admin permissions. If you&apos;re the first user setting up the
            admin panel, claim admin below.
          </p>
          {claimError && <p className="mt-3 text-sm text-destructive">{claimError}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? "Claiming…" : "Claim first admin"}
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back to app
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
            <div className="font-semibold truncate">SKIN POP Admin</div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} className="hidden sm:flex">
                View app
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:flex">
                Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
