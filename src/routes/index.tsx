import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CTA } from "@/components/landing/cta";
import logoAsset from "@/assets/sknpop-logo.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SKIN POP — AI Skin Analysis & Personalized Skincare" },
      { name: "description", content: "AI-powered face scan detects 40+ skin concerns, predicts your skin age, and builds a personalized routine in seconds." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <CTA />
      </main>
      <footer className="border-t border-border py-10 text-center">
        <img
          src={logoAsset.url}
          alt="SKNPOP Skincare"
          className="mx-auto h-10 w-auto"
          width={200}
          height={50}
        />

        <p className="mt-3 text-sm text-muted-foreground">
          AI-powered skincare intelligence
        </p>

        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          © {new Date().getFullYear()} · Decoded by AI
        </p>
      </footer>
    </div>
  );
}
