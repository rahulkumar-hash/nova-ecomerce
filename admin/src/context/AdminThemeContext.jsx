import React, { createContext, useContext, useState, useEffect } from "react";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

const AdminThemeContext = createContext(null);

export const THEME_PRESETS = [
  { id: "indigo", name: "Astrosushil Indigo", primary: "#6366f1", hover: "#4f46e5", light: "#e0e7ff", bg: "from-indigo-600 to-indigo-800" },
  { id: "emerald", name: "Emerald Luxe", primary: "#10b981", hover: "#059669", light: "#d1fae5", bg: "from-emerald-600 to-emerald-800" },
  { id: "rose", name: "Ruby Crimson", primary: "#f43f5e", hover: "#e11d48", light: "#ffe4e6", bg: "from-rose-600 to-rose-800" },
  { id: "cyan", name: "Cyber Cyan", primary: "#06b6d4", hover: "#0891b2", light: "#cffafe", bg: "from-cyan-600 to-cyan-800" },
  { id: "amber", name: "Midnight Amber", primary: "#f59e0b", hover: "#d97706", light: "#fef3c7", bg: "from-amber-600 to-amber-800" },
  { id: "purple", name: "Imperial Purple", primary: "#8b5cf6", hover: "#7c3aed", light: "#ede9fe", bg: "from-purple-600 to-purple-800" },
];

export const AdminThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await adminApi.get("/settings");
      if (res.success && res.data) {
        setSettings(res.data);
        applyThemeVariables(res.data.theme);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const applyThemeVariables = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primaryColor || "#6366f1");
    root.style.setProperty("--color-primary-hover", theme.primaryHover || "#4f46e5");
    root.style.setProperty("--color-primary-light", theme.primaryLight || "#e0e7ff");
    root.style.setProperty("--color-secondary", theme.secondaryColor || "#06b6d4");
    root.style.setProperty("--color-accent", theme.accentColor || "#f59e0b");
    try {
      localStorage.setItem("adminStoreTheme", JSON.stringify(theme));
    } catch (e) {}
  };

  const updateTheme = async (newTheme) => {
    try {
      applyThemeVariables(newTheme);
      const res = await adminApi.put("/settings", { theme: newTheme });
      if (res.success) {
        setSettings(res.data);
        toast.success("Theme updated & saved across Storefront and Admin!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to save theme");
      return false;
    }
  };

  const updateStoreInfo = async (storeData) => {
    try {
      const res = await adminApi.put("/settings", storeData);
      if (res.success) {
        setSettings(res.data);
        if (storeData.theme) applyThemeVariables(storeData.theme);
        toast.success("Settings updated successfully!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to update settings");
      return false;
    }
  };

  return (
    <AdminThemeContext.Provider
      value={{
        settings,
        theme: settings?.theme,
        loading,
        updateTheme,
        updateStoreInfo,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => useContext(AdminThemeContext);
