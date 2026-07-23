import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/lib/tips-content";
import { useFavorites } from "@/lib/favorites-content";
import { HeartToggle, FavoritesFooter } from "./favorites.index";

export const Route = createFileRoute("/favorites/articles")({
  component: SavedArticlesPage,
});

function SavedArticlesPage() {
  const navigate = useNavigate();
  const { isFav, toggle } = useFavorites();
  const [filter, setFilter] = useState<string>("all");

  const saved = useMemo(() => ARTICLES.filter((a) => isFav("article", a.slug)), [isFav]);
  const filters = useMemo(() => {
    const cats = Array.from(new Set(saved.map((a) => a.categoryLabel)));
    return [{ key: "all", label: `All Articles (${saved.length})` }, ...cats.map((c) => ({ key: c, label: c }))];
  }, [saved]);

  const list = filter === "all" ? saved : saved.filter((a) => a.categoryLabel === filter);

  return (
    <DeviceFrame
      title="Article Saved"
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
            No saved articles yet.
          </div>
        )}
        {list.map((a) => (
          <button
            key={a.slug}
            onClick={() => navigate({ to: "/tips/article/$slug", params: { slug: a.slug } })}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${a.gradient} text-3xl`}>{a.hero ?? "📖"}</div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">{a.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.categoryLabel}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{a.date}  •  {a.readMinutes} min read</p>
            </div>
            <HeartToggle active={isFav("article", a.slug)} onClick={(e) => { e.stopPropagation(); toggle("article", a.slug); }} />
          </button>
        ))}
      </div>

      <Button size="lg" className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/tips" })}>
        View All Articles
      </Button>
    </DeviceFrame>
  );
}
