
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Monitor, Moon, Sun } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { usePreferences, Prefs } from "@/components/preferences-provider";

export const Route = createFileRoute("/settings/preferences")({
  component: PreferencesPage,
});

const translations: Record<string, Record<string, string>> = {
  "English": {},
  "हिन्दी": {
    "Preferences": "प्राथमिकताएं",
    "Units": "इकाइयां",
    "Metric (cm, kg)": "मीट्रिक (सेमी, किग्रा)",
    "Imperial (in, lb)": "इम्पीरियल (इंच, पाउंड)",
    "Language": "भाषा",
    "App Language": "ऐप की भाषा",
    "Appearance": "दिखावट",
    "Light": "हल्का",
    "Dark": "गहरा",
    "System": "सिस्टम",
    "Use System Default": "सिस्टम डिफ़ॉल्ट का उपयोग करें",
    "Automatically switch based on your device settings": "डिवाइस सेटिंग्स के आधार पर स्वचालित रूप से बदलें",
    "Content Preferences": "सामग्री प्राथमिकताएं",
    "Content for": "इसके लिए सामग्री",
    "Everyone": "सभी के लिए",
    "Adults": "वयस्कों के लिए",
    "Teens": "किशोरों के लिए"
  },
  "Español": {
    "Preferences": "Preferencias",
    "Units": "Unidades",
    "Metric (cm, kg)": "Métrico (cm, kg)",
    "Imperial (in, lb)": "Imperial (in, lb)",
    "Language": "Idioma",
    "App Language": "Idioma de la aplicación",
    "Appearance": "Apariencia",
    "Light": "Claro",
    "Dark": "Oscuro",
    "System": "Sistema",
    "Use System Default": "Usar configuración del sistema",
    "Automatically switch based on your device settings": "Cambiar automáticamente según el dispositivo",
    "Content Preferences": "Preferencias de contenido",
    "Content for": "Contenido para",
    "Everyone": "Todos",
    "Adults": "Adultos",
    "Teens": "Adolescentes"
  },
  "Français": {
    "Preferences": "Préférences",
    "Units": "Unités",
    "Metric (cm, kg)": "Métrique (cm, kg)",
    "Imperial (in, lb)": "Impérial (in, lb)",
    "Language": "Langue",
    "App Language": "Langue de l'app",
    "Appearance": "Apparence",
    "Light": "Clair",
    "Dark": "Sombre",
    "System": "Système",
    "Use System Default": "Utiliser les paramètres du système",
    "Automatically switch based on your device settings": "Basculer automatiquement selon l'appareil",
    "Content Preferences": "Préférences de contenu",
    "Content for": "Contenu pour",
    "Everyone": "Tout le monde",
    "Adults": "Adultes",
    "Teens": "Adolescents"
  }
};

function PreferencesPage() {
  const navigate = useNavigate();
  const { preferences: p, updatePreference: update } = usePreferences();
  
  const t = (key: string) => translations[p.language]?.[key] || key;

  return (
    <DeviceFrame
      title={t("Preferences")}
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/settings" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <Group title={t("Units")}>
        <SelectRow
          label={t("Metric (cm, kg)")}
          selected={p.units === "metric"}
          onClick={() => update("units", "metric")}
        />
        <SelectRow
          label={t("Imperial (in, lb)")}
          selected={p.units === "imperial"}
          onClick={() => update("units", "imperial")}
        />
      </Group>

      <Group title={t("Language")}>
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 last:border-b-0">
          <span className="text-sm font-medium text-foreground">{t("App Language")}</span>
          <select
            value={p.language}
            onChange={(e) => update("language", e.target.value)}
            className="h-9 rounded-xl border border-border/70 bg-card px-3 text-sm"
          >
            {["English", "हिन्दी", "Español", "Français"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </Group>

      <Group title={t("Appearance")}>
        <div className="grid grid-cols-3 gap-2 p-3">
          {([
            { k: "light", label: t("Light"), icon: Sun },
            { k: "dark", label: t("Dark"), icon: Moon },
            { k: "system", label: t("System"), icon: Monitor },
          ] as const).map((tObj) => {
            const active = p.theme === tObj.k;
            const Icon = tObj.icon;
            return (
              <button
                key={tObj.k}
                type="button"
                onClick={() => {
                  update("theme", tObj.k);
                  if (tObj.k === "system") {
                    update("useSystem", true);
                  } else {
                    update("useSystem", false);
                  }
                }}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-4 text-xs font-medium ${active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {tObj.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("Use System Default")}</p>
            <p className="text-xs text-muted-foreground">{t("Automatically switch based on your device settings")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={p.useSystem}
            onClick={() => {
              const nextState = !p.useSystem;
              update("useSystem", nextState);
              if (nextState) {
                update("theme", "system");
              }
            }}
            className={`relative h-6 w-11 rounded-full transition ${p.useSystem ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${p.useSystem ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Group>

      <Group title={t("Content Preferences")}>
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 last:border-b-0">
          <span className="text-sm font-medium text-foreground">{t("Content for")}</span>
          <select
            value={p.audience}
            onChange={(e) => update("audience", e.target.value as Prefs["audience"])}
            className="h-9 rounded-xl border border-border/70 bg-card px-3 text-sm capitalize"
          >
            <option value="everyone">{t("Everyone")}</option>
            <option value="adults">{t("Adults")}</option>
            <option value="teens">{t("Teens")}</option>
          </select>
        </div>
      </Group>
    </DeviceFrame>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">{children}</div>
    </div>
  );
}

function SelectRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-border/60 px-4 py-3.5 text-left last:border-b-0"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
