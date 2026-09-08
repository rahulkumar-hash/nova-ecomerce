import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useAdminTheme, THEME_PRESETS } from "../../context/AdminThemeContext";

export default function ThemeSettings() {
  const { theme, updateTheme } = useAdminTheme();
  const [customPrimary, setCustomPrimary] = useState(theme?.primaryColor || "#6366f1");
  const [customHover, setCustomHover] = useState(theme?.primaryHover || "#4f46e5");
  const [customLight, setCustomLight] = useState(theme?.primaryLight || "#e0e7ff");
  const [selectedPreset, setSelectedPreset] = useState(theme?.preset || "indigo");

  const handleSelectPreset = async (preset) => {
    setSelectedPreset(preset.id);
    setCustomPrimary(preset.primary);
    setCustomHover(preset.hover);
    setCustomLight(preset.light);

    await updateTheme({
      primaryColor: preset.primary,
      primaryHover: preset.hover,
      primaryLight: preset.light,
      preset: preset.id,
    });
  };

  const handleCustomSave = async () => {
    setSelectedPreset("custom");
    await updateTheme({
      primaryColor: customPrimary,
      primaryHover: customHover,
      primaryLight: customLight,
      preset: "custom",
    });
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Dynamic Color Theme Engine</h2>
        <p className="text-xs text-slate-400">
          Personalize the brand color palette across both the Admin Panel and the Customer Storefront in real-time
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span>Curated Brand Presets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={"p-4 rounded-2xl border text-left transition-all relative overflow-hidden group " + (isSelected ? "border-white/30 bg-white/10 shadow-lg scale-102" : "border-white/6 bg-white/2 hover:bg-white/5")}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-white">{preset.name}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl shadow-md" style={{ backgroundColor: preset.primary }} />
                  <span className="w-6 h-6 rounded-lg opacity-80" style={{ backgroundColor: preset.hover }} />
                  <span className="w-6 h-6 rounded-lg opacity-80" style={{ backgroundColor: preset.light }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
        <h3 className="text-sm font-bold text-white">Custom Brand Hex Values</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Hover Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customHover}
                onChange={(e) => setCustomHover(e.target.value)}
                className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={customHover}
                onChange={(e) => setCustomHover(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Light Tint</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customLight}
                onChange={(e) => setCustomLight(e.target.value)}
                className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={customLight}
                onChange={(e) => setCustomLight(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCustomSave}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
          style={{ backgroundColor: customPrimary }}
        >
          Apply & Save Custom Palette
        </button>
      </div>
    </div>
  );
}
