import React, { useState, useEffect } from "react";
import { Download, X, Sparkles, Smartphone, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function MobileInstallBanner() {
  const { settings } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA or native Android app
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         window.navigator.standalone || 
                         navigator.userAgent.includes("NovaStoreAndroidApp");
    if (isStandalone) {
      return; // Already in app, don't show prompt
    }

    // 2. Check if user dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem("install_banner_dismissed");
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Listen for browser's beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 4. For mobile browsers that don't emit beforeinstallprompt (or before it fires),
    // detect mobile user agent and show banner after 2.5 seconds
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (isMobile && !isStandalone) {
        setShowBanner(true);
      }
    }, 2500);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } else {
      // Fallback: Direct APK download
      const link = document.createElement("a");
      link.href = "/NovaStore.apk";
      link.download = "NovaStore.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("install_banner_dismissed", Date.now().toString());
  };

  if (!showBanner || installed) return null;

  const appName = settings?.storeName || "Spezx";

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 flex items-center gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-primary/30 shrink-0">
          <Sparkles size={22} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {appName} App
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              Fast
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Install for fast shopping & deals
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
