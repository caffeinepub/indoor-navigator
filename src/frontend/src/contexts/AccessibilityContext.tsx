import { createContext, useContext, useEffect, useState } from "react";

type FontSize = "normal" | "large" | "xlarge";

interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderHints: boolean;
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setFontSize: (size: FontSize) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setScreenReaderHints: (v: boolean) => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  reduceMotion: false,
  screenReaderHints: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue>({
  ...defaultSettings,
  setFontSize: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setScreenReaderHints: () => {},
});

export function AccessibilityProvider({
  children,
}: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const raw = localStorage.getItem("indoor-nav-accessibility");
      if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {}
    return defaultSettings;
  });

  // Apply classes to html element
  useEffect(() => {
    const root = document.documentElement;
    // Font size
    root.classList.remove("text-base", "text-lg", "text-xl");
    if (settings.fontSize === "large") root.classList.add("text-lg");
    else if (settings.fontSize === "xlarge") root.classList.add("text-xl");
    else root.classList.add("text-base");
    // High contrast
    if (settings.highContrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");
    // Reduce motion
    if (settings.reduceMotion) root.classList.add("reduce-motion");
    else root.classList.remove("reduce-motion");
  }, [settings]);

  // Persist
  useEffect(() => {
    localStorage.setItem("indoor-nav-accessibility", JSON.stringify(settings));
  }, [settings]);

  const setFontSize = (fontSize: FontSize) =>
    setSettings((prev) => ({ ...prev, fontSize }));
  const setHighContrast = (highContrast: boolean) =>
    setSettings((prev) => ({ ...prev, highContrast }));
  const setReduceMotion = (reduceMotion: boolean) =>
    setSettings((prev) => ({ ...prev, reduceMotion }));
  const setScreenReaderHints = (screenReaderHints: boolean) =>
    setSettings((prev) => ({ ...prev, screenReaderHints }));

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setFontSize,
        setHighContrast,
        setReduceMotion,
        setScreenReaderHints,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
