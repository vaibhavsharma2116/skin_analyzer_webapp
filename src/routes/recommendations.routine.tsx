import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Clock, Moon, Sun } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getLatestScan, getCachedLatestScan, setCachedLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";
import { recommendationsFor, type RoutineStep } from "@/lib/recommendations";
import { useQuery } from "@tanstack/react-query";
import { getShopifyRecommendations, matchProductToStep, type ShopifyProduct } from "@/lib/shopify.functions";

const KEY = "skinpop.builder.v1";

type BuilderState = {
  am: string[];
  pm: string[];
  amTime: string;
  pmTime: string;
};

function read(): BuilderState | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}

function write(v: BuilderState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(v));
}

export const Route = createFileRoute("/recommendations/routine")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Routine Builder — SKIN POP" }] }),
  component: RoutineBuilder,
});

function RoutineBuilder() {
  const navigate = useNavigate();
  const fetchLatest = useServerFn(getLatestScan);
  const cached = getCachedLatestScan();
  const [scan, setScan] = useState<ScanRow | null>(cached);
  const [loadingScan, setLoadingScan] = useState(!cached);

  useEffect(() => {
    let active = true;
    fetchLatest()
      .then((r) => {
        if (active) {
          const s = (r as ScanRow | null) ?? null;
          setScan(s);
          if (s) setCachedLatestScan(s);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingScan(false);
      });
    return () => { active = false; };
  }, [fetchLatest]);

  const preset = useMemo(() => recommendationsFor(scan), [scan]);
  const { data: allProducts } = useQuery({
    queryKey: ["shopify-all-products"],
    queryFn: () => getShopifyRecommendations({ data: { concerns: ["skincare"] } }),
    staleTime: 1000 * 60 * 5,
  });

  const [amSel, setAmSel] = useState<Set<string>>(new Set());
  const [pmSel, setPmSel] = useState<Set<string>>(new Set());
  const [amTime, setAmTime] = useState("08:00");
  const [pmTime, setPmTime] = useState("21:00");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once scan loading has completed to ensure correct AI preset IDs
    if (loadingScan) return;

    const stored = read();
    const currentAmIds = new Set(preset.am.map((s) => s.id));
    const currentPmIds = new Set(preset.pm.map((s) => s.id));

    if (stored) {
      const validAm = stored.am.filter((id) => currentAmIds.has(id));
      const validPm = stored.pm.filter((id) => currentPmIds.has(id));

      // If stored selection matches current preset, use it; otherwise select all steps
      setAmSel(new Set(validAm.length > 0 ? validAm : preset.am.map((s) => s.id)));
      setPmSel(new Set(validPm.length > 0 ? validPm : preset.pm.map((s) => s.id)));
      if (stored.amTime) setAmTime(stored.amTime);
      if (stored.pmTime) setPmTime(stored.pmTime);
    } else {
      setAmSel(new Set(preset.am.map((s) => s.id)));
      setPmSel(new Set(preset.pm.map((s) => s.id)));
    }
    setInitialized(true);
  }, [preset, loadingScan]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const save = () => {
    write({ am: [...amSel], pm: [...pmSel], amTime, pmTime });
    navigate({ to: "/recommendations/save" });
  };

  return (
    <DeviceFrame
      title="Routine Builder"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/recommendations" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <p className="text-sm text-muted-foreground">Tap steps to include them in your routine. You can set reminders next.</p>

      {loadingScan && !initialized ? (
        <div className="mt-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading your personalized routine...
        </div>
      ) : (
        <>
          <SlotEditor
            title="Morning Routine"
            icon={<Sun className="h-4 w-4" />}
            steps={preset.am}
            selected={amSel}
            onToggle={(id) => toggle(amSel, setAmSel, id)}
            time={amTime}
            onTime={setAmTime}
            allProducts={allProducts}
          />
          <SlotEditor
            title="Evening Routine"
            icon={<Moon className="h-4 w-4" />}
            steps={preset.pm}
            selected={pmSel}
            onToggle={(id) => toggle(pmSel, setPmSel, id)}
            time={pmTime}
            onTime={setPmTime}
            allProducts={allProducts}
          />

          <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Selected</p>
            <p className="mt-1">AM: {amSel.size} steps at {amTime}</p>
            <p>PM: {pmSel.size} steps at {pmTime}</p>
          </div>

          <Button className="mt-6 h-12 w-full rounded-2xl" onClick={save} disabled={amSel.size + pmSel.size === 0}>
            Save Routine & Set Reminders
          </Button>
        </>
      )}
    </DeviceFrame>
  );
}

function SlotEditor({
  title, icon, steps, selected, onToggle, time, onTime, allProducts,
}: {
  title: string;
  icon: React.ReactNode;
  steps: RoutineStep[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  time: string;
  onTime: (t: string) => void;
  allProducts: ShopifyProduct[] | undefined;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {icon} {title}
        </div>
        <label className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2 py-1 text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <input type="time" value={time} onChange={(e) => onTime(e.target.value)} className="bg-transparent text-xs outline-none" />
        </label>
      </div>
      <ul className="mt-3 space-y-2">
        {steps.map((s) => {
          const on = selected.has(s.id);
          const matchedProduct = matchProductToStep(s.title, allProducts);
          return (
            <li key={s.id}>
              <div
                className={`flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition ${on ? "border-primary bg-primary/5" : "border-border/70 bg-secondary/30"}`}
              >
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggle(s.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(s.id); } }}
                  className="flex w-full cursor-pointer items-center gap-3 select-none"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                    {on && <span className="text-[11px]">✓</span>}
                  </span>
                  <span className="text-xl">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{matchedProduct ? matchedProduct.title : s.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
                  </div>
                </div>
                {matchedProduct && (
                  <div className="ml-9 flex w-[calc(100%-2.25rem)] items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-2 text-left">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {matchedProduct.images?.edges?.[0]?.node?.url && (
                        <img src={matchedProduct.images.edges[0].node.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="text-xs font-bold text-primary">
                        {matchedProduct.priceRange?.minVariantPrice?.currencyCode === 'INR' ? '₹' : (matchedProduct.priceRange?.minVariantPrice?.currencyCode || '₹')} {parseFloat(matchedProduct.priceRange?.minVariantPrice?.amount || '0').toLocaleString()}
                      </div>
                      <a 
                        href={`https://sknpop.in/products/${matchedProduct.handle}`} 
                        target="_blank" rel="noopener noreferrer" 
                        className="mt-1 flex w-fit items-center justify-center rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Buy Now
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
