import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AdminCopilotModal from "../ai/AdminCopilotModal";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19] relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCopilot={() => setCopilotOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#0b0f19]">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Copilot Trigger FAB */}
      <button
        onClick={() => setCopilotOpen(true)}
        title="Open Admin AI Copilot (Ctrl + K)"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary to-cyan-500 text-white shadow-[0_10px_30px_-5px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 cursor-pointer group"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b0f19] animate-pulse" />
        </div>
        <span className="hidden sm:inline text-xs font-bold tracking-tight pr-1">Copilot</span>
      </button>

      {/* Global Admin AI Copilot Modal */}
      <AdminCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}
