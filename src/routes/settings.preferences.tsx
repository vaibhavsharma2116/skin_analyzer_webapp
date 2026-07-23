import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Monitor, Moon, Sun } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";

export const Route = createFileRoute("/settings/preferences")({
  component: PreferencesPage,
});

const STORAGE_KEY = "skinpop.settings.preferences";

type Prefs = {
  units: "metric" | "imperial";
  language: string;
  theme: "light" | "dark" | "system";
  useSystem: boolean;
  audience: "everyone" | "adults" | "teens";
};

const DEFAULTS: Prefs = {
  units: "metric",
  language: "English",
  theme: "light",
  useSystem: true,
  audience: "everyone",
};

function PreferencesPage() {
  const navigate = useNavigate();
  const [p, setP] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setP({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function update<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    setP((prev) => {
      const next = { ...prev, [k]: v };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <DeviceFrame
      title="Preferences"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <Group title="Units">
        <SelectRow
          label="Metric (cm, kg)"
          selected={p.units === "metric"}
          onClick={() => update("units", "metric")}
        />
        <SelectRow
          label="Imperial (in, lb)"
          selected={p.units === "imperial"}
          onClick={() => update("units", "imperial")}
        />
      </Group>

      <Group title="Language">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 last:border-b-0">
          <span className="text-sm font-medium text-foreground">App Language</span>
          <select
            value={p.language}
            onChange={(e) => update("language", e.target.value)}
            className="h-9 rounded-xl border border-border/70 bg-card px-3 text-sm"
          >
            {["English", "हिन्दी", "Español", "Français"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </Group>

      <Group title="Appearance">
        <div className="grid grid-cols-3 gap-2 p-3">
          {([
            { k: "light", label: "Light", icon: Sun },
            { k: "dark", label: "Dark", icon: Moon },
            { k: "system", label: "System", icon: Monitor },
          ] as const).map((t) => {
            const active = p.theme === t.k;
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => update("theme", t.k)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-4 text-xs font-medium ${active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Use System Default</p>
            <p className="text-xs text-muted-foreground">Automatically switch based on your device settings</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={p.useSystem}
            onClick={() => update("useSystem", !p.useSystem)}
            className={`relative h-6 w-11 rounded-full transition ${p.useSystem ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${p.useSystem ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Group>

      <Group title="Content Preferences">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 last:border-b-0">
          <span className="text-sm font-medium text-foreground">Content for</span>
          <select
            value={p.audience}
            onChange={(e) => update("audience", e.target.value as Prefs["audience"])}
            className="h-9 rounded-xl border border-border/70 bg-card px-3 text-sm capitalize"
          >
            <option value="everyone">Everyone</option>
            <option value="adults">Adults</option>
            <option value="teens">Teens</option>
          </select>
        </div>
      </Group>
    </DeviceFrame>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">{children}</div>
    </div>
  );
}

function SelectRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-border/60 px-4 py-3.5 text-left last:border-b-0"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
