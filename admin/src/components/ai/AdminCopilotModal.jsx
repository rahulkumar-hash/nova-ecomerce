import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Package,
  RotateCcw,
  Receipt,
  Tag,
  HelpCircle,
  Key,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const DEFAULT_WELCOME = {
  id: "welcome",
  sender: "ai",
  text: "👋 Hello! I am your **NovaStore Admin Copilot**.\n\nI can execute store operations directly for you: update stock, change prices, mark orders delivered, approve returns, create discount coupons, answer customer questions, or calculate your GST totals.",
  quickPills: true,
  timestamp: new Date().toISOString(),
};

export default function AdminCopilotModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("novastore_admin_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load chat history:", e);
    }
    return [DEFAULT_WELCOME];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ activeMode: "local", hasServerGeminiKey: false });
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem("admin_gemini_api_key") || "");

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-save chat history to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("novastore_admin_chat_history", JSON.stringify(messages.slice(-30)));
      }
    } catch (e) {
      console.warn("Failed to save chat history:", e);
    }
  }, [messages]);

  const handleClearHistory = () => {
    localStorage.removeItem("novastore_admin_chat_history");
    setMessages([DEFAULT_WELCOME]);
    toast.success("Chat history cleared");
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Fetch AI engine status on open
  useEffect(() => {
    if (isOpen) {
      adminApi
        .get("/admin/ai/status")
        .then((res) => {
          if (res?.data) {
            setAiStatus(res.data);
          }
        })
        .catch(() => {
          // Default to local engine
          setAiStatus({ activeMode: "local", hasServerGeminiKey: false });
        });
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveCustomKey = () => {
    const trimmed = customKey.trim();
    if (trimmed) {
      localStorage.setItem("admin_gemini_api_key", trimmed);
      toast.success("Gemini API Key saved for Copilot!");
      setAiStatus((prev) => ({ ...prev, activeMode: "gemini" }));
    } else {
      localStorage.removeItem("admin_gemini_api_key");
      toast("Reverted to Built-in Local Engine", { icon: "⚡" });
      setAiStatus((prev) => ({ ...prev, activeMode: "local" }));
    }
    setShowKeySettings(false);
  };

  const handleSendPrompt = async (promptText) => {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    setInput("");

    // Add user message to thread
    const userMsgId = Date.now().toString();
    const newMsgList = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text: textToSend,
        timestamp: new Date(),
      },
    ];
    setMessages(newMsgList);
    setLoading(true);

    try {
      const storedKey = localStorage.getItem("admin_gemini_api_key");
      const headers = storedKey ? { "x-gemini-key": storedKey } : {};

      const response = await adminApi.post(
        "/admin/ai/command",
        {
          prompt: textToSend,
          apiKeyOverride: storedKey || undefined,
          conversationHistory: newMsgList.slice(-6),
        },
        { headers }
      );

      const aiData = response?.data;

      // Append AI response
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiData?.message || "Operation processed.",
          toolCalled: aiData?.toolName,
          data: aiData?.data,
          requiresConfirmation: aiData?.requiresConfirmation,
          confirmationPrompt: aiData?.confirmationPrompt,
          confirmedTool: aiData?.toolName,
          confirmedParams: aiData?.params,
          isRefusal: aiData?.isRefusal,
          mode: aiData?.mode || aiStatus.activeMode,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `⚠️ **Error:** ${err.message || "Failed to process AI command. Please verify backend status."}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Execute action from a Confirmation Card
  const handleExecuteAction = async (msgId, toolName, params) => {
    setLoading(true);
    try {
      const response = await adminApi.post("/admin/ai/command", {
        executeAction: true,
        confirmedTool: toolName,
        confirmedParams: params,
      });

      const resData = response?.data;
      toast.success(resData?.message || "Action executed successfully!");

      // Update the confirmation card message to show completed state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                requiresConfirmation: false,
                isExecuted: true,
                executedResult: resData?.data,
              }
            : m
        )
      );

      // Add success confirmation bubble
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `✅ **Action Confirmed & Completed:**\n${resData?.message || "Database state updated."}`,
          data: resData?.data,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      toast.error(err.message || "Failed to execute action");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissConfirmation = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, requiresConfirmation: false, isDismissed: true }
          : m
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl h-[88vh] max-h-[720px] flex flex-col rounded-3xl bg-[#0d121f] border border-white/12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 py-3.5 border-b border-white/8 bg-[#111728]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary to-cyan-400 p-0.5 shadow-lg shadow-primary/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
                <Sparkles size={18} className="text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  NovaStore Admin AI Copilot
                </h3>
                {/* Engine Mode Pill */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
                    aiStatus.activeMode === "gemini"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiStatus.activeMode === "gemini"
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-indigo-400"
                    }`}
                  />
                  {aiStatus.activeMode === "gemini" ? "Gemini 2.0 AI" : "Local Hybrid Engine"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Executes catalog, inventory, orders, returns, and sales operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Chat History Button */}
            <button
              onClick={handleClearHistory}
              title="Clear Chat History"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </button>

            {/* Key Settings Toggle */}
            <button
              onClick={() => setShowKeySettings(!showKeySettings)}
              title="Configure Gemini API Key"
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                showKeySettings || customKey
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Key size={16} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Optional Gemini API Key Drawer */}
        {showKeySettings && (
          <div className="p-4 bg-[#141b2d] border-b border-white/8 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Optional Google Gemini 2.0 Key
              </span>
              <span className="text-[11px] text-slate-400">
                Leave blank to use the zero-config Built-in Local Engine
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy... (Paste Google Gemini API Key)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-primary"
              />
              <button
                onClick={handleSaveCustomKey}
                className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Suggested Quick Prompt Pills */}
        <div className="px-4 sm:px-6 py-2 border-b border-white/6 bg-[#0c101c] overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <TrendingUp size={11} /> Quick:
          </span>
          {[
            { label: "📦 Low Stock Alert", prompt: "Show low stock products" },
            { label: "🔄 Pending Returns", prompt: "Show pending return requests" },
            { label: "📊 This Month GST", prompt: "Show this month GST summary" },
            { label: "🎟️ Create 20% Coupon", prompt: "Create 20% coupon FESTIVE20 min order 999" },
            { label: "❓ Customer Questions", prompt: "Show pending customer questions" },
            { label: "📈 Today's Sales", prompt: "How are today's sales and overview?" },
          ].map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSendPrompt(pill.prompt)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-primary mt-1 shadow-xs">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-white shadow-md rounded-tr-xs"
                    : msg.isError
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-xs"
                    : "bg-[#141b2e] border border-white/8 text-slate-200 rounded-tl-xs shadow-md"
                }`}
              >
                {/* Text Content with Basic Markdown Support */}
                <div className="whitespace-pre-line space-y-1">
                  {msg.text.split("\n").map((line, idx) => {
                    // Render bold text
                    const boldProcessed = line.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-white font-semibold">$1</strong>'
                    );
                    return (
                      <p
                        key={idx}
                        dangerouslySetInnerHTML={{ __html: boldProcessed }}
                      />
                    );
                  })}
                </div>

                {/* 0. Live Store Analytics KPI Grid */}
                {msg.data?.metrics && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/8 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-primary" />
                        Live Store Performance Snapshot
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Live Data
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Today's Revenue</p>
                        <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                          ₹{Number(msg.data.metrics.todayRevenue || 0).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Today's Orders</p>
                        <p className="text-sm font-extrabold text-white mt-0.5">
                          {msg.data.metrics.todayOrders || 0}
                        </p>
                        <span className="text-[9px] text-slate-400">({msg.data.metrics.pendingOrders || 0} pending)</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Pending Returns</p>
                        <p className="text-sm font-extrabold text-amber-400 mt-0.5">
                          {msg.data.metrics.pendingReturns || 0}
                        </p>
                        <Link to="/orders" onClick={onClose} className="text-[9px] text-primary hover:underline block mt-0.5">
                          View Returns ➔
                        </Link>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Low Stock Alert</p>
                        <p className={`text-sm font-extrabold mt-0.5 ${msg.data.metrics.lowStockProducts > 0 ? "text-rose-400" : "text-slate-300"}`}>
                          {msg.data.metrics.lowStockProducts || 0} items
                        </p>
                        <Link to="/products" onClick={onClose} className="text-[9px] text-primary hover:underline block mt-0.5">
                          Catalog ➔
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Confirmation Action Card */}
                {msg.requiresConfirmation && !msg.isExecuted && !msg.isDismissed && (
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                    <div className="flex items-start gap-2 text-amber-300 text-xs font-semibold">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <span>{msg.confirmationPrompt || "Confirmation required before proceeding"}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-amber-200/80 bg-black/20 p-2 rounded-lg font-mono">
                      <span>Action: <b>{msg.confirmedTool}</b></span>
                      {msg.confirmedParams && (
                        <span>• Params: {JSON.stringify(msg.confirmedParams)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          handleExecuteAction(msg.id, msg.confirmedTool, msg.confirmedParams)
                        }
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        Confirm & Execute
                      </button>
                      <button
                        onClick={() => handleDismissConfirmation(msg.id)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Product Mini List Card (e.g. Low stock query) */}
                {msg.data?.products && Array.isArray(msg.data.products) && msg.data.products.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-white/6">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Products List ({msg.data.products.length})</span>
                      <Link
                        to="/products"
                        onClick={onClose}
                        className="text-primary hover:underline flex items-center gap-1 normal-case"
                      >
                        View in Catalog <ExternalLink size={10} />
                      </Link>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.data.products.slice(0, 10).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-black/30 border border-white/6 hover:border-white/12 transition-colors"
                        >
                          <img
                            src={p.thumbnail || "https://placehold.co/80"}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className="text-emerald-400 font-semibold">₹{p.price?.toLocaleString("en-IN")}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                                  p.stock <= 2
                                    ? "bg-rose-500/20 text-rose-300"
                                    : p.stock <= 10
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-emerald-500/20 text-emerald-300"
                                }`}
                              >
                                Stock: {p.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Order Details Card */}
                {msg.data?.order && (
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/8 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/6 pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Package size={14} className="text-primary" />
                        {msg.data.order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/15 text-primary border border-primary/20">
                        {msg.data.order.orderStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>Customer: <b className="text-white">{msg.data.order.customerName}</b></div>
                      <div>Total: <b className="text-emerald-400">₹{msg.data.order.totalAmount}</b></div>
                      <div>Payment: <b className="text-white">{msg.data.order.paymentStatus}</b></div>
                      <div>Return State: <b className="text-amber-400">{msg.data.order.returnStatus}</b></div>
                    </div>
                    <Link
                      to={`/orders/${msg.data.order.id}`}
                      onClick={onClose}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                    >
                      Open Full Order Details <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {/* 4. GST Summary Card */}
                {msg.data?.cgst !== undefined && msg.data?.sgst !== undefined && (
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/8 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/6 pb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Receipt size={14} className="text-emerald-400" />
                        Tax Breakdown ({msg.data.period})
                      </span>
                      <Link
                        to="/reports"
                        onClick={onClose}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        GSTR Schedule <ExternalLink size={10} />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase">Gross Sales</p>
                        <p className="text-xs font-bold text-white mt-0.5">₹{msg.data.totalGrossSales?.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase">Taxable Value</p>
                        <p className="text-xs font-bold text-slate-200 mt-0.5">₹{msg.data.netTaxableValue?.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase">CGST (50%)</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{msg.data.cgst?.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-400 uppercase">SGST (50%)</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{msg.data.sgst?.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Pending Questions List */}
                {msg.data?.questions && Array.isArray(msg.data.questions) && msg.data.questions.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-white/6">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Customer Inquiries</span>
                      <Link
                        to="/questions"
                        onClick={onClose}
                        className="text-primary hover:underline flex items-center gap-1 normal-case"
                      >
                        Q&A Manager <ExternalLink size={10} />
                      </Link>
                    </div>
                    {msg.data.questions.slice(0, 3).map((q) => (
                      <div key={q.id} className="p-2 rounded-xl bg-black/20 border border-white/6 text-xs">
                        <p className="text-slate-400 text-[10px] font-medium">{q.productName}</p>
                        <p className="text-white font-semibold mt-0.5">"{q.question}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary mt-1 shadow-xs">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Thinking / Loading indicator */}
          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-primary">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#141b2e] border border-white/8 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Copilot is processing your store command...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/8 bg-[#0e1322]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Type a command... (e.g., 'Update stock of iPhone to 25', 'Mark ORD-548268-2596 Delivered')"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-3 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <span>Execute</span>
              <Send size={15} />
            </button>
          </form>

          <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              Strict Store Operations Only • Confirmation required for financial & destructive actions
            </span>
            <span className="hidden sm:inline">Press Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
