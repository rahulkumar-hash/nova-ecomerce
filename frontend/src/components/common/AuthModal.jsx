import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useAuth();
  const { settings } = useTheme();

  const [tab, setTab] = useState("login"); // 'login' or 'register'
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("customer@ecomstore.com");
  const [password, setPassword] = useState("Customer@123456");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (tab === "login") {
      await login(email, password);
    } else {
      await register(name, email, password, phone);
    }
    setLoading(false);
  };

  const handleDemoFill = () => {
    setTab("login");
    setEmail("customer@ecomstore.com");
    setPassword("Customer@123456");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden border border-slate-100">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md mb-3"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Sparkles size={22} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {tab === "login" ? "Welcome Back" : "Join " + (settings?.storeName || "NovaStore")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === "login" ? "Sign in to manage orders & fast checkout" : "Create an account for seamless shopping"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            onClick={() => setTab("login")}
            className={"flex-1 py-2 rounded-xl text-xs font-bold transition-all " + (tab === "login" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("register")}
            className={"flex-1 py-2 rounded-xl text-xs font-bold transition-all " + (tab === "register" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
          >
            Create Account
          </button>
        </div>

        {/* Demo Fast Fill Button */}
        {tab === "login" && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-700">
              <span className="font-bold block text-indigo-900">Demo Customer:</span>
              <span className="font-mono text-slate-500">customer@ecomstore.com</span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Fill Demo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition-all mt-2"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === "login" ? "Sign In Now" : "Complete Registration"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
