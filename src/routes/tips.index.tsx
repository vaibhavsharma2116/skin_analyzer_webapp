import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Bookmark, Home, History, LayoutGrid, ScanFace, Search, Sparkles, UserRound } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Input } from "@/components/ui/input";
import { ARTICLES, CATEGORIES } from "@/lib/tips-content";

export const Route = createFileRoute("/tips/")({
  component: TipsHome,
});

function TipsHome() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const featured = ARTICLES[3] ?? ARTICLES[0];
  const trending = useMemo(() => {
    const list = ARTICLES.filter((a) => (filter === "all" ? true : a.category === filter));
    const ql = q.trim().toLowerCase();
    return (ql ? list.filter((a) => a.title.toLowerCase().includes(ql) || a.summary.toLowerCase().includes(ql)) : list).slice(0, 6);
  }, [q, filter]);

  const filters = [
    { key: "all", label: "All", icon: LayoutGrid },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.shortLabel, icon: c.icon })),
  ];

  return (
    <DeviceFrame
      title="Tips & Articles"
      leftSlot={<button className="icon-button" aria-label="Menu" onClick={() => navigate({ to: "/dashboard" })}><Home className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Notifications"><Bell className="h-4 w-4" /></button>}
      footer={
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Home", icon: Home, onClick: () => navigate({ to: "/dashboard" }) },
            { label: "History", icon: History, onClick: () => navigate({ to: "/history" }) },
            { label: "Scan", icon: ScanFace, onClick: () => navigate({ to: "/scan" }) },
            { label: "Tips", icon: Sparkles, active: true, onClick: () => {} },
            { label: "Profile", icon: UserRound, onClick: () => {} },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-medium ${item.active ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tips, articles, topics…" className="h-11 rounded-2xl pl-9" />
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((f) => {
          const active = filter === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex min-w-[68px] flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-center text-[10px] font-medium leading-tight ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Editor's Pick</p>
        <button type="button" onClick={() => navigate({ to: "/tips/categories" })} className="text-xs font-semibold text-primary">
          View All
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate({ to: "/tips/article/$slug", params: { slug: featured.slug } })}
        className={`mt-2 block w-full overflow-hidden rounded-[24px] border border-border/70 bg-gradient-to-br ${featured.gradient} text-left`}
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight">{featured.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{featured.summary}</p>
            <span className="mt-3 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {featured.readMinutes} min read
            </span>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/60 text-4xl">
            {featured.hero ?? "✨"}
          </div>
        </div>
      </button>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Trending Articles</p>
        <button type="button" onClick={() => navigate({ to: "/tips/experts" })} className="text-xs font-semibold text-primary">
          Ask an Expert
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {trending.map((a) => (
          <button
            key={a.slug}
            type="button"
            onClick={() => navigate({ to: "/tips/article/$slug", params: { slug: a.slug } })}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${a.gradient} text-2xl`}>
              {a.hero ?? "✨"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{a.readMinutes} min read</p>
            </div>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {trending.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            No articles match your search.
          </div>
        )}
      </div>
    </DeviceFrame>
  );
}
