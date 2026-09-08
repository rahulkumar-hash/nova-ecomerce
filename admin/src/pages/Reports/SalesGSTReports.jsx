import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  IndianRupee,
  Receipt,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FileText,
  Search,
  Building2,
  Percent,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function SalesGSTReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 7);
      setStartDate(d7.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "thisMonth") {
      setStartDate(`${yyyy}-${mm}-01`);
      setEndDate(todayStr);
    } else if (preset === "lastMonth") {
      const firstLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstLastMonth.toISOString().split("T")[0]);
      setEndDate(lastLastMonth.toISOString().split("T")[0]);
    } else if (preset === "fy") {
      // Indian Financial Year: April 1 to March 31
      const fyStart = today.getMonth() >= 3 ? `${yyyy}-04-01` : `${yyyy - 1}-04-01`;
      setStartDate(fyStart);
      setEndDate(todayStr);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (status && status !== "all") params.append("status", status);
      if (paymentMethod && paymentMethod !== "all") params.append("paymentMethod", paymentMethod);

      const res = await adminApi.get(`/orders/admin/reports/summary?${params.toString()}`);
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load sales and GST report summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [startDate, endDate, status, paymentMethod]);

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (status && status !== "all") params.append("status", status);
      if (paymentMethod && paymentMethod !== "all") params.append("paymentMethod", paymentMethod);

      const baseURL = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${baseURL}/orders/admin/export/csv?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to generate CSV export from server");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NovaStore_GST_Sales_Report_${startDate || "All"}_to_${endDate || "All"}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("GST Sales CSV downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const filteredRecentOrders = (summary?.recentOrders || []).filter((o) => {
    if (!tableSearch.trim()) return true;
    const term = tableSearch.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(term) ||
      o.invoiceNumber?.toLowerCase().includes(term) ||
      o.customerName?.toLowerCase().includes(term) ||
      o.state?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Sales & GST Tax Reports</h2>
              <p className="text-xs text-slate-400">
                Date-filtered financial sales summaries, GST tax splits (CGST/SGST/IGST), and CSV export for accountants
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Export CSV Button */}
        <button
          onClick={handleDownloadCsv}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 border border-emerald-500 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={15} />
          )}
          <span>{exporting ? "Generating Report..." : "Download Sales & GST (CSV)"}</span>
        </button>
      </div>

      {/* Filter Toolbar & Date Presets */}
      <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Calendar size={14} className="text-indigo-400" />
            <span>Date Presets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "thisMonth", label: "This Month" },
              { id: "lastMonth", label: "Last Month" },
              { id: "fy", label: "FY 2025-26" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  datePreset === p.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a2234] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a2234] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Payment Modes</option>
              <option value="Online Payment">Online (Cards / UPI / NetBanking)</option>
              <option value="Cash on Delivery">Cash on Delivery (COD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Computing financial figures...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Gross Sales */}
            <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total Gross Sales</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <IndianRupee size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₹{summary?.totalRevenue?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">{summary?.totalOrders || 0} Orders</span>
                <span>•</span>
                <span>Avg ₹{summary?.totalOrders ? Math.round(summary.totalRevenue / summary.totalOrders) : 0}/order</span>
              </div>
            </div>

            {/* Net Taxable Value */}
            <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Net Taxable Value</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Receipt size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₹{summary?.totalTaxable?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Base sales price excluding discounts & taxes
              </div>
            </div>

            {/* Total GST Collected */}
            <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total GST Collected</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Percent size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400">
                ₹{summary?.totalTax?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Effective Tax:</span>
                <span className="text-slate-300 font-medium">
                  {summary?.totalTaxable ? ((summary.totalTax / summary.totalTaxable) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Discounts & Shipping */}
            <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Deductions & Shipping</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <TrendingUp size={15} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">
                ₹{summary?.totalDiscount?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Coupons applied • ₹{summary?.totalShipping || 0} Shipping collected
              </div>
            </div>
          </div>

          {/* GST Breakdown: CGST + SGST vs IGST Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#131926] to-[#182030] border border-white/8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Indian GST Filing Breakdown (GSTR-1 Ready)</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Origin State: <strong className="text-slate-300">Karnataka (Code 29)</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Intra-State CGST (Central Tax)</span>
                <div className="text-lg font-extrabold text-white">₹{summary?.cgstTotal?.toLocaleString("en-IN") || 0}</div>
                <p className="text-[10px] text-slate-500">Karnataka Intra-State 50% split</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Intra-State SGST (State Tax)</span>
                <div className="text-lg font-extrabold text-white">₹{summary?.sgstTotal?.toLocaleString("en-IN") || 0}</div>
                <p className="text-[10px] text-slate-500">Karnataka State 50% split</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Inter-State IGST (Integrated Tax)</span>
                <div className="text-lg font-extrabold text-emerald-400">₹{summary?.igstTotal?.toLocaleString("en-IN") || 0}</div>
                <p className="text-[10px] text-slate-500">Other States (UP, MH, DL, etc.) 100% tax</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong>Accountant Friendly:</strong> All exports follow the GSTR-1 schedule format with Place of Supply, Invoice Number, Taxable Value, CGST, SGST, and IGST pre-calculated. Can be imported directly into Tally, Zoho Books, or Excel.
              </span>
            </div>
          </div>

          {/* Orders Preview Table */}
          <div className="rounded-2xl bg-[#131926] border border-white/8 overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Transactions in Selected Range</h3>
                <p className="text-[11px] text-slate-400">Showing up to 15 matching orders</p>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter by Order #, Invoice, or State..."
                  className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/8 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">Order #</th>
                    <th className="pb-3">Invoice #</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Place of Supply</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3 text-right">Tax (₹)</th>
                    <th className="pb-3 text-right pr-2">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRecentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecentOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-indigo-400">
                          <Link to={`/orders/${o._id}`} className="hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-300 font-mono text-[11px]">
                          {o.invoiceNumber || `INV-${o.orderNumber}`}
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 text-slate-300 font-medium">{o.customerName || "Customer"}</td>
                        <td className="py-3 text-slate-400">
                          {o.state || "Karnataka"} ({o.city || "—"})
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              o.orderStatus === "Delivered"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : o.orderStatus === "Cancelled"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            }`}
                          >
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">{o.paymentMethod || "COD"}</td>
                        <td className="py-3 text-right text-amber-400 font-semibold">₹{o.tax || 0}</td>
                        <td className="py-3 text-right pr-2 font-black text-white">
                          ₹{o.totalAmount?.toLocaleString("en-IN") || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
