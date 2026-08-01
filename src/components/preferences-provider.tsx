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

    // Set Google Translate cookie to auto-translate the whole page
    const cookieString = code === "en" ? "/en/en" : `/en/${code}`;
    
    const currentCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
    const currentCookieValue = currentCookie ? decodeURIComponent(currentCookie.split('=')[1]) : null;

    // If the cookie needs updating to match preferences, update it and reload
    if (currentCookieValue !== cookieString) {
      // Guard against infinite reload loops
      if (sessionStorage.getItem('googtrans_reload') === cookieString) {
        console.error("Breaking infinite reload loop for Google Translate");
      } else {
        sessionStorage.setItem('googtrans_reload', cookieString);
        
        // Clear old cookie formats first
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        
        // Set new cookie
        document.cookie = `googtrans=${cookieString}; path=/;`;
        document.cookie = `googtrans=${cookieString}; path=/; domain=.${window.location.hostname};`;
        
        window.location.reload();
        return; // Stop execution while reloading
      }
    }
    
    // Clear the reload lock if we're in a stable state
    sessionStorage.removeItem('googtrans_reload');
      // If we don't need a reload, it means the cookie is correct. 
      // Now inject the Google Translate script if it's not already there.
      if (!window.document.getElementById('google-translate-script')) {
        (window as any).googleTranslateElementInit = () => {
          if ((window as any).google && (window as any).google.translate) {
            new (window as any).google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
          }
        };
        const script = window.document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        window.document.body.appendChild(script);
      }
    }
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
