import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const getOptimizedBanner = (url, width = 800) => {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, "q=75");
  }
  return url;
};

export default function HeroSlider({ banners = [] }) {
  const safeBanners = Array.isArray(banners) ? banners : [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (safeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % safeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [safeBanners.length]);

  if (safeBanners.length === 0) {
    return (
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-900 h-[320px] sm:h-[420px] md:h-[480px] animate-pulse" />
    );
  }

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-900 group">
      {/* Slider Viewport */}
      <div className="relative h-[320px] sm:h-[420px] md:h-[480px] w-full">
        {safeBanners.map((slide, idx) => (
          <div
            key={slide._id || idx}
            className={"absolute inset-0 transition-opacity duration-700 ease-in-out " + (idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}
          >
            {/* Background Image with Overlay (Responsive <picture> for mobile vs desktop) */}
            {idx === 0 ? (
              <picture className="w-full h-full block">
                <source
                  media="(max-width: 640px)"
                  srcSet="/images/hero-tech-mobile.webp"
                />
                <source
                  media="(min-width: 641px)"
                  srcSet="/images/hero-tech-desktop.webp"
                />
                <img
                  src="/images/hero-tech-desktop.webp"
                  alt={slide.title || "Featured Collection Banner"}
                  className="w-full h-full object-cover object-center"
                  width="1280"
                  height="480"
                  decoding="async"
                  fetchpriority="high"
                  loading="eager"
                />
              </picture>
            ) : (
              <picture className="w-full h-full block">
                <source
                  media="(max-width: 640px)"
                  srcSet={getOptimizedBanner(slide.image, 480)}
                />
                <source
                  media="(min-width: 641px)"
                  srcSet={getOptimizedBanner(slide.image, 1280)}
                />
                <img
                  src={getOptimizedBanner(slide.image, 1280)}
                  alt={slide.title || "Featured Collection Banner"}
                  className="w-full h-full object-cover object-center"
                  width="1280"
                  height="480"
                  decoding="async"
                  fetchpriority="low"
                  loading="lazy"
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />

            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center p-5 sm:p-10 md:p-14 max-w-xl">
              <div className="space-y-3 sm:space-y-4 text-white">
                {slide.tag && (
                  <span
                    className="inline-block px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-white bg-slate-950/80 border border-white/20 shadow-md backdrop-blur-xs"
                  >
                    {slide.tag}
                  </span>
                )}
                <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-md leading-relaxed">
                    {slide.subtitle}
                  </p>
                )}
                <div className="pt-1 sm:pt-2">
                  <Link
                    to={slide.link || "/shop"}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{slide.buttonText || "Shop Collection"}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            aria-label="Previous banner slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            aria-label="Next banner slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5">
            {safeBanners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrent(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className="p-2 flex items-center justify-center cursor-pointer transition-transform"
              >
                <span className={"h-1.5 rounded-full transition-all block " + (dotIdx === current ? "w-5 bg-white shadow-sm" : "w-1.5 bg-white/50 hover:bg-white/80")} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
