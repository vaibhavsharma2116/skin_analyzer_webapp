import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { SAVED_ROUTINES, useFavorites } from "@/lib/favorites-content";
import { HeartToggle, FavoritesFooter } from "./favorites.index";

export const Route = createFileRoute("/favorites/routines")({
  component: SavedRoutinesPage,
});

const FILTERS = [
  { key: "all", label: "All Routines" },
  { key: "morning", label: "Morning" },
  { key: "evening", label: "Evening" },
  { key: "weekly", label: "Weekly" },
] as const;

function SavedRoutinesPage() {
  const navigate = useNavigate();
  const { isFav, toggle } = useFavorites();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const saved = useMemo(() => SAVED_ROUTINES.filter((r) => isFav("routine", r.id)), [isFav]);
  const list = filter === "all" ? saved : saved.filter((r) => r.slot === filter);

  return (
    <DeviceFrame
      title="Saved Routines"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/favorites" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></button>}
      footer={<FavoritesFooter active="favorites" />}
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = f.key === "all" ? saved.length : saved.filter((r) => r.slot === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {f.label} {f.key === "all" ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No saved routines yet.
          </div>
        )}
        {list.map((r) => (
          <div key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${r.tone}`}>{r.emoji}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.steps} Steps  •  {r.cadence}</p>
              <p className="text-[11px] text-muted-foreground">{r.date}</p>
            </div>
            <HeartToggle active={isFav("routine", r.id)} onClick={(e) => { e.stopPropagation(); toggle("routine", r.id); }} />
          </div>
        ))}
      </div>

      <Button size="lg" className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/reminders/new" })}>
        <Plus className="mr-1 h-4 w-4" /> Create New Routine
      </Button>
    </DeviceFrame>
  );
}
