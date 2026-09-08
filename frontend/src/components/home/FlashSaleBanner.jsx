import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ArrowRight } from "lucide-react";

export default function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (n) => (n < 10 ? "0" + n : n);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-4 sm:p-8 text-white shadow-xl border border-indigo-500/20 w-full max-w-full">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 text-center md:text-left min-w-0 w-full md:w-auto">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
            <Zap size={22} className="sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5">
              <Clock size={11} /> Limited Time Event
            </div>
            <h3 className="text-base sm:text-2xl font-black tracking-tight truncate">Super Mega Flash Deals</h3>
            <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">Grab up to 50% discount on top electronic & fashion gear</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono">
            <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-center min-w-[38px] sm:min-w-[48px]">
              <span className="text-base sm:text-xl font-black block">{format(timeLeft.hours)}</span>
              <span className="text-[9px] sm:text-xs text-slate-300 uppercase">Hours</span>
            </div>
            <span className="text-base sm:text-xl font-bold text-amber-400">:</span>
            <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-center min-w-[38px] sm:min-w-[48px]">
              <span className="text-base sm:text-xl font-black block">{format(timeLeft.minutes)}</span>
              <span className="text-[9px] sm:text-xs text-slate-300 uppercase">Mins</span>
            </div>
            <span className="text-base sm:text-xl font-bold text-amber-400">:</span>
            <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-center min-w-[38px] sm:min-w-[48px]">
              <span className="text-base sm:text-xl font-black block text-amber-400">{format(timeLeft.seconds)}</span>
              <span className="text-[9px] sm:text-xs text-slate-300 uppercase">Secs</span>
            </div>
          </div>

          <Link
            to="/shop?sort=popular"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold bg-white text-slate-900 shadow-md hover:bg-amber-400 transition-colors shrink-0"
          >
            <span>Shop Deals</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
