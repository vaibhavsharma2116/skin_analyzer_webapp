import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, BookOpenText, CalendarDays, ChevronRight, History, Home, Loader2, Moon, Plus, ScanFace, Sun, UserRound } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { listReminders, toggleReminderActive, type ReminderCategory, type ReminderRow } from "@/lib/reminders.functions";

export const Route = createFileRoute("/reminders/")({
  component: RemindersDashboard,
});

const FILTERS: { key: "all" | ReminderCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "routine", label: "Routine" },
  { key: "product", label: "Products" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "appointment", label: "Appointments" },
];

function fmtTime(t: string) {
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12.toString().padStart(2, "0")}:${mm} ${suffix}`;
}

function iconFor(category: ReminderCategory, name: string) {
  const n = name.toLowerCase();
  if (n.includes("night")) return Moon;
  if (n.includes("morning") || n.includes("sun")) return Sun;
  if (category === "appointment") return CalendarDays;
  return Sun;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(r: ReminderRow) {
  if (r.repeat === "daily") return true;
  const today = new Date();
  const dow = today.getDay();
  if (r.repeat === "weekdays") return dow >= 1 && dow <= 5;
  if (r.repeat === "weekends") return dow === 0 || dow === 6;
  if (r.repeat === "weekly" || r.repeat === "custom") return r.repeat_days.includes(dow);
  if (r.repeat === "once") return r.start_date === todayISO();
  return false;
}

function RemindersDashboard() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listReminders);
  const toggleActive = useServerFn(toggleReminderActive);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [rows, setRows] = useState<ReminderRow[] | null>(null);

  useEffect(() => {
    fetchList()
      .then((r) => setRows(r as ReminderRow[]))
      .catch(() => setRows([]));
  }, [fetchList]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return filter === "all" ? rows : rows.filter((r) => r.category === filter);
  }, [rows, filter]);

  const today = filtered.filter((r) => r.active && isToday(r));
  const upcoming = filtered.filter((r) => r.active && !isToday(r));
  const inactive = filtered.filter((r) => !r.active);

  async function onToggle(r: ReminderRow, next: boolean) {
    setRows((prev) => (prev ? prev.map((x) => (x.id === r.id ? { ...x, active: next } : x)) : prev));
    try {
      await toggleActive({ data: { id: r.id, active: next } });
    } catch {
      setRows((prev) => (prev ? prev.map((x) => (x.id === r.id ? { ...x, active: !next } : x)) : prev));
    }
  }

  return (
    <DeviceFrame
      title="Reminders"
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
      rightSlot={
        <button className="icon-button" aria-label="Add" onClick={() => navigate({ to: "/reminders/new" })}>
          <Plus className="h-4 w-4" />
        </button>
      }
      footer={
        <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground">
          {[
            { label: "Home", icon: Home, onClick: () => navigate({ to: "/dashboard" }) },
            { label: "History", icon: History, onClick: () => navigate({ to: "/history" }) },
            { label: "Scan", icon: ScanFace, onClick: () => navigate({ to: "/scan" }) },
            { label: "Reminders", icon: Bell, active: true, onClick: () => {} },
            { label: "Profile", icon: UserRound, onClick: () => {} },
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
      <div className="rounded-[24px] bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Stay consistent, see real results ✨</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set reminders for your routine, product usage & skin goals.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <Section title="Today" items={today} onToggle={onToggle} onOpen={(id) => navigate({ to: "/reminders/$id", params: { id } })} />
          <Section title="Upcoming" items={upcoming} onToggle={onToggle} onOpen={(id) => navigate({ to: "/reminders/$id", params: { id } })} />
          {inactive.length > 0 && (
            <Section title="Paused" items={inactive} onToggle={onToggle} onOpen={(id) => navigate({ to: "/reminders/$id", params: { id } })} muted />
          )}

          {rows.length === 0 && (
            <div className="mt-6 rounded-[24px] border border-dashed border-border/70 bg-card p-6 text-center">
              <p className="text-sm font-medium">No reminders yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add your first reminder to build a consistent routine.</p>
              <Button className="mt-4 h-10 rounded-2xl" onClick={() => navigate({ to: "/reminders/new" })}>
                <Plus className="mr-1 h-4 w-4" /> Add reminder
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={() => navigate({ to: "/reminders/calendar" })}
          className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Reminder Calendar</p>
            <p className="truncate text-xs text-muted-foreground">See completed, upcoming & missed by day</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </DeviceFrame>
  );
}

function Section({
  title,
  items,
  onToggle,
  onOpen,
  muted,
}: {
  title: string;
  items: ReminderRow[];
  onToggle: (r: ReminderRow, next: boolean) => void;
  onOpen: (id: string) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <p className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""}`}>{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((r) => {
          const Icon = iconFor(r.category, r.name);
          return (
            <div
              key={r.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onOpen(r.id)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                <Icon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => onOpen(r.id)} className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.repeat === "daily" ? "Daily" : r.repeat === "once" ? "Once" : r.repeat === "weekdays" ? "Weekdays" : r.repeat === "weekends" ? "Weekends" : "Custom"}
                  {" · "}{fmtTime(r.time_of_day)}
                </p>
              </button>
              <Switch checked={r.active} onCheckedChange={(v) => onToggle(r, v)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
