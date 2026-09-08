import React, { useState } from "react";
import { UploadCloud, Link as LinkIcon, Trash2, CheckCircle2, Loader2, Camera } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ImageUpload({ value, onChange, label = "Profile Picture" }) {
  const [mode, setMode] = useState("file"); // 'file' or 'url'
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success && res.data?.url) {
        onChange(res.data.url);
        toast.success("Photo uploaded successfully! 📸");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2.5 py-0.5 rounded-md transition-all font-medium ${
              mode === "file"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-0.5 rounded-md transition-all font-medium ${
              mode === "url"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl p-4 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            {uploading ? (
              <>
                <Loader2 size={24} className="text-primary animate-spin" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Uploading to server...
                </span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <UploadCloud size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Click or drag photo here
                </span>
                <span className="text-[10px] text-slate-400">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      {/* Current Preview Thumbnail with Delete */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mt-2">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              Profile Photo Selected
            </p>
            <p className="text-[10px] text-slate-500 truncate font-mono">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Remove photo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
