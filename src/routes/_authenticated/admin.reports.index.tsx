import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAllScans } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports/")({
  component: AdminReportsPage,
});

type Scan = Awaited<ReturnType<typeof listAllScans>>[number];

function scoreColor(s: number) {
  if (s >= 80) return "bg-emerald-100 text-emerald-800";
  if (s >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-rose-100 text-rose-800";
}

function AdminReportsPage() {
  const listFn = useServerFn(listAllScans);
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [scanType, setScanType] = useState<string>("all");

  async function load() {
    setLoading(true);
    try {
      const r = await listFn({
        data: {
          minScore: minScore ? Number(minScore) : undefined,
          maxScore: maxScore ? Number(maxScore) : undefined,
          scanType: scanType === "all" ? undefined : scanType,
        },
      });
      setScans(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load scans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Reports</h1>
        <p className="text-sm text-muted-foreground">
          All AI skin scans across your users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Scans {scans ? `(${scans.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Min score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-24"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Max score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-24"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Type</label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </form>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Skin age</TableHead>
                  <TableHead>Skin type</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans === null && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {scans?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No scans match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {scans?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.user_name ?? s.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${scoreColor(s.overall_score)}`}
                      >
                        {s.overall_score}
                      </span>
                    </TableCell>
                    <TableCell>{s.skin_age ?? "—"}</TableCell>
                    <TableCell>{s.skin_type ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.scan_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {s.summary ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to="/admin/reports/$id"
                          params={{ id: s.id }}
                        >
                          View
                        </Link>
                      </Button>
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
