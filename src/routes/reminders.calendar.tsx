import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { listReminderLogs, listReminders, type ReminderLogRow, type ReminderRow } from "@/lib/reminders.functions";

export const Route = createFileRoute("/reminders/calendar")({
  component: CalendarPage,
});

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDate(y: number, m: number, d: number) {
  const mm = (m + 1).toString().padStart(2, "0");
  const dd = d.toString().padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function fmtTime(t: string) {
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12.toString().padStart(2, "0")}:${mm} ${suffix}`;
}

function isDueOn(r: ReminderRow, date: Date) {
  const iso = date.toISOString().slice(0, 10);
  if (r.start_date > iso) return false;
  if (r.end_date && r.end_date < iso) return false;
  const dow = date.getDay();
  switch (r.repeat) {
    case "daily": return true;
    case "once": return r.start_date === iso;
    case "weekdays": return dow >= 1 && dow <= 5;
    case "weekends": return dow === 0 || dow === 6;
    case "weekly":
    case "custom":
      return r.repeat_days.includes(dow);
    default: return false;
  }
}

function CalendarPage() {
  const navigate = useNavigate();
  const fetchLogs = useServerFn(listReminderLogs);
  const fetchReminders = useServerFn(listReminders);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedISO, setSelectedISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [logs, setLogs] = useState<ReminderLogRow[] | null>(null);
  const [rems, setRems] = useState<ReminderRow[] | null>(null);

  const first = new Date(cursor.y, cursor.m, 1);
  const last = new Date(cursor.y, cursor.m + 1, 0);
  const from = isoDate(cursor.y, cursor.m, 1);
  const to = isoDate(cursor.y, cursor.m, last.getDate());

  useEffect(() => {
    setLogs(null);
    Promise.all([fetchLogs({ data: { from, to } }), fetchReminders()])
      .then(([l, r]) => {
        setLogs(l as ReminderLogRow[]);
        setRems(r as ReminderRow[]);
      })
      .catch(() => {
        setLogs([]);
        setRems([]);
      });
  }, [from, to, fetchLogs, fetchReminders]);

  const statusByDate = useMemo(() => {
    const map = new Map<string, Set<ReminderLogRow["status"]>>();
    for (const l of logs ?? []) {
      const set = map.get(l.scheduled_date) ?? new Set();
      set.add(l.status);
      map.set(l.scheduled_date, set);
    }
    return map;
  }, [logs]);

  const startPad = first.getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function prev() {
    setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  }
  function next() {
    setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));
  }

  const selectedDate = new Date(selectedISO + "T00:00:00");
  const dueThatDay = (rems ?? []).filter((r) => r.active && isDueOn(r, selectedDate));
  const logsThatDay = (logs ?? []).filter((l) => l.scheduled_date === selectedISO);

  function statusFor(reminderId: string): ReminderLogRow["status"] {
    const l = logsThatDay.find((x) => x.reminder_id === reminderId);
    if (l) return l.status;
    // no log — infer
    const today = new Date().toISOString().slice(0, 10);
    if (selectedISO < today) return "missed";
    return "upcoming";
  }

  return (
    <DeviceFrame
      title="Reminder Calendar"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/reminders" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="flex items-center justify-between">
        <button className="icon-button" onClick={prev}><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <button className="icon-button" onClick={next}><ChevronRight className="h-4 w-4" /></button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
        {DOW.map((d) => <div key={d}>{d}</div>)}
      </div>

      {logs === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (d === null) return <div key={i} className="aspect-square" />;
            const iso = isoDate(cursor.y, cursor.m, d);
            const set = statusByDate.get(iso);
            const isSelected = iso === selectedISO;
            const today = new Date().toISOString().slice(0, 10);
            const isToday = iso === today;

            let ring = "";
            if (set?.has("completed")) ring = "bg-sage/20 text-sage";
            else if (set?.has("missed")) ring = "bg-coral/15 text-coral";
            else if (set?.has("snoozed")) ring = "bg-primary/15 text-primary";

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedISO(iso)}
                className={`relative aspect-square rounded-full text-xs font-medium transition ${
                  isSelected ? "bg-primary text-primary-foreground" : ring || "text-foreground"
                } ${isToday && !isSelected ? "ring-1 ring-primary" : ""}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-around text-[11px] text-muted-foreground">
        <Legend color="bg-sage" label="Completed" />
        <Legend color="bg-primary" label="Upcoming" />
        <Legend color="bg-coral" label="Missed" />
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card">
        <div className="border-b border-border/70 px-4 py-3">
          <p className="text-sm font-semibold">
            {selectedDate.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="divide-y divide-border/70">
          {dueThatDay.length === 0 && (
            <p className="px-4 py-4 text-xs text-muted-foreground">No reminders on this day.</p>
          )}
          {dueThatDay.map((r) => {
            const st = statusFor(r.id);
            const tone =
              st === "completed" ? "text-sage"
              : st === "missed" ? "text-coral"
              : st === "snoozed" ? "text-primary"
              : "text-muted-foreground";
            return (
              <div key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <p className="text-xs font-medium tabular-nums text-muted-foreground">{fmtTime(r.time_of_day)}</p>
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className={`text-xs font-semibold capitalize ${tone}`}>{st}</p>
              </div>
            );
          })}
        </div>
      </div>
    </DeviceFrame>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
