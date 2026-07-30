import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import logoAsset from "@/assets/sknpop-logo.png.asset.json";
import { DeviceFrame } from "@/components/app/device-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  getMyProfile,
  saveMyProfile,
  type ProfileFormInput,
} from "@/lib/profiles.functions";

type Screen = "splash" | "welcome" | "auth" | "verify" | "profile" | "success";
type AuthMode = "signup" | "login";

type ProfileRecord = {
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  skin_type: string | null;
  primary_concern: string | null;
  skin_goals: string[] | null;
  preferred_language: string | null;
  onboarding_completed: boolean | null;
};

const goalOptions = ["Clear Skin", "Hydration", "Anti-Aging", "Glow", "Barrier Repair"];
const concernOptions: Array<{ value: ProfileFormInput["primary_concern"]; label: string }> = [
  { value: "acne", label: "Acne" },
  { value: "dark_spots", label: "Dark Spots" },
  { value: "pigmentation", label: "Pigmentation" },
  { value: "pores", label: "Visible Pores" },
  { value: "texture", label: "Texture" },
  { value: "fine_lines", label: "Fine Lines" },
  { value: "dullness", label: "Dullness" },
  { value: "redness", label: "Redness" },
  { value: "other", label: "Other" },
];

const skinTypes: Array<{ value: ProfileFormInput["skin_type"]; label: string }> = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "normal", label: "Normal" },
  { value: "sensitive", label: "Sensitive" },
  { value: "other", label: "Other" },
  { value: "na", label: "N/A" },
];

const defaultProfile: ProfileFormInput = {
  full_name: "",
  date_of_birth: "",
  gender: "female",
  skin_type: "combination",
  primary_concern: "dark_spots",
  skin_goals: ["Clear Skin", "Hydration"],
  preferred_language: "en",
  onboarding_completed: true,
};

