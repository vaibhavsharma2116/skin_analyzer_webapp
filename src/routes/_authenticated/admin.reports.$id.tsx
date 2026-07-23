import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getScanDetail } from "@/lib/admin.functions";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports/$id")({
  component: AdminScanDetail,
});

type Detail = Awaited<ReturnType<typeof getScanDetail>>;

function AdminScanDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getScanDetail);
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    fn({ data: { id } })
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"));
  }, [fn, id]);

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { scan, profile } = data;
  const concerns = Array.isArray(scan.concerns) ? (scan.concerns as any[]) : [];
  const recommendations = Array.isArray(scan.recommendations)
    ? (scan.recommendations as any[])
    : [];
  const metrics = scan.metrics && typeof scan.metrics === "object" ? scan.metrics : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/reports">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Scan detail</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Overall score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scan.overall_score}</div>
            <div className="text-xs text-muted-foreground">Skin age: {scan.skin_age ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{profile?.full_name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {profile?.skin_type ?? "—"} · {profile?.primary_concern ?? "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Type: <Badge variant="secondary">{scan.scan_type}</Badge></div>
            <div className="text-muted-foreground">
              {new Date(scan.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Model: {scan.model ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {scan.summary || "No summary."}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            {concerns.length === 0 ? (
              <p className="text-sm text-muted-foreground">None detected.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {concerns.map((c, i) => (
                  <li key={i} className="rounded border p-2">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {typeof c === "string" ? c : JSON.stringify(c, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recommendations.map((r, i) => (
                  <li key={i} className="rounded border p-2">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {typeof r === "string" ? r : JSON.stringify(r, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
