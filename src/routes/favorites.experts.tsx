import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Search, Star } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { EXPERTS } from "@/lib/tips-content";
import { useFavorites } from "@/lib/favorites-content";
import { HeartToggle, FavoritesFooter } from "./favorites.index";

export const Route = createFileRoute("/favorites/experts")({
  component: SavedExpertsPage,
});

function SavedExpertsPage() {
  const navigate = useNavigate();
  const { isFav, toggle } = useFavorites();
  const [filter, setFilter] = useState<string>("all");

  const saved = useMemo(() => EXPERTS.filter((e) => isFav("expert", e.id)), [isFav]);
  const filters = useMemo(() => {
    const titles = Array.from(new Set(saved.map((e) => e.title)));
    return [{ key: "all", label: `All Experts (${saved.length})` }, ...titles.map((t) => ({ key: t, label: t + "s" }))];
  }, [saved]);
  const list = filter === "all" ? saved : saved.filter((e) => e.title === filter);

  return (
    <DeviceFrame
      title="Expert Saved"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/favorites" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></button>}
      footer={<FavoritesFooter active="favorites" />}
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No saved experts yet.
          </div>
        )}
        {list.map((e) => (
          <button
            key={e.id}
            onClick={() => navigate({ to: "/tips/experts/$id", params: { id: e.id } })}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold ${e.tone}`}>{e.initials}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                <BadgeCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="truncate text-xs text-muted-foreground">{e.title}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {e.rating} ({e.answers} Answers)
              </p>
              <p className="text-[11px] text-muted-foreground">Saved on 10 May 2024</p>
            </div>
            <HeartToggle active={isFav("expert", e.id)} onClick={(ev) => { ev.stopPropagation(); toggle("expert", e.id); }} />
          </button>
        ))}
      </div>

      <Button size="lg" className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/tips/experts" })}>
        Ask an Expert
      </Button>
    </DeviceFrame>
  );
}
