import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Bell, CalendarDays, Clock, Package, Sparkles, Sun } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createReminder, type ReminderCategory, type ReminderRepeat } from "@/lib/reminders.functions";

export const Route = createFileRoute("/reminders/new")({
  component: NewReminderPage,
});

const CATEGORIES: { key: ReminderCategory; label: string; icon: typeof Sun }[] = [
  { key: "routine", label: "Routine", icon: Sun },
  { key: "product", label: "Product", icon: Package },
  { key: "lifestyle", label: "Lifestyle", icon: Sparkles },
  { key: "appointment", label: "Appointment", icon: CalendarDays },
];

const REPEATS: { key: ReminderRepeat; label: string }[] = [
  { key: "once", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekdays", label: "Weekdays" },
  { key: "weekends", label: "Weekends" },
  { key: "weekly", label: "Weekly" },
];

const NOTIFY: { m: number; label: string }[] = [
  { m: 0, label: "At time" },
  { m: 5, label: "5 min before" },
  { m: 15, label: "15 min before" },
  { m: 30, label: "30 min before" },
  { m: 60, label: "1 hour before" },
];

function NewReminderPage() {
  const navigate = useNavigate();
  const create = useServerFn(createReminder);
  const [category, setCategory] = useState<ReminderCategory>("routine");
  const [name, setName] = useState("Morning Routine");
  const [repeat, setRepeat] = useState<ReminderRepeat>("daily");
  const [time, setTime] = useState("08:00");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>("");
  const [notify, setNotify] = useState(15);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setErr(null);
    try {
      await create({
        data: {
          category,
          name: name.trim(),
          repeat,
          repeat_days: [],
          time_of_day: time,
          start_date: startDate,
          end_date: endDate || null,
          notify_minutes_before: notify,
          note: note.trim() || null,
          steps: [],
        },
      });
      navigate({ to: "/reminders" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DeviceFrame
      title="Add Reminder"
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/reminders" })}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-medium transition ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                <Icon className="h-4 w-4" />
              </div>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Reminder Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Routine" />
        </Field>

        <Field label="Repeat">
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
          >
            {REPEATS.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Time" icon={Clock}>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" icon={CalendarDays}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
            />
          </Field>
          <Field label="End Date (optional)" icon={CalendarDays}>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
            />
          </Field>
        </div>

        <Field label="Notification" icon={Bell}>
          <select
            value={notify}
            onChange={(e) => setNotify(parseInt(e.target.value, 10))}
            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
          >
            {NOTIFY.map((n) => (
              <option key={n.m} value={n.m}>{n.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Note (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Cleanse, Tone, Serum, Moisturize & Sunscreen" />
        </Field>

        {err && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">{err}</p>}

        <Button
          size="lg"
          className="h-12 w-full rounded-2xl"
          disabled={saving || name.trim().length === 0}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save Reminder"}
        </Button>
      </div>
    </DeviceFrame>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Sun; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      {children}
    </div>
  );
}
