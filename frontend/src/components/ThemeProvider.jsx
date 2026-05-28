import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "synaptra-theme";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  const effective =
    theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
  root.classList.toggle("dark", effective === "dark");
  root.style.colorScheme = effective;
};

export const ThemeProvider = ({ children, defaultTheme = "system" }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return defaultTheme;
    return localStorage.getItem(STORAGE_KEY) || defaultTheme;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next) => setThemeState(next), []);
  const cycleTheme = useCallback(() => {
    setThemeState((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
