import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  LayoutDashboard,
  Truck,
  ExternalLink,
  Package,
  CheckCircle2,
  RefreshCw,
  Send,
  Tag,
  Boxes,
  MapPin,
  Calendar,
  Layers,
  RotateCcw,
  X,
  Building2,
  Zap,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import { useAdminTheme } from "../../context/AdminThemeContext";
import TaxInvoiceSheet from "../../components/invoice/TaxInvoiceSheet";
import ShippingFulfillmentModal from "../../components/shipping/ShippingFulfillmentModal";
import ShippingLabelModal from "../../components/shipping/ShippingLabelModal";
import toast from "react-hot-toast";

export default function OrderDetail() {
  const { id } = useParams();
  const { settings } = useAdminTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'invoice'
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Logistics Modals
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Manual Tracking Update State
  const [showManualTrackingModal, setShowManualTrackingModal] = useState(false);
  const [carrierInput, setCarrierInput] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [trackingUrlInput, setTrackingUrlInput] = useState("");
  const [orderStatusInput, setOrderStatusInput] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

  // Return & Refund Resolution State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnStatusInput, setReturnStatusInput] = useState("Approved");
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [refundAmountInput, setRefundAmountInput] = useState(0);
  const [refundModeInput, setRefundModeInput] = useState("Original Payment Method");
  const [savingReturn, setSavingReturn] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryNoteInput, setDeliveryNoteInput] = useState("");

  const symbol = settings?.currency?.symbol || "₹";
  const activeEngine = settings?.deliveryGateways?.activeProvider || "manual";
  const isInHouse = activeEngine === "manual";

  const fetchOrder = async () => {
    try {
      const res = await adminApi.get("/orders/" + id);
      if (res.success) {
        setOrder(res.data);
        setCarrierInput(res.data?.tracking?.carrier || (isInHouse ? "In-House Fleet" : "Delhivery"));
        setTrackingNumberInput(res.data?.tracking?.trackingNumber || "");
        setTrackingUrlInput(res.data?.tracking?.trackingUrl || "");
        setOrderStatusInput(res.data?.orderStatus || "Confirmed");
        if (res.data?.returnRequest) {
          setReturnStatusInput(res.data.returnRequest.status || "Approved");
          setAdminNoteInput(res.data.returnRequest.adminNote || "");
          setRefundAmountInput(res.data.returnRequest.refundAmount || res.data.totalAmount || 0);
          setRefundModeInput(res.data.returnRequest.refundMode || "Original Payment Method");
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await adminApi.patch(`/orders/admin/${id}/status`, {
        orderStatus: newStatus,
        status: newStatus,
        carrier: order?.tracking?.carrier || (isInHouse ? "In-House Fleet" : "Express Courier"),
        note: `Status marked as ${newStatus} by store administrator`,
      });
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}! 🎉`);
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    try {
      setSavingTracking(true);
      const res = await adminApi.patch(`/orders/admin/${id}/status`, {
        orderStatus: orderStatusInput,
        status: orderStatusInput,
        carrier: carrierInput,
        trackingNumber: trackingNumberInput,
        trackingUrl: trackingUrlInput,
        note: deliveryNoteInput,
      });
      if (res.success) {
        toast.success("Order status & tracking updated! Notifications triggered.");
        setShowManualTrackingModal(false);
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update tracking");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleResolveReturn = async (e) => {
    e.preventDefault();
    try {
      setSavingReturn(true);
      const res = await adminApi.put(`/orders/${id}/return-status`, {
        status: returnStatusInput,
        adminNote: adminNoteInput,
        refundAmount: Number(refundAmountInput),
        refundMode: refundModeInput,
      });
      if (res.success) {
        toast.success("Return status updated successfully!");
        setShowReturnModal(false);
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update return");
    } finally {
      setSavingReturn(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!order) return;
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem("adminToken") || "";
      const baseURL = import.meta.env.VITE_API_URL || "/api/v1";
      const downloadUrl = `${baseURL}/orders/${order.orderNumber || id}/download-invoice?token=${encodeURIComponent(token)}`;

      const response = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        let errorMsg = "Could not generate invoice PDF";
        try {
          const errData = await response.json();
          if (errData?.message) errorMsg = errData.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Invoice-${order.invoiceNumber || order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Official PDF Invoice downloaded! 📄");
    } catch (err) {
      toast.error(err.message || "Failed to download invoice PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (!order) return <p className="text-white">Order not found</p>;

  const hasAwb = !!order.tracking?.trackingNumber;
  const isShipped = order.orderStatus === "Shipped" || order.orderStatus === "Delivered";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight font-mono">
                {order.orderNumber}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isShipped
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}>
                {order.orderStatus || "Confirmed"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()} • Invoice: {order.invoiceNumber || `INV-${order.orderNumber}`}
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab View Switcher */}
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("invoice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "invoice"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText size={14} />
              <span>Tax Invoice</span>
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingPdf ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Feature: Fulfillment Lifecycle & Quick Status Action Bar ── */}
      <div className="p-4 rounded-2xl bg-[#131926] border border-white/8 space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-400 font-semibold">Order Lifecycle:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
              order.orderStatus === "Delivered"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : order.orderStatus === "Cancelled"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
            }`}>
              {order.orderStatus || "Confirmed"}
            </span>

            {isInHouse ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Building2 size={12} />
                <span>In-House Fleet (Self Delivery)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Truck size={12} />
                <span>{order.tracking?.carrier || activeEngine.toUpperCase()}</span>
              </span>
            )}
          </div>

          {/* Quick 1-Click Status Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {order.orderStatus !== "Processing" && order.orderStatus !== "Shipped" && order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered" && (
              <button
                onClick={() => handleQuickStatusChange("Processing")}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Package size={13} />
                <span>Mark Processing</span>
              </button>
            )}

            {order.orderStatus !== "Shipped" && order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered" && (
              <button
                onClick={() => handleQuickStatusChange("Shipped")}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Truck size={13} />
                <span>Mark Shipped</span>
              </button>
            )}

            {order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered" && (
              <button
                onClick={() => handleQuickStatusChange("Out for Delivery")}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Zap size={13} />
                <span>Mark Out for Delivery</span>
              </button>
            )}

            {order.orderStatus !== "Delivered" ? (
              <button
                onClick={() => handleQuickStatusChange("Delivered")}
                disabled={updatingStatus}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {updatingStatus ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Mark as Delivered ✅</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Delivered to Customer (Returns Active)</span>
                </span>
                <button
                  onClick={() => setShowManualTrackingModal(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Edit Status
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "invoice" ? (
        /* Full Formal Tax Invoice View */
        <TaxInvoiceSheet
          order={order}
          settings={settings}
          onDownload={handleDownloadPdf}
          isDownloading={downloadingPdf}
          showActions={false}
        />
      ) : (
        /* Order Operations Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Ordered Items Card */}
            <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Ordered Products ({order.items?.length})</h3>
                <button
                  onClick={() => setActiveTab("invoice")}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  <span>Preview Full Invoice</span>
                </button>
              </div>

              <div className="divide-y divide-white/6">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10"
                      />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{item.name}</p>
                        {item.variantTitle && (
                          <span className="text-[11px] text-indigo-400 font-medium">{item.variantTitle}</span>
                        )}
                        <p className="text-[11px] text-slate-400">Qty: {item.quantity} × {symbol}{item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white text-xs">
                      {symbol}{item.total?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/8 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{symbol}{order.pricing?.subtotal?.toLocaleString()}</span>
                </div>
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({order.pricing?.couponCode})</span>
                    <span className="font-mono">-{symbol}{order.pricing?.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="font-mono text-white">{symbol}{order.pricing?.shippingFee || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (5% GST)</span>
                  <span className="font-mono text-white">{symbol}{order.pricing?.tax || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/6">
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-400">{symbol}{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Feature 1: RETURN & REPLACEMENT RESOLUTION CARD ── */}
            {order.returnRequest?.status && order.returnRequest.status !== "None" && (
              <div className="p-6 rounded-2xl bg-[#1c1410] border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <RotateCcw size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Doorstep Return Request
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.returnRequest.status === "Approved" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" :
                          order.returnRequest.status === "Refunded" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          order.returnRequest.status === "Rejected" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                          "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {order.returnRequest.status}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Requested on {new Date(order.returnRequest.requestedAt || order.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Resolve Return & Refund
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-white/3 rounded-xl border border-white/6 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Reason & Feedback</span>
                    <p className="font-semibold text-white">{order.returnRequest.reason}</p>
                    {order.returnRequest.comment && (
                      <p className="text-slate-400 italic">"{order.returnRequest.comment}"</p>
                    )}
                  </div>

                  <div className="p-3.5 bg-white/3 rounded-xl border border-white/6 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Resolution Details</span>
                    <p className="text-slate-300">
                      Refund: <strong className="text-emerald-400 font-mono">{symbol}{order.returnRequest.refundAmount || order.totalAmount}</strong> ({order.returnRequest.refundMode || "N/A"})
                    </p>
                    {order.returnRequest.adminNote && (
                      <p className="text-slate-400 text-[11px]">Note: {order.returnRequest.adminNote}</p>
                    )}
                  </div>
                </div>

                {order.returnRequest.images?.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                      Attached Proof Photos
                    </span>
                    <div className="flex gap-2">
                      {order.returnRequest.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 block">
                          <img src={img} alt="Return proof" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COURIER & FULFILLMENT CARD ── */}
            <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    {isInHouse ? <Building2 size={18} /> : <Truck size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{isInHouse ? "In-House Fleet Delivery" : "Fulfillment & Shipping Courier"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
                        {isInHouse ? "IN-HOUSE FLEET" : `Gateway: ${activeEngine.toUpperCase()}`}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isInHouse
                        ? "Local store delivery. No third-party API or external booking required. Direct dispatch & delivery."
                        : "Manage package weight, choose courier partner rates, and print AWB shipping barcode labels."}
                    </p>
                  </div>
                </div>

                {/* Fulfillment Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManualTrackingModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck size={13} className="text-indigo-400" />
                    <span>{isInHouse ? "Dispatch / Update Status" : "Update Tracking"}</span>
                  </button>

                  {order.orderStatus !== "Delivered" && (
                    <button
                      onClick={() => handleQuickStatusChange("Delivered")}
                      disabled={updatingStatus}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {hasAwb && (
                    <button
                      onClick={() => setShowLabelModal(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Tag size={13} className="text-amber-400" />
                      <span>Print Label</span>
                    </button>
                  )}

                  {!isInHouse && (
                    <button
                      onClick={() => setShowFulfillmentModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 shrink-0"
                    >
                      <Package size={14} />
                      <span>{hasAwb ? "Re-assign Courier" : "Ship Order & Select Courier"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Courier Status Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/3 border border-white/8 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Carrier</span>
                  <strong className="text-white font-semibold text-sm">
                    {order.tracking?.carrier || "Not Yet Shipped"}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AWB Tracking Number</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">
                    {order.tracking?.trackingNumber || "Pending Booking"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Box Specs & Freight</span>
                  <span className="text-slate-300 text-xs">
                    {order.tracking?.packageDetails?.weight || 0.5} KG • {order.tracking?.packageDetails?.length || 15}x{order.tracking?.packageDetails?.breadth || 15}x{order.tracking?.packageDetails?.height || 10} cm
                    {order.tracking?.packageDetails?.rate ? ` (₹${order.tracking.packageDetails.rate})` : ""}
                  </span>
                </div>
              </div>

              {/* Timeline Steps (Clean, no duplicates) */}
              <div className="space-y-4 relative pl-4 border-l-2 border-indigo-500/30 ml-2 pt-1">
                {order.tracking?.history?.map((step, sIdx) => (
                  <div key={sIdx} className="relative">
                    <span className="absolute -left-5.75 top-0 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#131926]" />
                    <p className="text-xs font-bold text-white">{step.status}</p>
                    <p className="text-[11px] text-slate-400">{step.note} {step.location ? `• ${step.location}` : ""}</p>
                    <span className="text-[10px] text-slate-500">{new Date(step.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Customer Information Card */}
            <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
              <h3 className="text-sm font-bold text-white">Customer Information</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <p><strong className="text-white block">Name:</strong> {order.customerInfo?.name || "Customer"}</p>
                <p><strong className="text-white block">Email:</strong> {order.customerInfo?.email || "N/A"}</p>
                <p><strong className="text-white block">Phone:</strong> {order.customerInfo?.phone || "N/A"}</p>
              </div>
            </div>

            {/* Delivery Destination Card */}
            <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-4">
              <h3 className="text-sm font-bold text-white">Delivery Address</h3>
              <div className="space-y-1 text-xs text-slate-300">
                <p className="font-bold text-white text-sm">{order.shippingAddress?.name}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                <p>{order.shippingAddress?.country || "India"}</p>
                <p className="text-slate-400 pt-1 font-mono">Phone: {order.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* Quick Tax Invoice Card */}
            <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>GST Tax Invoice Sheet</span>
                <span className="text-[10px] text-indigo-400 font-mono font-bold">PAID • GST</span>
              </h3>
              <p className="text-slate-400 text-[11px]">
                Authorized GST invoice sheet with store branding, background watermark & digital signature.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setActiveTab("invoice")}
                  className="py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  <span>View Sheet</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fulfillment Courier Selection Modal ── */}
      {showFulfillmentModal && (
        <ShippingFulfillmentModal
          order={order}
          settings={settings}
          onClose={() => setShowFulfillmentModal(false)}
          onSuccess={(dispatchResult) => {
            fetchOrder();
            // Automatically offer to view the label
            setShowLabelModal(true);
          }}
        />
      )}

      {/* ── Printable Shipping Label Modal ── */}
      {showLabelModal && (
        <ShippingLabelModal
          order={order}
          settings={settings}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {/* ── Feature 2: Manual Courier & Tracking Modal ── */}
      {showManualTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131926] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowManualTrackingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Update Tracking & Status</h3>
                <p className="text-xs text-slate-400">Order #{order.orderNumber}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateTracking} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Order Status</label>
                <select
                  value={orderStatusInput}
                  onChange={(e) => setOrderStatusInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Confirmed" className="bg-[#131926]">Confirmed</option>
                  <option value="Processing" className="bg-[#131926]">Processing (Packed & Ready)</option>
                  <option value="Shipped" className="bg-[#131926]">Shipped (Sends Email with Tracking)</option>
                  <option value="Out for Delivery" className="bg-[#131926]">Out for Delivery</option>
                  <option value="Delivered" className="bg-[#131926]">Delivered (Sends Delivery Email)</option>
                  <option value="Cancelled" className="bg-[#131926]">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Courier / Delivery Method</label>
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="In-House Fleet" className="bg-[#131926]">🏢 In-House Fleet (Store Self Delivery)</option>
                  <option value="Store Delivery Agent" className="bg-[#131926]">🛵 Store Delivery Agent / Local Rider</option>
                  <option value="Self Pickup" className="bg-[#131926]">🏬 Counter Handover / Customer Pickup</option>
                  <option value="Delhivery" className="bg-[#131926]">Delhivery Express</option>
                  <option value="Blue Dart" className="bg-[#131926]">Blue Dart</option>
                  <option value="DTDC" className="bg-[#131926]">DTDC Courier</option>
                  <option value="Shiprocket" className="bg-[#131926]">Shiprocket</option>
                  <option value="Ekart" className="bg-[#131926]">Ekart Logistics</option>
                  <option value="India Post" className="bg-[#131926]">Speed Post / India Post</option>
                  <option value="Shadowfax" className="bg-[#131926]">Shadowfax</option>
                  <option value="Other" className="bg-[#131926]">Other Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isInHouse ? "Delivery Rider / Vehicle / Note" : "Fulfillment Note / Remarks"}
                </label>
                <input
                  type="text"
                  value={deliveryNoteInput}
                  onChange={(e) => setDeliveryNoteInput(e.target.value)}
                  placeholder={isInHouse ? "e.g. Dispatched with Suresh (Ph: 9876543210)" : "e.g. Dispatched from main warehouse"}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isInHouse ? "Tracking / Delivery Reference (Optional)" : "AWB / Tracking Number"}
                </label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder={isInHouse ? "e.g. LOCAL-REF-01 or leave blank" : "e.g. DEL789123456IN"}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {!isInHouse && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Custom Tracking URL (Optional)</label>
                  <input
                    type="url"
                    value={trackingUrlInput}
                    onChange={(e) => setTrackingUrlInput(e.target.value)}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Tip: If left blank, the portal will automatically format the tracking URL for {carrierInput}.
                  </span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualTrackingModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTracking}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  {savingTracking ? "Saving..." : "Save & Notify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Feature 1: Return & Refund Resolution Modal ── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131926] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowReturnModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resolve Return & Refund</h3>
                <p className="text-xs text-slate-400">Order #{order.orderNumber}</p>
              </div>
            </div>

            <form onSubmit={handleResolveReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Return Status Decision</label>
                <select
                  value={returnStatusInput}
                  onChange={(e) => setReturnStatusInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Approved" className="bg-[#131926]">Approved (Doorstep Pickup Scheduled)</option>
                  <option value="Refunded" className="bg-[#131926]">Refunded (Completed)</option>
                  <option value="Rejected" className="bg-[#131926]">Rejected (Declined)</option>
                </select>
              </div>

              {returnStatusInput === "Refunded" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Refund Amount ({symbol})</label>
                    <input
                      type="number"
                      required
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Refund Mode / Channel</label>
                    <input
                      type="text"
                      value={refundModeInput}
                      onChange={(e) => setRefundModeInput(e.target.value)}
                      placeholder="e.g. Bank Account / UPI / Store Credit"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Response Note / Internal Reason</label>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g. Courier executive will pick up package within 24-48 hrs. Refund approved."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReturn}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
                >
                  {savingReturn ? "Saving..." : "Update Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
