import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  Trash2,
  Copy,
  Check,
  Download,
  Users,
  Sparkles,
  TicketPercent,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function SubscriberList() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/subscribers?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      if (res.success) {
        setSubscribers(res.data?.subscribers || []);
        setTotal(res.data?.total || 0);
        setTotalActive(res.data?.totalActive || 0);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load newsletter subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, search]);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from subscribers?`)) return;

    setDeletingId(id);
    try {
      const res = await adminApi.delete(`/subscribers/${id}`);
      if (res.success) {
        toast.success("Subscriber removed successfully");
        setSubscribers((prev) => prev.filter((s) => s._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete subscriber");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyEmails = async () => {
    try {
      const res = await adminApi.get("/subscribers/export");
      if (res.success && res.data?.emails?.length > 0) {
        const textToCopy = res.data.emails.join(", ");
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success(`Copied ${res.data.emails.length} subscriber emails to clipboard!`);
        setTimeout(() => setCopied(false), 2500);
      } else {
        toast("No active subscriber emails found to copy", { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error("Failed to copy emails");
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await adminApi.get("/subscribers/export");
      if (res.success && res.data?.emails?.length > 0) {
        const csvContent = "data:text/csv;charset=utf-8,Email,Source,Status\n" +
          res.data.emails.map((e) => `"${e}","Homepage VIP Newsletter","active"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Subscribers list exported as CSV!");
      }
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-indigo-500" /> Newsletter Subscribers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track customer email signups, welcome coupons, and export for marketing campaigns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied!" : "Copy All Emails"}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Download CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchSubscribers}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Subscribers</p>
            <h3 className="text-2xl font-black text-white">{total}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active VIP Subscriptions</p>
            <h3 className="text-2xl font-black text-emerald-400">{totalActive}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <TicketPercent size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Default Welcome Offer</p>
            <h3 className="text-base font-black text-amber-400">WELCOME15 (15% OFF)</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search subscriber by email address..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Subscribers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Subscribed At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Welcome Email</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading subscribers list...</span>
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    <Mail className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-400 text-sm">No subscribers found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {search ? "No subscriber matching your search query" : "Subscribers will appear here when users sign up via the homepage VIP footer."}
                    </p>
                  </td>
                </tr>
              ) : (
                subscribers.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{(page - 1) * 20 + idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{s.email}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{s.source || "Homepage VIP Newsletter"}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(s.subscribedAt || s.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {s.status === "active" ? "Active VIP" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        {s.couponCode || "WELCOME15"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          s.welcomeEmailSent
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {s.welcomeEmailSent ? "✓ Email Sent" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.email)}
                        disabled={deletingId === s._id}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete subscriber"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
