import React, { createContext, useContext, useEffect, useState } from "react";

export type Prefs = {
  units: "metric" | "imperial";
  language: string;
  theme: "light" | "dark" | "system";
  useSystem: boolean;
  audience: "everyone" | "adults" | "teens";
};

const DEFAULTS: Prefs = {
  units: "metric",
  language: "English",
  theme: "light",
  useSystem: true,
  audience: "everyone",
};

const STORAGE_KEY = "skinpop.settings.preferences";

type PreferencesContextType = {
  preferences: Prefs;
  updatePreference: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Prefs>(DEFAULTS);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreferences({ ...DEFAULTS, ...JSON.parse(raw) });
      }
    } catch {}
  }, []);

  // Update logic
  const updatePreference = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [k]: v };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Side-effects for Theme
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    root.classList.remove("light", "dark");

    const applyTheme = () => {
      let isDark = false;
      
      if (preferences.useSystem || preferences.theme === "system") {
        isDark = mediaQuery.matches;
      } else {
        isDark = preferences.theme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();

    const handleChange = () => applyTheme();
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences.theme, preferences.useSystem]);

  // Side-effects for Language
  useEffect(() => {
    const root = window.document.documentElement;
    const langMap: Record<string, string> = {
      "English": "en",
      "हिन्दी": "hi",
      "Español": "es",
      "Français": "fr",
    };
    const code = langMap[preferences.language] || "en";
    root.lang = code;
  }, [preferences.language]);

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
