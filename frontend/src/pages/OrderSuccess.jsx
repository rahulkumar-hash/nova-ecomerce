import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Package, Truck, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const { settings } = useTheme();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  const symbol = settings?.currency?.symbol || "₹";

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
    });

    if (!order && id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/10 shadow-lg">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
          Order Placed Successfully
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-2 tracking-tight">
          Thank You For Your Order!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
          We've received your order and our automated fulfillment team is preparing your package for dispatch.
        </p>
      </motion.div>

      {order && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Order Reference</p>
              <h2 className="text-lg font-black font-mono text-slate-900 dark:text-white">
                #{order.orderNumber}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Total Payable</p>
              <p className="text-lg font-black font-mono text-primary">
                {symbol}{(order.pricing?.totalAmount ?? order.totalAmount)?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1 items-center gap-1.5">
                <MapPin size={14} className="text-primary" /> Delivery Destination
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {order.shippingAddress?.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1 items-center gap-1.5">
                <CreditCard size={14} className="text-primary" /> Payment Method
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {order.paymentInfo?.method || order.paymentMethod || "Cash on Delivery"}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Status: <span className="text-emerald-500 font-semibold">{order.paymentInfo?.status || "Completed"}</span>
              </p>
            </div>
          </div>

          {/* Quick Ordered items thumbnails */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Included Items ({order.items?.length || 0})
            </span>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-slate-200 dark:bg-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                      {item.variantTitle && <p className="text-[11px] text-primary">{item.variantTitle}</p>}
                      <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {symbol}{(item.total || item.price * item.quantity)?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!order && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-4 text-center">
          <p className="text-xs text-slate-400">Order Reference ID</p>
          <h2 className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
            #{id}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your order has been recorded successfully. You can track this and all past orders in your profile orders tab.
          </p>
        </div>
      )}

      {/* Footer CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Link
          to={`/order/${order?._id || id}`}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs"
        >
          <span>Track Order & View Live Details</span>
          <ArrowRight size={15} />
        </Link>
        <Link
          to="/profile"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center text-xs"
        >
          My Orders
        </Link>
        <Link
          to="/shop"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center text-xs"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
