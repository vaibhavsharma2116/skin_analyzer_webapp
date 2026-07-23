import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Input } from "@/components/ui/input";
import { CORE_INGREDIENTS } from "@/lib/skin-guide";

export const Route = createFileRoute("/tips/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredient Guide — SKIN POP" },
      { name: "description", content: "Learn what each skincare ingredient does and who it's for." },
    ],
  }),
  component: IngredientsPage,
});

function IngredientsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return CORE_INGREDIENTS;
    return CORE_INGREDIENTS.filter(
      (i) => i.name.toLowerCase().includes(ql) || i.benefit.toLowerCase().includes(ql) || i.goodFor.join(" ").toLowerCase().includes(ql),
    );
  }, [q]);

  return (
    <DeviceFrame
      title="Ingredient Guide"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients…" className="h-11 rounded-2xl pl-9" />
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Core Library · {CORE_INGREDIENTS.length} ingredients</p>

      <div className="mt-2 space-y-2">
        {list.map((i) => (
          <div key={i.name} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{i.emoji}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-muted-foreground">{i.benefit}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {i.goodFor.map((g) => (
                  <span key={g} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{g}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">No ingredients match.</div>
        )}
      </div>
    </DeviceFrame>
  );
}
