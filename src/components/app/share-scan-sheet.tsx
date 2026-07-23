import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, Globe, Link2, Loader2, Lock, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disableScanSharing,
  enableScanSharing,
  getMyScanShareToken,
  type ScanRow,
} from "@/lib/skin-analysis.functions";

interface ShareScanSheetProps {
  open: boolean;
  onClose: () => void;
  scan: ScanRow;
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs care";
}

async function renderScanImage(scan: ScanRow): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f4ecff");
  grad.addColorStop(1, "#ffe6ef");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#8b5cf6";
  ctx.font = "600 44px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.fillText("SKIN POP", W / 2, 120);
  ctx.fillStyle = "#5b5566";
  ctx.font = "400 28px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("AI Skin Analysis", W / 2, 165);

  // Score card
  const cardX = 80;
  const cardY = 230;
  const cardW = W - 160;
  const cardH = 360;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  ctx.fillStyle = "#8b5cf6";
  ctx.font = "700 220px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(String(scan.overall_score), W / 2, cardY + 220);

  ctx.fillStyle = "#5b5566";
  ctx.font = "500 32px system-ui";
  ctx.fillText("Skin Score / 100", W / 2, cardY + 275);

  ctx.fillStyle = "#22a06b";
  ctx.font = "600 40px system-ui";
  ctx.fillText(scoreLabel(scan.overall_score), W / 2, cardY + 325);

  // Two stat tiles
  drawTile(ctx, 80, 620, (W - 200) / 2, 180, "Skin Age", `${scan.skin_age ?? "—"}`, "years");
  drawTile(ctx, 80 + (W - 200) / 2 + 40, 620, (W - 200) / 2, 180, "Skin Type", (scan.skin_type ?? "—").toString(), "detected");

  // Concerns
  let y = 850;
  ctx.textAlign = "left";
  ctx.fillStyle = "#1a1420";
  ctx.font = "600 32px system-ui";
  ctx.fillText("Top concerns", 100, y);
  y += 20;
  const items = (scan.concerns ?? []).slice(0, 3);
  items.forEach((c) => {
    y += 60;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 80, y - 40, W - 160, 68, 20);
    ctx.fill();
    ctx.fillStyle = "#1a1420";
    ctx.font = "500 28px system-ui";
    ctx.fillText(c.name, 110, y);
    ctx.textAlign = "right";
    ctx.fillStyle = c.severity === "high" ? "#e5484d" : c.severity === "moderate" ? "#8b5cf6" : "#22a06b";
    ctx.font = "600 24px system-ui";
    ctx.fillText(c.severity.toUpperCase(), W - 110, y);
    ctx.textAlign = "left";
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#5b5566";
  ctx.font = "500 26px system-ui";
  ctx.fillText("Get your own scan at skinpop.app", W / 2, H - 70);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render image"))), "image/png", 0.95);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, value: string, sub: string) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = "#5b5566";
  ctx.font = "500 24px system-ui";
  ctx.fillText(label, x + 30, y + 50);
  ctx.fillStyle = "#1a1420";
  ctx.font = "700 56px system-ui";
  ctx.fillText(value, x + 30, y + 115);
  ctx.fillStyle = "#5b5566";
  ctx.font = "400 22px system-ui";
  ctx.fillText(sub, x + 30, y + 150);
}

export function ShareScanSheet({ open, onClose, scan }: ShareScanSheetProps) {
  const enable = useServerFn(enableScanSharing);
  const disable = useServerFn(disableScanSharing);
  const getToken = useServerFn(getMyScanShareToken);

  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open || initialized.current) return;
    initialized.current = true;
    getToken({ data: { id: scan.id } })
      .then((r) => setToken((r as { share_token: string | null }).share_token))
      .catch(() => {});
  }, [open, scan.id, getToken]);

  if (!open) return null;

  const shareUrl = token ? `${window.location.origin}/s/${token}` : null;

  const summaryText = `My SKIN POP results: ${scan.overall_score}/100 (${scoreLabel(scan.overall_score)}) · Skin age ${scan.skin_age ?? "—"} · ${scan.skin_type ?? ""}`.trim();

  async function ensureLink() {
    if (token) return token;
    setLoadingToken(true);
    setErr(null);
    try {
      const r = (await enable({ data: { id: scan.id } })) as { share_token: string };
      setToken(r.share_token);
      return r.share_token;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create link");
      return null;
    } finally {
      setLoadingToken(false);
    }
  }

  async function handleCopy() {
    const t = await ensureLink();
    if (!t) return;
    const url = `${window.location.origin}/s/${t}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setErr("Couldn't copy — long-press the link to copy manually.");
    }
  }

  async function handleShareLink() {
    const t = await ensureLink();
    if (!t) return;
    const url = `${window.location.origin}/s/${t}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "My SKIN POP results", text: summaryText, url });
        return;
      } catch {
        // user cancelled or blocked
      }
    }
    await handleCopy();
  }

  async function handleShareImage() {
    setImgBusy(true);
    setErr(null);
    try {
      const blob = await renderScanImage(scan);
      const file = new File([blob], `skinpop-scan-${scan.id.slice(0, 8)}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: "My SKIN POP results", text: summaryText });
          return;
        } catch {
          // fall through to download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to make image");
    } finally {
      setImgBusy(false);
    }
  }

  async function handleRevoke() {
    setLoadingToken(true);
    setErr(null);
    try {
      await disable({ data: { id: scan.id } });
      setToken(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setLoadingToken(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-[28px] bg-card p-5 pb-8 shadow-phone sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">Share your results</p>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleShareLink}
            disabled={loadingToken}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Share link</p>
              <p className="text-xs text-muted-foreground">Send via Whatsapp, Messages, Mail…</p>
            </div>
            {loadingToken ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={loadingToken}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {copied ? <Check className="h-5 w-5 text-sage" /> : <Copy className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{copied ? "Link copied" : "Copy link"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {shareUrl ?? "Generate a private, shareable link"}
              </p>
            </div>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={handleShareImage}
            disabled={imgBusy}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {imgBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium">Share as image</p>
              <p className="text-xs text-muted-foreground">Great for Instagram / stories</p>
            </div>
          </button>

          {token && (
            <button
              type="button"
              onClick={handleRevoke}
              disabled={loadingToken}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm disabled:opacity-60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Revoke public link</p>
                <p className="text-xs text-muted-foreground">Existing link will stop working</p>
              </div>
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span>Shared links reveal your scan results but never your photo.</span>
        </div>

        {err && <p className="mt-3 text-center text-xs text-destructive">{err}</p>}

        <Button variant="outline" className="mt-5 w-full rounded-2xl" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
