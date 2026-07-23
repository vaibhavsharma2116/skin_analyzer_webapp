import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/address")({
  head: () => ({ meta: [{ title: "Choose Address — SKIN POP" }] }),
  component: AddressPage,
});

const ADDRESSES = [
  {
    id: "home",
    label: "Home",
    name: "John Doe",
    line: "123, Green Park, South City 1,\nGurugram, Haryana - 122001",
    phone: "+91 98765 43210",
  },
  {
    id: "work",
    label: "Work",
    name: "John Doe",
    line: "DLF Cyber City, Tower C,\nGurugram, Haryana - 122002",
    phone: "+91 98765 43210",
  },
] as const;

const KEY = "skinpop.checkout.address";

export function useSelectedAddress() {
  const [id, setId] = useState<string>("home");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (stored) setId(stored);
  }, []);
  return {
    id,
    set: (v: string) => {
      setId(v);
      if (typeof window !== "undefined") localStorage.setItem(KEY, v);
    },
    address: ADDRESSES.find((a) => a.id === id) ?? ADDRESSES[0],
  };
}

function AddressPage() {
  const navigate = useNavigate();
  const { id, set } = useSelectedAddress();

  return (
    <DeviceFrame
      title="Choose Address"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/cart" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="text-xs font-semibold text-primary">+ Add New</button>}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deliver to</p>
      <div className="mt-3 space-y-3">
        {ADDRESSES.map((a) => {
          const active = id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => set(a.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-border/70 bg-card"}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${active ? "border-primary" : "border-muted-foreground/40"}`}>
                  {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <span className="text-xs font-semibold text-primary">Edit</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{a.name}</p>
                  <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{a.line}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.phone}</p>
                </div>
              </div>
            </button>
          );
        })}

        <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left text-muted-foreground">
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Add delivery address</span>
        </button>
      </div>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/payment" })}>
        Deliver to this address
      </Button>
    </DeviceFrame>
  );
}
