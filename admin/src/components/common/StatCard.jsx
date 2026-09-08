import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = "indigo" }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl bg-[#131926] border border-white/8 p-5 shadow-lg group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-mono">{value}</h3>
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--color-primary)",
          }}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-[11px] text-slate-400">{trendLabel || "vs last month"}</span>
        </div>
      )}
    </motion.div>
  );
}
