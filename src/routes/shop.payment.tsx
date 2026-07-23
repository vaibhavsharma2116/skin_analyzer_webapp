import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, CreditCard, Landmark, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { useCart, formatINR } from "@/lib/cart";

export const Route = createFileRoute("/shop/payment")({
  head: () => ({ meta: [{ title: "Payment Methods — SKIN POP" }] }),
  component: PaymentPage,
});

const KEY = "skinpop.checkout.payment";

export function useSelectedPayment() {
  const [method, setMethod] = useState<string>("card");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (stored) setMethod(stored);
  }, []);
  const set = (v: string) => {
    setMethod(v);
    if (typeof window !== "undefined") localStorage.setItem(KEY, v);
  };
  return { method, set };
}

const UPI = [
  { id: "gpay", label: "Google Pay", emoji: "🟢" },
  { id: "phonepe", label: "PhonePe", emoji: "🟣" },
  { id: "paytm", label: "Paytm", emoji: "🔵" },
  { id: "upi", label: "Other UPI Apps", emoji: "💠" },
];

const WALLETS = [
  { id: "paytmw", label: "Paytm Wallet" },
  { id: "amazon", label: "Amazon Pay" },
  { id: "mobikwik", label: "Mobikwik Wallet" },
];

function PaymentPage() {
  const navigate = useNavigate();
  const { method, set } = useSelectedPayment();
  const { total } = useCart();

  const goNext = (chosen: string) => {
    set(chosen);
    if (chosen === "card") navigate({ to: "/shop/payment/card" });
    else navigate({ to: "/shop/review" });
  };

  return (
    <DeviceFrame
      title="Payment Methods"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/address" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <p className="text-center text-xs font-medium text-muted-foreground">100% Secure Payments</p>

      <Section title="UPI">
        {UPI.map((u) => (
          <Row key={u.id} active={method === u.id} onClick={() => goNext(u.id)}>
            <span className="text-lg">{u.emoji}</span>
            <span className="flex-1 text-sm font-medium text-foreground">{u.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Row>
        ))}
      </Section>

      <Section title="Cards">
        <Row active={method === "card"} onClick={() => goNext("card")}>
          <CreditCard className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Credit / Debit Card</p>
            <p className="text-[11px] text-muted-foreground">Visa, Mastercard, RuPay</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Row>
      </Section>

      <Section title="Wallets">
        {WALLETS.map((w) => (
          <Row key={w.id} active={method === w.id} onClick={() => goNext(w.id)}>
            <Wallet className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">{w.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Row>
        ))}
      </Section>

      <Section title="Net Banking">
        <Row active={method === "netbank"} onClick={() => goNext("netbank")}>
          <Landmark className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Net Banking</p>
            <p className="text-[11px] text-muted-foreground">All major banks supported</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Row>
      </Section>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Total Payable</p>
          <p className="text-lg font-bold text-foreground">{formatINR(total)}</p>
        </div>
        <button className="text-xs font-semibold text-primary">View Details</button>
      </div>

      <Button className="mt-3 h-12 w-full rounded-2xl" onClick={() => goNext(method)}>
        Pay {formatINR(total)}
      </Button>
    </DeviceFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border/70 bg-card"}`}
    >
      {children}
    </button>
  );
}
