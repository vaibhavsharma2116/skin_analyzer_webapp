import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ImageUp,
  Lightbulb,
  RefreshCw,
  ScanFace,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scan")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Skin Scan — SKIN POP" },
      {
        name: "description",
        content: "Capture or upload a clear selfie to start your AI-powered skin analysis.",
      },
    ],
  }),
  component: ScanPage,
});

type Step = "prep" | "capture" | "preview";

const SCAN_IMAGE_WIDTH = 576;
const SCAN_IMAGE_HEIGHT = 768;
const SCAN_IMAGE_ASPECT = SCAN_IMAGE_WIDTH / SCAN_IMAGE_HEIGHT;
const SCAN_FINGERPRINT_STORAGE_KEY = "skinpop:lastScanFingerprint";

const PREP_TIPS = [
  { icon: Sun, title: "Good lighting", desc: "Face a natural light source, avoid harsh shadows" },
  { icon: ScanFace, title: "Remove makeup", desc: "Clean, bare skin gives the most accurate scan" },
  { icon: Sparkles, title: "Hair back", desc: "Pull hair away so your forehead is visible" },
  { icon: Lightbulb, title: "Neutral expression", desc: "Look straight at the camera, relax your face" },
];

function buildFaceFingerprint(canvas: HTMLCanvasElement) {
  const sampleWidth = 9;
  const sampleHeight = 8;
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = sampleHeight;

  const ctx = sample.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    canvas,
    canvas.width * 0.18,
    canvas.height * 0.1,
    canvas.width * 0.64,
    canvas.height * 0.72,
    0,
    0,
    sampleWidth,
    sampleHeight,
  );

  const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  let bits = "";
  for (let y = 0; y < sampleHeight; y++) {
    for (let x = 0; x < sampleWidth - 1; x++) {
      const left = (y * sampleWidth + x) * 4;
      const right = (y * sampleWidth + x + 1) * 4;
      const leftLum = pixels[left] * 0.299 + pixels[left + 1] * 0.587 + pixels[left + 2] * 0.114;
      const rightLum = pixels[right] * 0.299 + pixels[right + 1] * 0.587 + pixels[right + 2] * 0.114;
      bits += leftLum > rightLum ? "1" : "0";
    }
  }

  return bits
    .match(/.{1,4}/g)
    ?.map((part) => Number.parseInt(part, 2).toString(16))
    .join("") ?? null;
}

function drawNormalizedScanImage(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, mirror = false) {
  const canvas = document.createElement("canvas");
  canvas.width = SCAN_IMAGE_WIDTH;
  canvas.height = SCAN_IMAGE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to process image");

  const sourceAspect = sourceWidth / sourceHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceAspect > SCAN_IMAGE_ASPECT) {
    sw = sourceHeight * SCAN_IMAGE_ASPECT;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceAspect < SCAN_IMAGE_ASPECT) {
    sh = sourceWidth / SCAN_IMAGE_ASPECT;
    sy = (sourceHeight - sh) / 2;
  }

  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.80),
    fingerprint: buildFaceFingerprint(canvas),
  };
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to read this photo"));
    img.src = dataUrl;
  });
}

function ScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("prep");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFingerprint, setImageFingerprint] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. Enable it in your browser settings or upload a photo instead."
          : err instanceof Error
            ? err.message
            : "Unable to start camera";
      setCameraError(msg);
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  useEffect(() => {
    if (step === "capture") void startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const normalized = drawNormalizedScanImage(video, video.videoWidth, video.videoHeight, true);
    setImageData(normalized.dataUrl);
    setImageFingerprint(normalized.fingerprint);
    stopCamera();
    setStep("preview");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCameraError("Please upload an image file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setCameraError("Image is too large (max 15MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result !== "string") throw new Error("Unable to read this photo");
        const img = await loadImage(reader.result);
        const normalized = drawNormalizedScanImage(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        setImageData(normalized.dataUrl);
        setImageFingerprint(normalized.fingerprint);
        stopCamera();
        setStep("preview");
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : "Unable to process this photo");
      }
    };
    reader.readAsDataURL(file);
  }

  function retake() {
    setImageData(null);
    setImageFingerprint(null);
    setStep("capture");
  }

  function confirm() {
    if (imageData) {
      try {
        sessionStorage.setItem("skinpop:lastScan", imageData);
        if (imageFingerprint) sessionStorage.setItem(SCAN_FINGERPRINT_STORAGE_KEY, imageFingerprint);
        else sessionStorage.removeItem(SCAN_FINGERPRINT_STORAGE_KEY);
      } catch {
        // ignore storage errors (quota, private mode)
      }
    }
    navigate({ to: "/analysis" });
  }

  const back = () => {
    if (step === "preview") retake();
    else if (step === "capture") setStep("prep");
    else navigate({ to: "/dashboard" });
  };

  return (
    <DeviceFrame
      title={step === "prep" ? "Prepare" : step === "capture" ? "Capture" : "Preview"}
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={back}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
    >
      {step === "prep" && (
        <div className="space-y-5">
          <div className="rounded-[28px] bg-gradient-card px-5 py-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ScanFace className="h-8 w-8" />
            </div>
            <h2 className="mt-3 text-xl font-semibold">Ready for your scan?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow these tips for the most accurate skin analysis.
            </p>
          </div>

          <div className="space-y-3">
            {PREP_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <tip.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button size="lg" className="h-12 w-full rounded-2xl" onClick={() => setStep("capture")}>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            Upload a photo instead
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] border border-border/70 bg-black shadow-sm">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="pointer-events-none absolute inset-6 rounded-[100%/50%] border-2 border-white/70" />
            {isStartingCamera && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                Starting camera…
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-6 text-center text-sm text-white">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"
                >
                  <ImageUp className="h-4 w-4" />
                  Upload instead
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Align your face inside the oval and hold steady.
          </p>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-3 text-xs font-medium"
            >
              <ImageUp className="h-4 w-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!!cameraError || isStartingCamera}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 disabled:opacity-50"
              aria-label="Capture photo"
            >
              <Camera className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                void startCamera();
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-3 text-xs font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {step === "preview" && imageData && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
            <img src={imageData} alt="Captured selfie" className="aspect-[3/4] w-full object-cover" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Looks good? We'll use this photo for your skin analysis.
          </p>
          <Button size="lg" className="h-12 w-full rounded-2xl" onClick={confirm}>
            <Check className="mr-2 h-4 w-4" />
            Use this photo
          </Button>
          <button
            type="button"
            onClick={retake}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retake
          </button>
        </div>
      )}
    </DeviceFrame>
  );
}
