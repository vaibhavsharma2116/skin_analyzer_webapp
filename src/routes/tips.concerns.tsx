import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Input } from "@/components/ui/input";
import { SKIN_CONCERNS } from "@/lib/skin-guide";

export const Route = createFileRoute("/tips/concerns")({
  head: () => ({
    meta: [
      { title: "Skin Concerns — SKIN POP" },
      { name: "description", content: "Find the best ingredients for every skin concern." },
    ],
  }),
  component: ConcernsPage,
});

function ConcernsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return SKIN_CONCERNS;
    return SKIN_CONCERNS.filter(
      (c) => c.name.toLowerCase().includes(ql) || c.ingredients.join(" ").toLowerCase().includes(ql),
    );
  }, [q]);

  return (
    <DeviceFrame
      title="Skin Concerns"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search concern or ingredient…" className="h-11 rounded-2xl pl-9" />
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {SKIN_CONCERNS.length} concerns · Recommended actives
      </p>

      <div className="mt-2 space-y-2">
        {list.map((c) => (
          <div key={c.name} className="rounded-2xl border border-border/70 bg-card p-3">
            <p className="text-sm font-semibold">{c.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.ingredients.map((ing) => (
                <span key={ing} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{ing}</span>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">No matches.</div>
        )}
      </div>
    </DeviceFrame>
  );
}
