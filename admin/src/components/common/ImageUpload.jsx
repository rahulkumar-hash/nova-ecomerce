import React, { useState } from "react";
import { UploadCloud, Link as LinkIcon, Trash2, CheckCircle2 } from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function ImageUpload({ value, onChange, label = "Upload Image" }) {
  const [mode, setMode] = useState("url"); // 'url' or 'file'
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await adminApi.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success && res.data?.url) {
        onChange(res.data.url);
        toast.success("Image uploaded successfully");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/8 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "url" ? "bg-white/15 text-white font-medium" : "text-slate-400"
            }`}
          >
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "file" ? "bg-white/15 text-white font-medium" : "text-slate-400"
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div className="relative">
          <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/... or paste image URL"
            className="w-full pl-9 pr-4 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-colors bg-white/2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <UploadCloud size={24} className="text-indigo-400 animate-bounce" />
            <span className="text-xs font-medium text-slate-300">
              {uploading ? "Uploading file to server..." : "Click or drag image file here"}
            </span>
            <span className="text-[10px] text-slate-500">Supports PNG, JPG, WEBP up to 10MB</span>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/15 group mt-2">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
