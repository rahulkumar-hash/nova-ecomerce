import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { useAdminTheme } from "../../context/AdminThemeContext";
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Server
} from "lucide-react";

export default function Login() {
  const { login } = useAdminAuthStore();
  const { settings } = useAdminTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  const storeName = settings?.storeName || "NovaStore";

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#070a14] text-slate-100 flex flex-col lg:flex-row relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient Radial Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: "var(--color-primary, #6366f1)" }}
      />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none bg-cyan-600/15" />

      {/* LEFT SIDE: Visual Brand & Metrics (Fixed 100vh, No Scroll) */}
      <div className="relative flex-1 lg:w-[54%] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/6 z-10 bg-linear-to-br from-[#0b1022]/85 via-[#070b17]/90 to-[#040711] overflow-hidden">
        {/* Dot Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header Row */}
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={storeName} 
                className="h-8 w-auto object-contain max-w-30" 
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/15"
                style={{ backgroundColor: "var(--color-primary, #6366f1)" }}
              >
                <Sparkles size={18} className="text-white" />
              </div>
            )}
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-tight">
                {storeName}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                Admin Control Suite
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">v2.4 LTS</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">Cloud Active</span>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative my-auto py-4 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold">
            <Zap size={13} className="text-indigo-400" />
            <span>Unified Commerce Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15]">
            Orchestrate your store with{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-sky-300 to-teal-300">
              precision & speed.
            </span>
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Real-time catalog control, live order fulfillment telemetry, automated inventory dispatch, and revenue analytics in one unified interface.
          </p>

          {/* Compact Glass Metrics Pill Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={13} />
                </div>
                <span className="text-[11px] font-bold text-white">Live Store Velocity</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold font-mono">
                +28.4% This Week
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white/2.5 border border-white/5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Orders</p>
                <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">1,482</p>
                <span className="text-[9px] text-emerald-400 font-semibold">98.6% Delivered</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/2.5 border border-white/5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Gross Sales</p>
                <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">₹14.8L</p>
                <span className="text-[9px] text-indigo-400 font-semibold">Active Cycle</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/2.5 border border-white/5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Stock Health</p>
                <p className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">Optimal</p>
                <span className="text-[9px] text-slate-400 font-semibold">Auto-Sync ON</span>
              </div>
            </div>
          </div>

          {/* Feature Badges Row */}
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> Granular Access Control
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> SMTP Notifications
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/6 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" /> Razorpay Secured
            </span>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="relative pt-3 border-t border-white/6 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server size={12} className="text-indigo-400" />
            <span>MongoDB Atlas Cluster • <strong className="text-emerald-400 font-medium">Connected</strong></span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">256-bit TLS Encrypted</span>
        </div>
      </div>

      {/* RIGHT SIDE: Compact Authentication Console (Fixed 100vh, No Scroll) */}
      <div className="relative flex-1 lg:w-[46%] p-6 sm:p-8 lg:p-10 flex items-center justify-center z-10 bg-[#070b16]/95 backdrop-blur-2xl overflow-hidden">
        <div className="w-full max-w-sm space-y-4">
          {/* Header Title */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
              <Lock size={11} className="text-indigo-400" />
              <span>Admin Authentication</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sign In to Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your master administrator credentials to access management controls.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <Mail 
                  size={15} 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ecomstore.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock 
                  size={15} 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Keep session active</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #4338ca 100%)",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Control Center</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge & Storefront Link */}
          <div className="pt-3 border-t border-white/6 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
              <span>End-to-End Encrypted Session • Rate-limit Active</span>
            </div>

            <div className="text-center">
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
              >
                <ShoppingBag size={13} />
                <span>Return to Customer Storefront</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
