import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Clock, Loader2, Moon, Pause, Play, Repeat, Sun, Trash2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { deleteReminder, getReminder, toggleReminderActive, type ReminderRow } from "@/lib/reminders.functions";

export const Route = createFileRoute("/reminders/$id")({
  component: ReminderDetailPage,
});

function fmtTime(t: string) {
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12.toString().padStart(2, "0")}:${mm} ${suffix}`;
}

function repeatLabel(r: ReminderRow) {
  switch (r.repeat) {
    case "daily": return "Daily";
    case "once": return "Once";
    case "weekdays": return "Weekdays";
    case "weekends": return "Weekends";
    case "weekly": return "Weekly";
    default: return "Custom";
  }
}

function ReminderDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchOne = useServerFn(getReminder);
  const removeOne = useServerFn(deleteReminder);
  const toggleActive = useServerFn(toggleReminderActive);
  const [row, setRow] = useState<ReminderRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    fetchOne({ data: { id } })
      .then((r) => {
        if (!r) {
          setErr("Reminder not found");
          setStatus("error");
          return;
        }
        setRow(r as ReminderRow);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : "Failed to load");
        setStatus("error");
      });
  }, [id, fetchOne]);

  async function onDelete() {
    if (!row) return;
    if (!confirm("Delete this reminder?")) return;
    await removeOne({ data: { id: row.id } });
    navigate({ to: "/reminders" });
  }

  async function onTogglePause() {
    if (!row) return;
    const next = !row.active;
    setRow({ ...row, active: next });
    await toggleActive({ data: { id: row.id, active: next } });
  }

  const back = () => navigate({ to: "/reminders" });

  if (status === "loading") {
    return (
      <DeviceFrame title="Reminder Details" leftSlot={<button className="icon-button" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DeviceFrame>
    );
  }
  if (!row) {
    return (
      <DeviceFrame title="Reminder Details" leftSlot={<button className="icon-button" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}>
        <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">{err ?? "Not found"}</div>
      </DeviceFrame>
    );
  }

  const HeroIcon = row.name.toLowerCase().includes("night") ? Moon : Sun;

  return (
    <DeviceFrame
      title="Reminder Details"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary">
          <HeroIcon className="h-10 w-10" />
        </div>
        <p className="mt-3 text-xl font-semibold">{row.name}</p>
        <span className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${row.active ? "bg-sage/15 text-sage" : "bg-muted text-muted-foreground"}`}>
          {row.active ? "Active" : "Paused"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info icon={Clock} label="Time" value={fmtTime(row.time_of_day)} />
        <Info icon={Repeat} label="Repeat" value={repeatLabel(row)} />
        <Info icon={Clock} label="Start" value={new Date(row.start_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} />
        <Info icon={Bell} label="Notification" value={row.notify_minutes_before === 0 ? "At time" : `${row.notify_minutes_before} min before`} />
      </div>

      {row.steps.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Routine Steps</p>
          <div className="mt-2 space-y-2">
            {row.steps.map((s, i) => (
              <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm">{s}</p>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/15 text-sage">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {row.note && (
        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Note</p>
          <p className="mt-1 text-sm">{row.note}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-2xl"
          onClick={() => navigate({ to: "/reminders/$id/snooze", params: { id: row.id } })}
        >
          <Bell className="mr-1 h-4 w-4" /> Snooze
        </Button>
        <Button variant="outline" size="lg" className="h-12 rounded-2xl" onClick={onTogglePause}>
          {row.active ? <><Pause className="mr-1 h-4 w-4" /> Pause</> : <><Play className="mr-1 h-4 w-4" /> Resume</>}
        </Button>
      </div>
      <Button
        variant="outline"
        size="lg"
        className="mt-3 h-12 w-full rounded-2xl border-coral/40 text-coral hover:bg-coral/5"
        onClick={onDelete}
      >
        <Trash2 className="mr-1 h-4 w-4" /> Delete
      </Button>
    </DeviceFrame>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
