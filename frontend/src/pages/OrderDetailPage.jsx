import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Package,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  XCircle,
  Sparkles,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import TaxInvoiceSheet from "../components/invoice/TaxInvoiceSheet";
import toast from "react-hot-toast";
import { confirmAction } from "../utils/swal";

const TRACKING_STEPS = [
  { id: "Confirmed", label: "Order Confirmed", desc: "Order verified & confirmed" },
  { id: "Processing", label: "Packed & Ready", desc: "Package sorted at fulfillment hub" },
  { id: "Shipped", label: "Dispatched", desc: "Handed over to delivery carrier" },
  { id: "Out for Delivery", label: "Out for Delivery", desc: "Courier agent on the way" },
  { id: "Delivered", label: "Delivered", desc: "Safely handed over to customer" },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Return & Replacement Workflow State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("Defective / Damaged");
  const [returnComment, setReturnComment] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem("userToken") || localStorage.getItem("accessToken") || "";
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
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
      toast.error(err.message || "Failed to download invoice");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCancelOrder = async () => {
    const ok = await confirmAction("Cancel Order?", "Are you sure you want to cancel this order? Inventory will be released.", "Yes, Cancel Order");
    if (!ok) return;
    try {
      setCancelling(true);
      const res = await api.post(`/orders/${order._id}/cancel`, {
        reason: "Customer cancelled from order details dashboard",
      });
      if (res.success) {
        toast.success("Order has been cancelled");
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleUploadReturnImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        setReturnImages((prev) => [...prev, res.data.url]);
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnComment.trim()) {
      toast.error("Please provide details for the return request");
      return;
    }
    try {
      setReturnSubmitting(true);
      const res = await api.post(`/orders/${order._id}/return`, {
        reason: returnReason,
        comment: returnComment.trim(),
        images: returnImages,
      });
      if (res.success) {
        toast.success("Return request submitted successfully!");
        setShowReturnModal(false);
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const copyToClipboard = (text, label = "Tracking Number") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-3">Fetching order & tracking information...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-slate-500">The order reference #{id} could not be located in your account.</p>
        <Link to="/profile" className="inline-block px-6 py-2.5 rounded-xl font-bold text-white bg-primary text-xs">
          Return to My Profile
        </Link>
      </div>
    );
  }

  const symbol = settings?.currency?.symbol || "₹";
  const currentStatus = order.orderStatus || order.status || "Confirmed";
  const isCancelled = currentStatus === "Cancelled";

  const getStepIndex = (status) => {
    switch (status) {
      case "Pending":
      case "Confirmed":
        return 0;
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Out for Delivery":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 0;
    }
  };

  const activeStepIdx = getStepIndex(currentStatus);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Navigation Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/profile"
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                #{order.orderNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isCancelled
                    ? "bg-rose-500/10 text-rose-500"
                    : currentStatus === "Delivered"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} • {order.invoiceNumber || `INV-${order.orderNumber}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <FileText size={15} className="text-primary" />
            <span>View Invoice</span>
          </button>

          <button
            onClick={handleDownloadInvoice}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Download size={15} />
            <span>{downloadingPdf ? "Downloading..." : "Download Invoice"}</span>
          </button>
        </div>
      </div>

      {/* Feature 1: Doorstep Return & Refund Status Banner */}
      {order.returnRequest?.status && order.returnRequest.status !== "None" && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Doorstep Return / Replacement: <span className="uppercase text-amber-600 dark:text-amber-400">{order.returnRequest.status}</span>
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Requested on {new Date(order.returnRequest.requestedAt || order.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Reason</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{order.returnRequest.reason}</p>
              {order.returnRequest.comment && (
                <p className="text-slate-600 dark:text-slate-400 mt-1 italic">"{order.returnRequest.comment}"</p>
              )}
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Resolution & Refund</span>
              {order.returnRequest.status === "Refunded" ? (
                <div>
                  <p className="font-bold text-emerald-600">Refund Processed: {symbol}{order.returnRequest.refundAmount || order.totalAmount}</p>
                  <p className="text-slate-500 mt-0.5">Mode: {order.returnRequest.refundMode || "Original Payment Source"}</p>
                </div>
              ) : order.returnRequest.status === "Approved" ? (
                <p className="font-semibold text-sky-600">Return approved! Courier agent assigned for doorstep pickup.</p>
              ) : order.returnRequest.status === "Rejected" ? (
                <p className="font-semibold text-rose-600">Return request was reviewed and declined. Reason: {order.returnRequest.adminNote || "Policy criteria not met"}</p>
              ) : (
                <p className="font-semibold text-amber-600">Request under review by our customer operations team.</p>
              )}
              {order.returnRequest.adminNote && order.returnRequest.status !== "Rejected" && (
                <p className="text-slate-500 text-[11px] mt-1">Admin note: {order.returnRequest.adminNote}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature 2: Courier Partner & Live Tracking Card */}
      {order.tracking?.carrier && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {order.tracking.carrier}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Courier Partner</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  AWB: {order.tracking.trackingNumber || "Pending"}
                </span>
                {order.tracking.trackingNumber && (
                  <button
                    onClick={() => copyToClipboard(order.tracking.trackingNumber, "AWB Tracking Number")}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>

          {order.tracking?.trackingUrl && (
            <a
              href={order.tracking.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 transition-all hover:scale-105"
            >
              <ExternalLink size={14} />
              <span>Track Live on {order.tracking.carrier}</span>
            </a>
          )}
        </div>
      )}

      {/* Live Order Progress Tracker */}
      {!isCancelled ? (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Live Delivery Milestones
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Courier: <strong className="text-slate-800 dark:text-slate-200">{order.tracking?.carrier || "Express Courier"}</strong> ({order.tracking?.trackingNumber || order.orderNumber})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3 relative">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = activeStepIdx >= idx;

              return (
                <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-2 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      isCompleted
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <p className={`text-xs font-bold ${isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight hidden sm:block mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3">
          <XCircle size={24} />
          <div>
            <h4 className="font-bold text-sm">Order Cancelled</h4>
            <p className="text-xs mt-0.5">{order.cancelledReason || "This order was cancelled and inventory was returned."}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Ordered Items & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Ordered Products ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 sm:py-4 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                      alt={item.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">
                        {item.name}
                      </h4>
                      {item.variantTitle && (
                        <p className="text-[11px] font-semibold text-primary mt-0.5 truncate">
                          {item.variantTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Qty: <strong>{item.quantity}</strong> × {symbol}{item.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
                    {symbol}{(item.total || item.price * item.quantity)?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline History entries if any */}
          {order.tracking?.history?.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Milestone Timestamp Log
              </h3>
              <div className="space-y-3 relative pl-4 border-l-2 border-primary/30 ml-2">
                {order.tracking.history.map((h, hIdx) => (
                  <div key={hIdx} className="relative">
                    <span className="absolute -left-5.25 top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{h.status}</p>
                    <p className="text-[11px] text-slate-500">{h.note} {h.location ? `• ${h.location}` : ""}</p>
                    <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Address, Payment & Financial Summary */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Summary Box */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
              Payment Summary
            </h3>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {symbol}{(order.pricing?.subtotal ?? order.subtotal ?? order.totalAmount)?.toLocaleString()}
              </span>
            </div>

            {(order.pricing?.discount > 0 || order.couponDiscount > 0) && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount ({order.pricing?.couponCode || "PROMO"}):</span>
                <span className="font-mono">-{symbol}{(order.pricing?.discount || order.couponDiscount)?.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Shipping Fee:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {order.pricing?.shippingFee === 0 ? "FREE" : `${symbol}${order.pricing?.shippingFee || 0}`}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST Tax (5% Incl.):</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {symbol}{(order.pricing?.tax ?? order.tax ?? 0)?.toLocaleString()}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline font-black text-slate-900 dark:text-white text-sm">
              <span>Grand Total:</span>
              <span className="text-lg sm:text-xl font-mono text-primary">
                {symbol}{(order.pricing?.totalAmount ?? order.totalAmount)?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1 items-center gap-1.5">
              <MapPin size={14} className="text-primary inline mr-1" /> Delivery Destination
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {order.shippingAddress?.name || order.customerInfo?.name}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {order.shippingAddress?.street}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p className="text-slate-500 pt-1">
              Phone: <span className="font-semibold text-slate-900 dark:text-white">{order.shippingAddress?.phone || order.customerInfo?.phone}</span>
            </p>
          </div>

          {/* Payment Method Card */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1 items-center gap-1.5">
              <CreditCard size={14} className="text-primary inline mr-1" /> Payment Method
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {order.paymentInfo?.method || order.paymentMethod || "Cash on Delivery"}
            </p>
            <p className="text-slate-500">
              Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.paymentInfo?.status || "Completed"}</span>
            </p>
            {order.paymentInfo?.transactionId && (
              <p className="text-slate-500 font-mono text-[11px] truncate">
                Txn ID: {order.paymentInfo.transactionId}
              </p>
            )}
          </div>

          {/* Quick Invoice Card */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText size={15} className="text-primary" />
                <span>GST Tax Invoice</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
                {order.invoiceNumber || `INV-${order.orderNumber}`}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Official GST invoice with store branding, background watermark & digital signature.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <FileText size={13} />
                <span>View Sheet</span>
              </button>
              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingPdf}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>{downloadingPdf ? "..." : "Download"}</span>
              </button>
            </div>
          </div>

          {/* Manage Order Actions */}
          <div className="space-y-2 pt-1">
            {["Pending", "Confirmed"].includes(currentStatus) && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full py-3 rounded-2xl font-bold text-xs text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                {cancelling ? "Cancelling Order..." : "Cancel Order"}
              </button>
            )}

            {currentStatus === "Delivered" && (!order.returnRequest || order.returnRequest.status === "None") && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Request Return / Replacement</span>
              </button>
            )}

            <Link
              to="/contact-us"
              className="w-full py-2.5 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} />
              <span>Need Help with Order?</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Return & Replacement Request Modal ── */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
            >
              <button
                onClick={() => setShowReturnModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Doorstep Return / Replacement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order #{order.orderNumber} • 7-day hassle-free return guarantee
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason for Return
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                  >
                    <option value="Defective / Damaged">Defective / Damaged Product</option>
                    <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                    <option value="Size / Fit Issue">Size / Fit Issue</option>
                    <option value="Quality Not as Expected">Quality Not as Expected</option>
                    <option value="Missing Accessories">Missing Accessories / Components</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Describe the Issue / Comments
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Explain what is wrong with the delivered item, or any preference for replacement vs refund..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Photos of the Product (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span>{uploadingImage ? "Uploading..." : "+ Add Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleUploadReturnImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {returnImages.length} image{returnImages.length !== 1 ? "s" : ""} attached
                    </span>
                  </div>

                  {returnImages.length > 0 && (
                    <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
                      {returnImages.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          <img src={img} alt="Return proof" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚡ Once approved, our courier executive will arrive at your address to inspect and pick up the package. Refunds are initiated immediately upon pickup.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {returnSubmitting ? "Submitting..." : "Submit Return"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Tax Invoice Full-Screen Modal ── */}
      <AnimatePresence>
        {showInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl my-2 sm:my-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer no-print"
                title="Close Preview"
              >
                <X size={18} />
              </button>

              <div className="p-2 sm:p-6 max-h-[92vh] overflow-y-auto">
                <TaxInvoiceSheet
                  order={order}
                  settings={settings}
                  onClose={() => setShowInvoiceModal(false)}
                  onDownload={handleDownloadInvoice}
                  isDownloading={downloadingPdf}
                  showActions={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
