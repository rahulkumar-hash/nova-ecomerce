import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Bell,
  Palette,
  LogOut,
  User,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { useAdminTheme } from "../../context/AdminThemeContext";

export default function Topbar({ onOpenSidebar, onOpenCopilot }) {
  const { admin, logout } = useAdminAuthStore();
  const { settings, theme } = useAdminTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-[#0d111d]/90 backdrop-blur-md border-b border-white/8 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <span className="text-xs font-bold text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{settings?.storeName || "NovaStore"}</span>
          </span>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
            Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-primary/20 to-cyan-500/20 hover:from-indigo-500/30 hover:to-cyan-500/30 border border-primary/30 text-xs font-semibold text-white transition-all shadow-sm hover:shadow-primary/10 cursor-pointer group"
          title="Open Admin AI Copilot (Ctrl + K)"
        >
          <Sparkles size={14} className="text-primary group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="hidden md:inline text-[10px] bg-black/40 text-slate-400 px-1.5 py-0.5 rounded-md border border-white/10 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Dynamic Color Theme Pill */}
        <Link
          to="/theme"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-all"
        >
          <span
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: theme?.primaryColor || "#6366f1" }}
          />
          <span className="hidden md:inline">Theme:</span>
          <span className="font-semibold text-white capitalize">
            {theme?.preset || "Custom"}
          </span>
        </Link>

        {/* View Live Store */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all shadow-md"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <span>Live Store</span>
          <ExternalLink size={13} />
        </a>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
          >
            <img
              src={
                admin?.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              }
              alt="Admin"
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/10"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-white leading-tight">{admin?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-400 capitalize">{admin?.role || "Super Admin"}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141a29] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/6 mb-1">
                  <p className="text-xs font-bold text-white truncate">{admin?.name || "Administrator"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white bg-white/5 hover:bg-white/10 font-semibold transition-colors mb-1"
                >
                  <User size={14} className="text-primary" />
                  <span>My Profile & Security</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <Settings size={14} />
                  <span>Store Configurations</span>
                </Link>

                <Link
                  to="/theme"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <Palette size={14} />
                  <span>Color Theme Engine</span>
                </Link>

                <div className="my-1 border-t border-white/6" />
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
