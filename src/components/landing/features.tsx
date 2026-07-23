import { ScanFace, Sparkles, Beaker, Clock, Camera, HeartPulse, Droplets, Sun } from "lucide-react";

const steps = [
  { n: "01", title: "Scan", desc: "Snap a selfie in natural light. Our AI maps 40,000+ points across your face in seconds." },
  { n: "02", title: "Analyze", desc: "Detect fine lines, hyperpigmentation, acne, pores and texture issues with clinical precision." },
  { n: "03", title: "Evolve", desc: "Get a dynamic routine that adapts as your skin improves — week by week, season by season." },
];

const features = [
  { icon: ScanFace,   title: "40+ Concerns",     desc: "From sebum to sun damage — see what the naked eye misses." },
  { icon: Clock,      title: "Skin Age Predict", desc: "Understand your skin's biological age and slow the clock." },
  { icon: Beaker,     title: "Ingredient Radar", desc: "Scan any product label to check compatibility with your profile." },
  { icon: HeartPulse, title: "Smart Routine",    desc: "Adapts to weather, cycle, and stress — every single day." },
  { icon: Camera,     title: "Progress Diary",   desc: "Track your skin's transformation with side-by-side scans." },
  { icon: Droplets,   title: "Hydration Score",  desc: "Real-time surface moisture and barrier health analysis." },
  { icon: Sun,        title: "UV & Pollution",   desc: "Local alerts so you protect your skin before it reacts." },
  { icon: Sparkles,   title: "Expert Access",    desc: "Book a certified dermatologist right inside the app." },
];

export function Features() {
  return (
    <>
      <section id="how" className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">How it works</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Three steps to your best skin yet.
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="space-y-4">
                <span className="block text-5xl font-semibold text-primary">{s.n}</span>
                <h3 className="text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">The science inside</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Deep analysis for every skin story.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
