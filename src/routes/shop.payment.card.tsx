import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, HelpCircle, Lock } from "lucide-react";
import { useState } from "react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/payment/card")({
  head: () => ({ meta: [{ title: "Add Card — SKIN POP" }] }),
  component: AddCardPage,
});

function AddCardPage() {
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [save, setSave] = useState(true);

  return (
    <DeviceFrame
      title="Add New Card"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/shop/payment" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="flex h-40 items-center justify-center rounded-3xl bg-gradient-card">
        <div className="flex items-center gap-4 text-2xl">💳</div>
        <div className="ml-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <span>VISA</span>
          <span className="text-coral">●●</span>
          <span>RuPay</span>
        </div>
      </div>

      <Field label="Card Number">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="1234 5678 9012 3456"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          inputMode="numeric"
        />
      </Field>

      <Field label="Card Holder Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
        />
      </Field>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Expiry Date">
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/YY"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          />
        </Field>
        <Field label="CVV">
          <div className="relative">
            <input
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="123"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 pr-9 text-sm"
              inputMode="numeric"
            />
            <HelpCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="h-4 w-4 accent-primary" />
        Save this card securely for future payments
      </label>

      <Button className="mt-6 h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/shop/review" })}>
        Add Card
      </Button>

      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-semibold text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>PCI DSS</span>
        <span>·</span>
        <span>Verified by VISA</span>
        <span>·</span>
        <span>Mastercard SecureCode</span>
      </div>
    </DeviceFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
