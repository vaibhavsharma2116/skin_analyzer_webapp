import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COLLECTIONS, type Collection } from "@/lib/favorites-content";
import { FavoritesFooter } from "./favorites.index";

export const Route = createFileRoute("/favorites/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Collection[]>(COLLECTIONS);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => [{ id: `c-${Date.now()}`, name: trimmed, count: 0, emojis: ["💜"], tone: "bg-primary/10" }, ...prev]);
    setName("");
    setCreating(false);
  }

  return (
    <DeviceFrame
      title="Collections"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/favorites" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <button className="text-sm font-semibold text-primary" onClick={() => setCreating((v) => !v)}>+ New</button>
      }
      footer={<FavoritesFooter active="favorites" />}
    >
      <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary">Create Your Collection</p>
            <p className="mt-1 text-xs text-muted-foreground">Organize your favorite products, articles & routines in one place.</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
            aria-label="Create collection"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {creating && (
          <div className="mt-3 space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="h-11 rounded-2xl" />
            <div className="flex gap-2">
              <Button className="h-10 flex-1 rounded-2xl" onClick={create}>Create</Button>
              <Button variant="outline" className="h-10 flex-1 rounded-2xl" onClick={() => { setCreating(false); setName(""); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground">My Collections</p>
        <div className="mt-3 space-y-3">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ to: "/favorites/products" })}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.count} items</p>
              </div>
              <div className="flex -space-x-2">
                {c.emojis.map((e, i) => (
                  <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border border-card text-base ${c.tone}`}>{e}</div>
                ))}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </DeviceFrame>
  );
}
