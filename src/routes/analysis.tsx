import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ShareScanSheet } from "@/components/app/share-scan-sheet";
import { ScanResultsView } from "@/components/app/scan-results-view";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSkinPhoto, type ScanRow, type SkinAnalysisResult } from "@/lib/skin-analysis.functions";


export const Route = createFileRoute("/analysis")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Skin Analysis — SKIN POP" },
      {
        name: "description",
        content: "AI-powered skin analysis results: your skin score, concerns, skin age and personalized tips.",
      },
    ],
  }),
  component: AnalysisPage,
});

type Result = SkinAnalysisResult & { id: string; created_at: string };

const LOADING_STEPS = [
  "Scanning skin texture…",
  "Reading tone and pigmentation…",
  "Detecting fine lines and pores…",
  "Estimating skin age…",
  "Composing your recommendations…",
];

const SCAN_FINGERPRINT_STORAGE_KEY = "skinpop:lastScanFingerprint";



function AnalysisPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeSkinPhoto);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const startedRef = useRef(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let imageDataUrl: string | null = null;
    let faceFingerprint: string | null = null;
    try {
      imageDataUrl = sessionStorage.getItem("skinpop:lastScan");
      faceFingerprint = sessionStorage.getItem(SCAN_FINGERPRINT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!imageDataUrl) {
      setStatus("error");
      setError("No photo found. Please capture or upload one first.");
      return;
    }
    setImage(imageDataUrl);

    const timer = setInterval(() => {
      setStepIdx((i) => (i + 1) % LOADING_STEPS.length);
    }, 1400);

    analyze({ data: { imageDataUrl, faceFingerprint } })
      .then((row) => {
        clearInterval(timer);
        setResult(row as Result);
        setStatus("ready");
        
        // Push Notification logic for "push_scan"
        try {
          const raw = localStorage.getItem("skinpop.settings.notifications");
          if (raw) {
            const settings = JSON.parse(raw);
            if (settings.push_all !== false && settings.push_scan !== false) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Scan Complete", {
                  body: "Your skin analysis results are ready!",
                  icon: "/icon-192.png",
                });
              }
            }
          }
        } catch (e) {
          // ignore error
        }
      })
      .catch((e: unknown) => {
        clearInterval(timer);
        let msg = e instanceof Error ? e.message : "Analysis failed. Please try again.";
        // Avoid rendering raw HTML if the error message contains it, but still show the text
        if (/<[a-z][\s\S]*>/i.test(msg)) {
          msg = "Server Error: " + msg.replace(/<[^>]*>?/gm, ' ').substring(0, 150) + "...";
        }
        setError(msg);
        setStatus("error");
      });

    return () => clearInterval(timer);
  }, [analyze]);

  const rescan = () => navigate({ to: "/scan" });
  const back = () => navigate({ to: "/dashboard" });

  if (status === "loading") {
    return (
      <DeviceFrame
        title="Analyzing"
        leftSlot={
          <button className="icon-button" aria-label="Back" onClick={back}>
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      >
        <div className="space-y-5">
          {image && (
            <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
              <img src={image} alt="Your scan" className="aspect-[3/4] w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
              <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-primary/70" />
            </div>
          )}
          <div className="rounded-[28px] bg-gradient-card px-5 py-6 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-base font-semibold">AI is analyzing your skin</p>
            <p className="mt-1 text-sm text-muted-foreground transition-opacity">{LOADING_STEPS[stepIdx]}</p>
          </div>
          <p className="text-center text-xs text-muted-foreground">This usually takes 10–20 seconds.</p>
        </div>
      </DeviceFrame>
    );
  }

  if (status === "error") {
    return (
      <DeviceFrame
        title="Analysis"
        leftSlot={
          <button className="icon-button" aria-label="Back" onClick={back}>
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[28px] border border-coral/40 bg-coral/5 px-5 py-6 text-center">
            <p className="text-base font-semibold text-coral">We couldn't analyze your photo</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button size="lg" className="h-12 w-full rounded-2xl" onClick={rescan}>
            <Camera className="mr-2 h-4 w-4" /> Try another scan
          </Button>
          <button
            type="button"
            onClick={back}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium"
          >
            Back to dashboard
          </button>
        </div>
      </DeviceFrame>
    );
  }

  if (!result) return null;
  const scan = result as unknown as ScanRow;

  return (
    <DeviceFrame
      title="Results Summary"
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={back}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
      rightSlot={
        <button className="icon-button" aria-label="Share" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" />
        </button>
      }
    >
      <ScanResultsView scan={scan} />

      <div className="mt-5 space-y-2">
        <Button size="lg" className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations" })}>
          <Sparkles className="mr-2 h-4 w-4" /> View AI Recommendations
        </Button>
        <Button variant="outline" size="lg" className="h-12 w-full rounded-2xl" onClick={() => setShareOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" /> Share results
        </Button>
        <Button variant="outline" size="lg" className="h-12 w-full rounded-2xl" onClick={rescan}>
          <RefreshCw className="mr-2 h-4 w-4" /> Scan again
        </Button>
        <button
          type="button"
          onClick={back}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium"
        >
          Back to dashboard
        </button>
      </div>
      <ShareScanSheet open={shareOpen} onClose={() => setShareOpen(false)} scan={scan} />
    </DeviceFrame>
  );
}

