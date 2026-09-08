import React, { useState, useEffect } from "react";

export default function ImageGallery({ images = [], thumbnail = "" }) {
  const safeImages = Array.isArray(images) && images.length > 0 
    ? images 
    : [thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];

  const [activeImage, setActiveImage] = useState(safeImages[0]);

  useEffect(() => {
    if (safeImages.length > 0) {
      setActiveImage(safeImages[0]);
    }
  }, [images, thumbnail]);

  return (
    <div className="space-y-4">
      {/* Main Large Zoom Preview */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm group">
        <img
          src={activeImage}
          alt="Product Detail"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
        />
      </div>

      {/* Thumbnails Row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImage(img)}
              className={"w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 dark:bg-slate-800 " + (activeImage === img ? "border-primary shadow-md scale-105" : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100")}
            >
              <img
                src={img}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200";
                }}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
