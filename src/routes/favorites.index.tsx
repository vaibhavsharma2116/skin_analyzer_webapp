import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight, Bell, ChevronRight, Heart, History, Home, Menu, ScanFace,
  Search, Sparkles, UserRound, ClipboardList,
} from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Input } from "@/components/ui/input";
import { useFavorites, useSeedFavorites, SAVED_PRODUCTS, SAVED_ROUTINES, COLLECTIONS } from "@/lib/favorites-content";
import { ARTICLES } from "@/lib/tips-content";
import { EXPERTS } from "@/lib/tips-content";

export const Route = createFileRoute("/favorites/")({
  component: FavoritesHome,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "products", label: "Products" },
  { key: "articles", label: "Articles" },
  { key: "routines", label: "Routines" },
  { key: "experts", label: "Experts" },
] as const;

function FavoritesHome() {
  useSeedFavorites();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const { isFav, toggle } = useFavorites();

  const recentlySaved = useMemo(() => {
    const items: { key: string; kind: "product" | "article" | "routine" | "expert"; id: string; title: string; subtitle: string; date: string; emoji?: string; tone: string }[] = [];
    SAVED_PRODUCTS.slice(0, 2).forEach((p) => items.push({ key: `p:${p.id}`, kind: "product", id: p.id, title: p.name, subtitle: `SKIN POP  •  ${p.price}`, date: p.savedOn, emoji: p.emoji, tone: p.tone }));
    ARTICLES.slice(0, 1).forEach((a) => items.push({ key: `a:${a.slug}`, kind: "article", id: a.slug, title: a.title, subtitle: a.categoryLabel, date: a.date, emoji: a.hero, tone: "bg-primary/15" }));
    SAVED_ROUTINES.slice(0, 1).forEach((r) => items.push({ key: `r:${r.id}`, kind: "routine", id: r.id, title: r.name, subtitle: "Routine", date: r.date, emoji: r.emoji, tone: r.tone }));
    EXPERTS.slice(0, 1).forEach((e) => items.push({ key: `e:${e.id}`, kind: "expert", id: e.id, title: e.name, subtitle: e.title, date: "10 May 2024", emoji: "👩‍⚕️", tone: e.tone }));
    const ql = q.trim().toLowerCase();
    return ql ? items.filter((i) => i.title.toLowerCase().includes(ql)) : items;
  }, [q]);

  const filtered = useMemo(() => {
    if (tab === "all") return recentlySaved;
    const mapKind = { products: "product", articles: "article", routines: "routine", experts: "expert" } as const;
    return recentlySaved.filter((i) => i.kind === mapKind[tab as keyof typeof mapKind]);
  }, [recentlySaved, tab]);

  return (
    <DeviceFrame
      title="Favorites"
      leftSlot={<button className="icon-button" aria-label="Menu"><Menu className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Search"><Search className="h-4 w-4" /></button>}
      footer={<FavoritesFooter active="favorites" />}
    >
      <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Heart className="h-5 w-5 fill-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Your favorites, all in one place</p>
            <p className="mt-1 text-xs text-muted-foreground">Quick access to your saved products, articles, experts and routines.</p>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search favorites…" className="h-11 rounded-2xl pl-9" />
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Recently Saved</p>
        <button className="text-xs font-semibold text-primary" onClick={() => navigate({ to: "/favorites/products" })}>View All</button>
      </div>

      <div className="mt-2 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing saved here yet.
          </div>
        )}
        {filtered.map((i) => (
          <button
            key={i.key}
            onClick={() => {
              if (i.kind === "product") navigate({ to: "/favorites/products" });
              else if (i.kind === "article") navigate({ to: "/tips/article/$slug", params: { slug: i.id } });
              else if (i.kind === "routine") navigate({ to: "/favorites/routines" });
              else navigate({ to: "/tips/experts/$id", params: { id: i.id } });
            }}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 text-left shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${i.tone}`}>{i.emoji ?? "💜"}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{i.title}</p>
              <p className="truncate text-xs text-muted-foreground">{i.subtitle}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{i.date}</p>
            </div>
            <HeartToggle active={isFav(i.kind, i.id)} onClick={(e) => { e.stopPropagation(); toggle(i.kind, i.id); }} />
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Collections</p>
        <button className="text-xs font-semibold text-primary" onClick={() => navigate({ to: "/favorites/collections" })}>View All</button>
      </div>
      <div className="mt-2 space-y-3">
        {COLLECTIONS.slice(0, 2).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ to: "/favorites/collections" })}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 text-left shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${c.tone}`}>
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.count} items</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <QuickTile label="Products" hint="Saved items" icon={Sparkles} onClick={() => navigate({ to: "/favorites/products" })} />
        <QuickTile label="Articles" hint="Saved reads" icon={Sparkles} onClick={() => navigate({ to: "/favorites/articles" })} />
        <QuickTile label="Routines" hint="Saved routines" icon={Sparkles} onClick={() => navigate({ to: "/favorites/routines" })} />
        <QuickTile label="Experts" hint="Saved experts" icon={UserRound} onClick={() => navigate({ to: "/favorites/experts" })} />
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/favorites/collections" })}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
      >
        Open Collections <ArrowRight className="h-4 w-4" />
      </button>
    </DeviceFrame>
  );
}

function QuickTile({ label, hint, icon: Icon, onClick }: { label: string; hint: string; icon: typeof Sparkles; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}

export function HeartToggle({ active, onClick }: { active: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove favorite" : "Add favorite"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${active ? "border-coral/30 bg-coral/10 text-coral" : "border-border bg-card text-muted-foreground"}`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-coral" : ""}`} />
    </button>
  );
}

export function FavoritesFooter({ active }: { active: "home" | "history" | "scan" | "favorites" | "profile" }) {
  const navigate = useNavigate();
  const items = [
    { key: "home", label: "Home", icon: Home, onClick: () => navigate({ to: "/dashboard" }) },
    { key: "history", label: "History", icon: History, onClick: () => navigate({ to: "/history" }) },
    { key: "scan", label: "Scan", icon: ScanFace, onClick: () => navigate({ to: "/scan" }) },
    { key: "favorites", label: "Favorites", icon: Heart, onClick: () => navigate({ to: "/favorites" }) },
    { key: "profile", label: "Profile", icon: UserRound, onClick: () => {} },
  ] as const;
  return (
    <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button key={item.key} type="button" onClick={item.onClick} className="flex flex-col items-center gap-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className={isActive ? "font-semibold text-primary" : undefined}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