export function AuthFlow() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const persistProfile = useServerFn(saveMyProfile);

  const [screen, setScreen] = useState<Screen>("splash");
  const [splashVisible, setSplashVisible] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [credentials, setCredentials] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [profile, setProfile] = useState<ProfileFormInput>(defaultProfile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAvatarMenuOpen(false);
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  const openCamera = async () => {
    setAvatarMenuOpen(false);
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Camera unavailable");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setAvatarPreview(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
  };

  useEffect(() => () => stopCamera(), [stopCamera]);


  const passwordHints = useMemo(
    () => [
      { label: "At least 8 characters", ok: credentials.password.length >= 8 },
      { label: "One uppercase letter", ok: /[A-Z]/.test(credentials.password) },
      { label: "One number or symbol", ok: /[^a-zA-Z]/.test(credentials.password) },
    ],
    [credentials.password],
  );

  const hydrateProfile = useCallback(
    async (sessionUser: { email?: string | null; user_metadata?: Record<string, unknown> }) => {
      const existing = (await fetchProfile()) as ProfileRecord | null;

      if (existing?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      setProfile({
        full_name:
          existing?.full_name ??
          (credentials.fullName ||
            (typeof sessionUser.user_metadata?.full_name === "string"
              ? sessionUser.user_metadata.full_name
              : "")),
        date_of_birth: existing?.date_of_birth ?? "",
        gender:
          existing?.gender === "male" || existing?.gender === "other"
            ? existing.gender
            : "female",
        skin_type:
          existing?.skin_type === "oily" ||
          existing?.skin_type === "dry" ||
          existing?.skin_type === "normal" ||
          existing?.skin_type === "sensitive"
            ? existing.skin_type
            : "combination",
        primary_concern:
          existing?.primary_concern === "acne" ||
          existing?.primary_concern === "pigmentation" ||
          existing?.primary_concern === "pores" ||
          existing?.primary_concern === "texture" ||
          existing?.primary_concern === "fine_lines" ||
          existing?.primary_concern === "dullness" ||
          existing?.primary_concern === "redness"
            ? existing.primary_concern
            : "dark_spots",
        skin_goals: existing?.skin_goals?.length ? existing.skin_goals : ["Clear Skin", "Hydration"],
        preferred_language: existing?.preferred_language === "hi" ? "hi" : "en",
        onboarding_completed: true,
      });
      setScreen("profile");
    },
    [credentials.fullName, fetchProfile, navigate],
  );

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active || !session?.user) return;
      try {
        await hydrateProfile(session.user);
      } catch {
        // ignore initial unauthorized fetches until auth settles
      }
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        void hydrateProfile(session.user).catch((authError: unknown) => {
          setError(authError instanceof Error ? authError.message : "Unable to load your profile.");
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  useEffect(() => {
    if (screen !== "splash") return;

    const timer = window.setTimeout(() => {
      setSplashVisible(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (splashVisible || screen !== "splash") return;

    const timer = window.setTimeout(() => {
      setScreen("welcome");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [splashVisible, screen]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase redirects automatically, no need to handle result.redirected
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        if (!credentials.fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        if (credentials.password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: credentials.fullName.trim() },
          },
        });

        if (signUpError) throw signUpError;

        setEmailForVerification(credentials.email);

        if (data.session?.user) {
          await hydrateProfile(data.session.user);
        } else {
          setScreen("verify");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (signInError) throw signInError;
        if (data.user) {
          await hydrateProfile(data.user);
        }
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await persistProfile({ data: profile });
      setScreen("success");
      window.setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 900);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile save failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleGoal(goal: string) {
    setProfile((current) => {
      const exists = current.skin_goals.includes(goal);
      if (exists) {
        return {
          ...current,
          skin_goals: current.skin_goals.filter((item) => item !== goal),
        };
      }

      if (current.skin_goals.length >= 5) return current;
      return { ...current, skin_goals: [...current.skin_goals, goal] };
    });
  }

  if (screen === "splash" || screen === "welcome") {
    return (
      <DeviceFrame className="pb-8">
        <div className="relative min-h-[600px]">
          {/* Welcome screen — fades and slides up as splash exits */}
          <div
            className={cn(
              "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              splashVisible
                ? "pointer-events-none translate-y-5 opacity-0"
                : "translate-y-0 opacity-100"
            )}
          >
            <div className="overflow-hidden rounded-[28px] border border-border/60 bg-gradient-card p-6">
              <img
                src={logoAsset.url}
                alt="SkinPop"
                className="h-auto w-28 object-contain"
              />
              <h2 className="mt-6 text-4xl font-semibold leading-tight text-foreground">
                Your Skin. <br />
                Our Science. <br />
                <span className="text-primary">Real Results.</span>
              </h2>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "AI-Powered Analysis",
                    desc: "Fast selfie-based skin insights in a few taps.",
                    icon: Sparkles,
                  },
                  {
                    title: "Personalized Insights",
                    desc: "Track concerns, goals, and routine fit in one place.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Profile-Led Routine",
                    desc: "Recommendations that adapt to your skin type and needs.",
                    icon: UserRound,
                  },
                ].map((item) => (
                  <div key={item.title} className="grid grid-cols-[auto_1fr] items-start gap-4 rounded-2xl bg-card/85 p-4 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="mt-6 h-12 w-full rounded-2xl" onClick={() => setScreen("auth")}>
              Get Started
            </Button>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button className="font-semibold text-primary" onClick={() => {
                setAuthMode("login");
                setScreen("auth");
              }}>
                Log in
              </button>
            </p>
          </div>

          {/* Splash overlay — fades and scales down */}
          {screen === "splash" && (
            <div
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                splashVisible
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              )}
            >
              <div className="relative">
                <div className="absolute -inset-8 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-primary/10 blur-2xl" />
                <img
                  src={logoAsset.url}
                  alt="SkinPop"
                  className="relative h-auto w-56 object-contain drop-shadow-sm"
                />
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                AI Skincare Intelligence
              </p>
              <button
                type="button"
                onClick={() => {
                  setSplashVisible(false);
                  setScreen("welcome");
                }}
                aria-label="Skip splash"
                className="group mt-10 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-5 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
              >
                Skip
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </DeviceFrame>
    );
  }

  if (screen === "verify") {
    return (
      <DeviceFrame
        title="Verify Your Email"
        leftSlot={
          <button className="icon-button" onClick={() => setScreen("auth")} aria-label="Back to auth">
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      >
        <div className="rounded-[28px] border border-border/70 bg-secondary/40 p-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-10 w-10" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-foreground">Check your inbox</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{emailForVerification}</span>.
            Open it, then come back here to finish your profile.
          </p>
        </div>

        <Button size="lg" variant="outline" className="mt-6 h-12 w-full rounded-2xl" onClick={() => setScreen("auth")}>
          Back to sign in
        </Button>
      </DeviceFrame>
    );
  }

  if (screen === "profile") {
    return (
      <>
      <DeviceFrame
        title="Create Your Profile"
        leftSlot={
          <button className="icon-button" onClick={() => setScreen("auth")} aria-label="Back to auth">
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      >
        <div className="mb-5 flex items-center gap-4 rounded-[24px] bg-secondary/45 p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((v) => !v)}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-card shadow-sm"
              aria-label="Change profile photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : profile.full_name ? (
                <span className="text-xl font-semibold text-primary">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <UserRound className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Camera className="h-4 w-4" />
              </span>
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
            />
            {avatarMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg">
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50"
                >
                  <Camera className="h-4 w-4" /> Take photo
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50"
                >
                  <UserRound className="h-4 w-4" /> Choose from gallery
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Let&apos;s set up your profile</p>
            <p className="mt-1 text-sm text-muted-foreground">We&apos;ll use this to personalize scans and routines.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleProfileSave}>
          <Input
            value={profile.full_name}
            onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Full name"
          />
          <Input
            type="date"
            value={profile.date_of_birth ?? ""}
            onChange={(event) => setProfile((current) => ({ ...current, date_of_birth: event.target.value || null }))}
          />


          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "other", label: "Other" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setProfile((current) => ({ ...current, gender: item.value as ProfileFormInput["gender"] }))}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                  profile.gender === item.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={profile.skin_type}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                skin_type: event.target.value as ProfileFormInput["skin_type"],
              }))
            }
            className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {skinTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.value === "na" || type.value === "other" ? type.label : `${type.label} skin`}
              </option>
            ))}
          </select>

          <select
            value={profile.primary_concern}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                primary_concern: event.target.value as ProfileFormInput["primary_concern"],
              }))
            }
            className="h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {concernOptions.map((concern) => (
              <option key={concern.value} value={concern.value}>
                Main concern: {concern.label}
              </option>
            ))}
          </select>

          <div className="space-y-3 rounded-[24px] border border-border/70 bg-secondary/30 p-4">
            <p className="text-sm font-medium text-foreground">Skin goals</p>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => {
                const active = profile.skin_goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProfile((current) => ({ ...current, preferred_language: "en" }))}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                profile.preferred_language === "en"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setProfile((current) => ({ ...current, preferred_language: "hi" }))}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                profile.preferred_language === "hi"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              Hindi
            </button>
          </div>

          <Textarea
            value={`Goals: ${profile.skin_goals.join(", ")}\nConcern: ${concernOptions.find((item) => item.value === profile.primary_concern)?.label ?? "Dark Spots"}`}
            readOnly
            className="min-h-[88px] rounded-2xl border-border/70 bg-secondary/30 text-sm text-muted-foreground"
          />

          {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

          <Button size="lg" type="submit" disabled={loading} className="h-12 w-full rounded-2xl">
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </form>
      </DeviceFrame>
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-black">
            <video ref={videoRef} playsInline muted className="h-[60vh] w-full object-cover" />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center text-sm text-white">
                {cameraError}
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-6">
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-full bg-white/10 px-5 py-2 text-sm text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!!cameraError}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-50"
              aria-label="Capture"
            >
              <span className="h-12 w-12 rounded-full border-4 border-primary" />
            </button>
            <div className="w-[74px]" />
          </div>
        </div>
      )}
      </>
    );
  }

  if (screen === "success") {
    return (
      <DeviceFrame>
        <div className="pt-10 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <CheckCircle2 className="h-14 w-14" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold text-foreground">Welcome to Skin Pop!</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your account is ready. We&apos;re preparing your personalized dashboard now.
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-[28px] border border-border/70 bg-secondary/40 p-5">
          {[
            "Scan your skin with guided capture",
            "Discover routines tailored to your profile",
            "Track your progress over time",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-left">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                <ChevronRight className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame
      title={authMode === "signup" ? "Sign Up" : "Welcome Back"}
      leftSlot={
        <button className="icon-button" onClick={() => setScreen("welcome")} aria-label="Back to welcome">
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
      footer={
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-6 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
        </div>
      }
    >
      <div className="mb-6 rounded-[28px] bg-gradient-card px-5 py-6 text-center">
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          {authMode === "signup" ? "Create your account" : "Sign in to continue"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Real analysis starts with a profile that understands your skin.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 w-full rounded-2xl border-border bg-card"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>Email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/35 p-1">
        {(["signup", "login"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setAuthMode(mode);
              setError(null);
            }}
            className={cn(
              "rounded-[14px] px-3 py-2 text-sm font-medium transition-colors",
              authMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {mode === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleEmailAuth}>
        {authMode === "signup" ? (
          <Input
            value={credentials.fullName}
            onChange={(event) =>
              setCredentials((current) => ({ ...current, fullName: event.target.value }))
            }
            placeholder="Full name"
            autoComplete="name"
          />
        ) : null}
        <Input
          type="email"
          value={credentials.email}
          onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
          placeholder="Email address"
          autoComplete="email"
          required
        />
        <Input
          type="password"
          value={credentials.password}
          onChange={(event) =>
            setCredentials((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="Password"
          autoComplete={authMode === "signup" ? "new-password" : "current-password"}
          required
        />

        {authMode === "signup" ? (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-secondary/35 p-4">
            {passwordHints.map((hint) => (
              <div key={hint.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", hint.ok ? "bg-sage" : "bg-border")} />
                <span>{hint.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

        <Button type="submit" size="lg" disabled={loading} className="h-12 w-full rounded-2xl">
          {loading
            ? "Please wait..."
            : authMode === "signup"
              ? "Create Account"
              : "Login"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        By continuing, you agree to our terms and privacy policy. <Link to="/" className="font-semibold text-primary">Back to home</Link>
      </p>
    </DeviceFrame>
  );
}
