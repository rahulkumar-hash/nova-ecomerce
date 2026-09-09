import React, { useState, useEffect, useRef } from "react";

export default function ImageGallery({ images = [], thumbnail = "" }) {
  const safeImages = Array.isArray(images) && images.length > 0 
    ? images 
    : [thumbnail || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];

  const [activeImage, setActiveImage] = useState(safeImages[0]);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef(null);

  useEffect(() => {
    if (safeImages.length > 0) {
      setActiveImage(safeImages[0]);
    }
  }, [images, thumbnail]);

  // Automatic slideshow when multiple images are available
  useEffect(() => {
    if (safeImages.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveImage((current) => {
        const index = safeImages.indexOf(current);
        const nextIndex = index >= 0 ? (index + 1) % safeImages.length : 0;
        return safeImages[nextIndex];
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [safeImages, isPaused]);

  const handleManualSelect = (img) => {
    setActiveImage(img);
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
  };

  return (
    <div 
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => {
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
      }}
    >
      {/* Main Large Zoom Preview */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm group">
        <img
          key={activeImage}
          src={activeImage}
          alt="Product Detail"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500 cursor-zoom-in animate-in fade-in"
        />

        {/* Slideshow Progress Dots */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
            {safeImages.map((img, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImage === img ? "w-5 bg-primary shadow-sm" : "w-1.5 bg-white/70 dark:bg-slate-900/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleManualSelect(img)}
              className={"w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 dark:bg-slate-800 cursor-pointer " + (activeImage === img ? "border-primary shadow-md scale-105" : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100")}
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
