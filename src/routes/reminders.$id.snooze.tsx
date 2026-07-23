import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, Loader2, Sun } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { getReminder, snoozeReminder, setReminderLog, type ReminderRow } from "@/lib/reminders.functions";

export const Route = createFileRoute("/reminders/$id/snooze")({
  component: SnoozePage,
});

const OPTIONS: { m: number; label: string }[] = [
  { m: 5, label: "5 minutes" },
  { m: 15, label: "15 minutes" },
  { m: 30, label: "30 minutes" },
  { m: 60, label: "1 hour" },
  { m: 120, label: "2 hours" },
];

function fmtTime(t: string) {
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12.toString().padStart(2, "0")}:${mm} ${suffix}`;
}

function SnoozePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchOne = useServerFn(getReminder);
  const snooze = useServerFn(snoozeReminder);
  const setLog = useServerFn(setReminderLog);
  const [row, setRow] = useState<ReminderRow | null>(null);
  const [selected, setSelected] = useState(15);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchOne({ data: { id } }).then((r) => setRow((r as ReminderRow) ?? null));
  }, [id, fetchOne]);

  async function onSnooze() {
    if (!row) return;
    setSaving(true);
    try {
      await snooze({ data: { id: row.id, scheduled_date: today, minutes: selected } });
      navigate({ to: "/reminders/$id", params: { id: row.id } });
    } finally {
      setSaving(false);
    }
  }

  async function onSkip() {
    if (!row) return;
    await setLog({ data: { id: row.id, scheduled_date: today, status: "missed" } });
    navigate({ to: "/reminders" });
  }

  const back = () => navigate({ to: "/reminders/$id", params: { id } });

  return (
    <DeviceFrame
      title="Snooze Reminder"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
    >
      {!row ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="rounded-2xl border border-border/70 bg-card p-3">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sun className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtTime(row.time_of_day)} · {row.repeat === "daily" ? "Daily" : row.repeat}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">We'll remind you again later.</p>
          </div>

          <p className="mt-5 text-sm font-semibold">Snooze for</p>
          <div className="mt-2 space-y-2">
            {OPTIONS.map((o) => {
              const active = selected === o.m;
              return (
                <button
                  key={o.m}
                  type="button"
                  onClick={() => setSelected(o.m)}
                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    active ? "border-primary bg-primary/5" : "border-border/70 bg-card"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {active && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button size="lg" className="mt-5 h-12 w-full rounded-2xl" onClick={onSnooze} disabled={saving}>
            {saving ? "Snoozing…" : "Snooze"}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 w-full py-2 text-sm font-semibold text-primary"
          >
            Skip This Reminder
          </button>
        </>
      )}
    </DeviceFrame>
  );
}
