import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Bug, ChevronRight, Mail, MessageSquare, Send } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";

export const Route = createFileRoute("/settings/support")({
  component: SupportPage,
});

function SupportPage() {
  const navigate = useNavigate();

  return (
    <DeviceFrame
      title="Help & Support"
      leftSlot={
        <button
          className="icon-button"
          aria-label="Back"
          onClick={() => navigate({ to: "/settings" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
    >
      <div className="mt-4 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">How can we help?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We're here to help you get the most out of your SKIN POP experience.
        </p>
      </div>

      <Group title="Contact Us">
        <Row 
          icon={MessageSquare} 
          label="Live Chat" 
          trailing="Usually replies in 5m" 
          onClick={() => {
            if (typeof window !== "undefined" && (window as any).Tawk_API) {
              if ((window as any).Tawk_API.isChatHidden && (window as any).Tawk_API.isChatHidden()) {
                (window as any).Tawk_API.showWidget();
              }
              (window as any).Tawk_API.maximize();
            } else {
              import("sonner").then(({ toast }) => {
                toast.error("Chat widget is still loading...", {
                  description: "Please wait a few seconds and try again.",
                });
              });
            }
          }} 
        />
        <Row 
          icon={Mail} 
          label="Email Support" 
          trailing="support@sknpop.ai" 
          onClick={() => {
            window.location.href = "mailto:support@sknpop.ai";
          }}
        />
      </Group>

      <Group title="Resources">
        <Row 
          icon={BookOpen} 
          label="FAQ & Guides" 
          onClick={() => navigate({ to: "/settings/faq" })} 
        />
      </Group>

      <Group title="Feedback">
        <Row 
          icon={Bug} 
          label="Report an Issue" 
          onClick={() => {
            window.location.href = "mailto:support@sknpop.ai?subject=Bug Report: SKIN POP App";
          }}
        />
        <Row 
          icon={Send} 
          label="Suggest a Feature" 
          onClick={() => {
            window.location.href = "mailto:support@sknpop.ai?subject=Feature Suggestion: SKIN POP App";
          }}
        />
      </Group>

      <div className="mt-8 flex justify-center pb-8">
        <p className="text-xs text-muted-foreground">SKIN POP App Version 2.4.0</p>
      </div>
    </DeviceFrame>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 px-1">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  trailing?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left last:border-b-0 hover:bg-secondary/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {trailing && <span className="text-xs text-muted-foreground">{trailing}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
