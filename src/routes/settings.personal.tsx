import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, X } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, saveMyProfile, type ProfileFormInput } from "@/lib/profiles.functions";

export const Route = createFileRoute("/settings/personal")({
  component: PersonalInfoPage,
});

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive", "other", "na"] as const;
const GENDERS = ["female", "male", "other"] as const;
const CONCERNS = ["acne", "dark_spots", "pigmentation", "pores", "texture", "fine_lines", "dullness", "redness"] as const;
const SUGGESTED_GOALS = ["Clear Skin", "Hydration", "Anti-Aging", "Even Tone", "Glow", "Reduce Acne"];

function PersonalInfoPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(saveMyProfile);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState<ProfileFormInput>({
    full_name: "",
    date_of_birth: "1995-05-12",
    gender: "female",
    skin_type: "combination",
    primary_concern: "acne",
    skin_goals: [],
    preferred_language: "en",
    onboarding_completed: true,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setPhone((data.user?.phone as string) ?? "");
    });
    void fetchProfile()
      .then((p) => {
        if (!p) return;
        const r = p as Partial<ProfileFormInput> & { full_name: string | null };
        setForm((f) => ({
          ...f,
          full_name: r.full_name ?? "",
          date_of_birth: (r.date_of_birth as string) ?? f.date_of_birth,
          gender: (r.gender as ProfileFormInput["gender"]) ?? f.gender,
          skin_type: (r.skin_type as ProfileFormInput["skin_type"]) ?? f.skin_type,
          primary_concern: (r.primary_concern as ProfileFormInput["primary_concern"]) ?? f.primary_concern,
          skin_goals: (r.skin_goals as string[]) ?? [],
          preferred_language: (r.preferred_language as ProfileFormInput["preferred_language"]) ?? f.preferred_language,
        }));
      })
      .catch(() => {});
  }, [fetchProfile]);

  function toggleGoal(g: string) {
    setForm((f) => {
      const has = f.skin_goals.includes(g);
      return { ...f, skin_goals: has ? f.skin_goals.filter((x) => x !== g) : [...f.skin_goals, g].slice(0, 5) };
    });
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      await save({ data: form });
      
      if (phone !== undefined) {
        const { error: phoneError } = await supabase.auth.updateUser({ phone: phone || undefined });
        if (phoneError) {
          console.error("Phone update error:", phoneError);
          // Don't throw if it's a provider issue, just let them know the profile saved
          if (phoneError.message.includes("provider not configured") || phoneError.message.includes("Twilio")) {
            setMsg("Profile saved, but phone number requires SMS setup in Supabase.");
            return;
          } else {
             throw phoneError;
          }
        }
      }

      setMsg("Saved successfully");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DeviceFrame
      title="Personal Information"
      leftSlot={
        <button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
          {(form.full_name || "U").trim().charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Field label="Full Name">
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input value={email} readOnly className="bg-secondary/40" />
        </Field>
        <Field label="Phone Number">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Date of Birth">
          <input
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value || null })}

            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Gender</p>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => {
              const active = form.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`h-11 rounded-xl border text-sm font-medium capitalize ${active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"}`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Skin Type">
          <select
            value={form.skin_type}
            onChange={(e) => setForm({ ...form, skin_type: e.target.value as ProfileFormInput["skin_type"] })}
            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm capitalize"
          >
            {SKIN_TYPES.map((t) => <option key={t} value={t}>{t === "na" ? "N/A" : t}</option>)}
          </select>
        </Field>

        <Field label="Primary Concern">
          <select
            value={form.primary_concern}
            onChange={(e) => setForm({ ...form, primary_concern: e.target.value as ProfileFormInput["primary_concern"] })}
            className="h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm capitalize"
          >
            {CONCERNS.map((c) => <option key={c} value={c}>{c.replaceAll("_", " ")}</option>)}
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Skin Goals (up to 5)</p>
          <div className="flex flex-wrap gap-2">
            {form.skin_goals.map((g) => (
              <span key={g} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {g}
                <button type="button" onClick={() => toggleGoal(g)}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {SUGGESTED_GOALS.filter((g) => !form.skin_goals.includes(g)).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                className="rounded-full border border-dashed border-border/70 px-3 py-1 text-xs text-muted-foreground"
              >
                + {g}
              </button>
            ))}
          </div>
        </div>

        {msg && <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">{msg}</p>}

        <Button size="lg" className="h-12 w-full rounded-2xl" disabled={saving || form.full_name.trim().length < 2} onClick={onSave}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </DeviceFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
