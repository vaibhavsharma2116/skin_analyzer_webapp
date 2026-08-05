import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Moon,
  ScanFace,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  X,
  Home,
  UserRound,
} from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { MiniScoreArc } from "@/components/app/score-arc";
import { supabase } from "@/integrations/supabase/client";
import { deleteScan, listMyScans, type ScanRow } from "@/lib/skin-analysis.functions";

export const Route = createFileRoute("/history/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Scan History — SKIN POP" },
      { name: "description", content: "View all your past AI skin analysis scans and track your progress over time." },
    ],
  }),
  component: HistoryPage,
});

type TimeRange = "all" | "month" | "3m" | "6m";
type ScanTypeFilter = { morning: boolean; night: boolean };
type SortBy = "newest" | "oldest" | "highest" | "lowest";

type QuickChip = "all" | "month" | "3m";

const RANGE_DAYS: Record<TimeRange, number | null> = { all: null, month: 30, "3m": 90, "6m": 180 };

function scoreLabel(score: number) {
  if (score >= 80) return { label: "Good", cls: "text-sage" };
  if (score >= 60) return { label: "Balanced", cls: "text-primary" };
  if (score >= 40) return { label: "Fair", cls: "text-primary" };
  return { label: "Needs care", cls: "text-coral" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function HistoryPage() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listMyScans);
  const removeScan = useServerFn(deleteScan);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Filters
  const [quickChip, setQuickChip] = useState<QuickChip>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [scanTypeFilter, setScanTypeFilter] = useState<ScanTypeFilter>({ morning: true, night: true });
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  // Sheets
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const reload = () => {
    setStatus("loading");
    fetchList()
      .then((r) => {
        setRows((r as ScanRow[]) ?? []);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load history");
        setStatus("error");
      });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quickChip === "all") setTimeRange("all");
    if (quickChip === "month") setTimeRange("month");
    if (quickChip === "3m") setTimeRange("3m");
  }, [quickChip]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this scan? This cannot be undone.")) return;
    setPendingId(id);
    try {
      await removeScan({ data: { id } });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setPendingId(null);
    }
  }

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[timeRange];
    const cutoff = days ? Date.now() - days * 86400 * 1000 : null;
    let list = rows.filter((r) => {
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (r.scan_type === "morning" && !scanTypeFilter.morning) return false;
      if (r.scan_type === "night" && !scanTypeFilter.night) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return b.created_at.localeCompare(a.created_at);
      if (sortBy === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sortBy === "highest") return b.overall_score - a.overall_score;
      return a.overall_score - b.overall_score;
    });
    return list;
  }, [rows, timeRange, scanTypeFilter, sortBy]);

  const avg = useMemo(() => {
    if (!filtered.length) return null;
    return Math.round(filtered.reduce((s, r) => s + r.overall_score, 0) / filtered.length);
  }, [filtered]);

  const openDetail = (id: string) => navigate({ to: "/history/$id", params: { id } });

  return (
    <DeviceFrame
      title="Scan History"
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
      rightSlot={
        <button className="icon-button" aria-label="Calendar" onClick={() => setCalendarOpen(true)}>
          <CalendarDays className="h-4 w-4" />
        </button>
      }
      footer={
        <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground">
          {[
            { label: "Home", icon: Home, onClick: () => navigate({ to: "/dashboard" }) },
            { label: "History", icon: ClipboardList, active: true, onClick: () => {} },
            { label: "Scan", icon: ScanFace, onClick: () => navigate({ to: "/scan" }) },
            { label: "Tips", icon: Sparkles, onClick: () => navigate({ to: "/tips" }) },
            { label: "Profile", icon: UserRound, onClick: () => navigate({ to: "/settings" }) },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={item.active ? "font-semibold text-primary" : undefined}>{item.label}</span>
            </button>
          ))}
        </div>
      }
    >
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading your scans…</p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">{error}</div>
          <Button className="w-full" onClick={reload}>Try again</Button>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">Track Your Skin Journey</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Consistent scans help you understand your skin better and see real progress.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
              {(
                [
                  { k: "all", label: "All Scans" },
                  { k: "month", label: "This Month" },
                  { k: "3m", label: "Last 3 Months" },
                ] as { k: QuickChip; label: string }[]
              ).map((c) => (
                <button
                  key={c.k}
                  type="button"
                  onClick={() => setQuickChip(c.k)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                    quickChip === c.k
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/70 bg-card text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Filters"
              onClick={() => setFiltersOpen(true)}
              className="icon-button"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="space-y-5">
              <div className="rounded-[28px] bg-gradient-card px-5 py-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <ScanFace className="h-7 w-7" />
                </div>
                <p className="mt-3 text-base font-semibold">No scans match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting filters or start a new AI skin analysis.
                </p>
              </div>
              <Button size="lg" className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/scan" })}>
                <Camera className="mr-2 h-4 w-4" /> Start a scan
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total scans</p>
                  <p className="mt-1 text-2xl font-semibold">{filtered.length}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Average score</p>
                  <p className={`mt-1 text-2xl font-semibold ${avg !== null ? scoreLabel(avg).cls : ""}`}>{avg ?? "—"}</p>
                </div>
              </div>

              <p className="text-sm font-semibold">Recent Scans</p>
              <div className="space-y-3">
                {filtered.map((r) => {
                  const tone = scoreLabel(r.overall_score);
                  return (
                    <div
                      key={r.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
                    >
                      <button type="button" onClick={() => openDetail(r.id)} aria-label="Open scan">
                        <MiniScoreArc score={r.overall_score} size={56} />
                        <p className={`mt-0.5 text-center text-[10px] font-semibold ${tone.cls}`}>{tone.label}</p>
                      </button>
                      <button type="button" onClick={() => openDetail(r.id)} className="min-w-0 text-left">
                        <p className="truncate text-sm font-medium">
                          {fmtDate(r.created_at)} · {fmtTime(r.created_at)}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {r.scan_type === "night" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                          {r.scan_type === "night" ? "Night Scan" : "Morning Scan"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.concerns?.length ? r.concerns.map((c) => c.name).slice(0, 3).join(", ") : "No concerns detected"}
                        </p>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Delete scan"
                          disabled={pendingId === r.id}
                          onClick={() => handleDelete(r.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          {pendingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                        <button type="button" aria-label="Open" onClick={() => openDetail(r.id)} className="text-muted-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length >= 2 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-2xl"
                  onClick={() =>
                    navigate({
                      to: "/history/compare",
                      search: { a: filtered[0].id, b: filtered[1].id },
                    })
                  }
                >
                  Compare last two scans
                </Button>
              )}

              <Button size="lg" className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/scan" })}>
                <Camera className="mr-2 h-4 w-4" /> New Skin Scan
              </Button>
            </>
          )}
        </div>
      )}

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        timeRange={timeRange}
        setTimeRange={(v) => {
          setTimeRange(v);
          if (v === "all") setQuickChip("all");
          else if (v === "month") setQuickChip("month");
          else if (v === "3m") setQuickChip("3m");
        }}
        scanTypeFilter={scanTypeFilter}
        setScanTypeFilter={setScanTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={() => {
          setTimeRange("all");
          setScanTypeFilter({ morning: true, night: true });
          setSortBy("newest");
          setQuickChip("all");
        }}
      />
      <CalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        rows={rows}
        onSelectScan={(id) => {
          setCalendarOpen(false);
          openDetail(id);
        }}
      />
    </DeviceFrame>
  );
}

// ---------- Filters bottom sheet ----------
function FiltersSheet({
  open,
  onClose,
  timeRange,
  setTimeRange,
  scanTypeFilter,
  setScanTypeFilter,
  sortBy,
  setSortBy,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  timeRange: TimeRange;
  setTimeRange: (t: TimeRange) => void;
  scanTypeFilter: ScanTypeFilter;
  setScanTypeFilter: (f: ScanTypeFilter) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  onReset: () => void;
}) {
  if (!open) return null;
  const timeOptions: { k: TimeRange; label: string }[] = [
    { k: "all", label: "All Time" },
    { k: "month", label: "This Month" },
    { k: "3m", label: "Last 3 Months" },
    { k: "6m", label: "Last 6 Months" },
  ];
  const sortOptions: { k: SortBy; label: string }[] = [
    { k: "newest", label: "Newest First" },
    { k: "oldest", label: "Oldest First" },
    { k: "highest", label: "Highest Score" },
    { k: "lowest", label: "Lowest Score" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-3xl bg-card p-5 shadow-phone" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onClose} className="icon-button" aria-label="Close"><ArrowLeft className="h-4 w-4" /></button>
          <p className="text-base font-semibold">Filters</p>
          <button onClick={onReset} className="text-sm font-semibold text-primary">Reset</button>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Range</p>
        <div className="mt-2 space-y-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.k}
              type="button"
              onClick={() => setTimeRange(opt.k)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                timeRange === opt.k ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  timeRange === opt.k ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {timeRange === opt.k && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scan Type</p>
        <div className="mt-2 space-y-2">
          {(["morning", "night"] as const).map((k) => {
            const on = scanTypeFilter[k];
            const Icon = k === "morning" ? Sun : Moon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setScanTypeFilter({ ...scanTypeFilter, [k]: !on })}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                  on ? "border-primary bg-primary/5" : "border-border/70 bg-card"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" /> {k === "morning" ? "Morning Scan" : "Night Scan"}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded ${
                    on ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}
                >
                  {on && <span className="text-[10px]">✓</span>}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort By</p>
        <div className="mt-2 space-y-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.k}
              type="button"
              onClick={() => setSortBy(opt.k)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                sortBy === opt.k ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  sortBy === opt.k ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {sortBy === opt.k && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          ))}
        </div>

        <Button size="lg" className="mt-5 h-12 w-full rounded-2xl" onClick={onClose}>Apply Filters</Button>
      </div>
    </div>
  );
}

// ---------- Calendar bottom sheet ----------
function CalendarSheet({
  open,
  onClose,
  rows,
  onSelectScan,
}: {
  open: boolean;
  onClose: () => void;
  rows: ScanRow[];
  onSelectScan: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const dayMap = useMemo(() => {
    const map = new Map<string, ScanRow[]>();
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [rows]);

  if (!open) return null;

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, key: `pad-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d-${d}` });

  function dayKey(day: number) {
    return `${y}-${m}-${day}`;
  }
  function avgFor(day: number) {
    const list = dayMap.get(dayKey(day)) ?? [];
    if (!list.length) return null;
    return Math.round(list.reduce((s, r) => s + r.overall_score, 0) / list.length);
  }

  const selectedList = selectedDay ? dayMap.get(selectedDay) ?? [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-3xl bg-card p-5 shadow-phone" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-4 w-4" /></button>
          <p className="text-base font-semibold">Scan Calendar</p>
          <span className="w-9" />
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            className="icon-button"
            onClick={() => setCursor(new Date(y, m - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-base font-semibold">{monthLabel}</p>
          <button className="icon-button" onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c) => {
            if (c.day === null) return <div key={c.key} className="aspect-square" />;
            const avg = avgFor(c.day);
            const key = dayKey(c.day);
            const isSelected = selectedDay === key;
            let bg = "";
            let text = "text-foreground";
            if (avg !== null) {
              if (avg >= 80) bg = "bg-sage/25 text-sage";
              else if (avg >= 60) bg = "bg-primary/20 text-primary";
              else bg = "bg-coral/20 text-coral";
              text = "";
            }
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`aspect-square rounded-full text-xs font-semibold ${bg} ${text} ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                {c.day}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sage" /> Good (80-100)</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Fair (60-79)</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-coral" /> Poor (0-59)</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border" /> No Scan</span>
        </div>

        {selectedDay && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Scans on {new Date(y, m, Number(selectedDay.split("-")[2])).toLocaleDateString(undefined, {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            {selectedList.length === 0 ? (
              <p className="mt-2 rounded-2xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                No scans on this day.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {selectedList.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectScan(r.id)}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-2 text-left"
                  >
                    {r.scan_type === "night" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fmtTime(r.created_at)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.scan_type === "night" ? "Night Scan" : "Morning Scan"}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${scoreLabel(r.overall_score).cls}`}>
                      {r.overall_score}<span className="text-muted-foreground">/100</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
