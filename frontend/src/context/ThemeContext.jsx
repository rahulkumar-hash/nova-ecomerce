import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem("storeSettings");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);
  
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("themeMode");
      if (saved !== null) return saved === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  // Apply theme mode class to DOM and persist to localStorage immediately
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("themeMode", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("themeMode", "light");
    }

    try {
      if (window.Android && window.Android.onThemeChanged) {
        const primary = window.getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#6366F1';
        window.Android.onThemeChanged(isDark, primary);
      }
    } catch (e) {}
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add("dark");
        localStorage.setItem("themeMode", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("themeMode", "light");
      }
      return next;
    });
  };

  const applyThemeVariables = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    const primary = theme?.primaryColor || "#6366f1";
    const primaryHover = theme?.primaryHover || "#4f46e5";
    const primaryLight = theme?.primaryLight || "#e0e7ff";
    const secondary = theme?.secondaryColor || "#06b6d4";
    const accent = theme?.accentColor || "#f59e0b";

    root.style.setProperty("--color-primary", primary);
    root.style.setProperty("--color-primary-hover", primaryHover);
    root.style.setProperty("--color-primary-light", primaryLight);
    root.style.setProperty("--color-secondary", secondary);
    root.style.setProperty("--color-accent", accent);

    try {
      localStorage.setItem("storeTheme", JSON.stringify(theme));
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.success && res.data) {
        setSettings(res.data);
        applyThemeVariables(res.data.theme);
        try {
          localStorage.setItem("storeSettings", JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load store theme settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply cached theme on initial mount
    try {
      const cachedTheme = localStorage.getItem("storeTheme");
      if (cachedTheme) {
        applyThemeVariables(JSON.parse(cachedTheme));
      }
    } catch (e) {}
    
    fetchSettings();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        settings,
        theme: settings?.theme,
        currency: settings?.currency || { symbol: "₹", code: "INR" },
        shipping: settings?.shipping || { freeShippingThreshold: 999, standardShippingFee: 49, expressShippingFee: 119 },
        tax: settings?.tax || { taxPercentage: 5 },
        announcementBar: settings?.announcementBar,
        isDark,
        toggleDarkMode,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
