import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function MobileInstallBanner() {
  const { settings } = useTheme();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // If already inside the native Android app, NEVER show the install banner!
    if (navigator.userAgent.includes("NovaStoreAndroidApp")) {
      return;
    }

    // Check if dismissed in the last 24 hours
    const dismissedAt = localStorage.getItem("apk_banner_dismissed");
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect mobile device
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDownloadApk = () => {
    // Download the official native Android APK directly!
    const link = document.createElement("a");
    link.href = "/NovaStore.apk";
    link.download = "NovaStore.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("apk_banner_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  const appName = settings?.storeName || "Spezx";

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0E162A]/95 text-white backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-3.5 flex items-center gap-3">
        {/* App Icon */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-primary/30 shrink-0">
          <Sparkles size={20} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white truncate">
              {appName} App
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full">
              Official
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate">
            Fast shopping, orders & tracking
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadApk}
            className="px-3 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
