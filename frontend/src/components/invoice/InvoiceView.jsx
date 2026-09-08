import React from "react";
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  QrCode as QrCodeIcon,
  X
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function InvoiceView({ order, onClose }) {
  const { settings } = useTheme();

  if (!order) return null;

  const symbol = settings?.currency?.symbol || "₹";
  const isPaid = order.paymentInfo?.status === "Completed" || order.paymentStatus === "Paid";
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-10 max-w-4xl mx-auto font-sans print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
      {/* Top Action Bar (Hidden in print) */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            Tax Invoice / Bill of Supply
          </span>
          <span className="text-xs text-slate-500">#{order.invoiceNumber || order.orderNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all hover:scale-105"
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none print:text-black">
                {settings?.storeName || "NovaStore"}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 print:text-gray-600">
                {settings?.tagline || "Premium Single Vendor Destination"}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-3 print:text-gray-600">
            <p className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">
              {settings?.contact?.address || "101, Innovation Square, Cyber City, Bangalore, India - 560001"}
            </p>
            <p>Email: {settings?.contact?.email || "support@novastore.com"} | Phone: {settings?.contact?.phone || "+91 98765 43210"}</p>
            <p className="font-mono text-[11px]">GSTIN: 29AABCN8592M1ZK | Registered MSME</p>
          </div>
        </div>

        <div className="sm:text-right space-y-1">
          <div className="inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider mb-2 border print:border-black">
            {isPaid ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 print:text-green-800">
                <CheckCircle2 size={14} /> PAID IN FULL
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 print:text-yellow-800">
                <Clock size={14} /> CASH ON DELIVERY
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 print:text-gray-600">Invoice Number</p>
          <p className="text-base font-black font-mono text-slate-900 dark:text-white print:text-black">
            {order.invoiceNumber || `INV-${order.orderNumber}`}
          </p>

          <p className="text-xs text-slate-400 pt-1 print:text-gray-600">Order ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300 print:text-black">#{order.orderNumber}</span></p>
          <p className="text-xs text-slate-400 print:text-gray-600">Date: <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">{orderDate}</span></p>
        </div>
      </div>

      {/* Bill To & Ship To Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5 print:text-gray-500">
            Billed & Shipped To:
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
            {order.shippingAddress?.name || order.customerInfo?.name}
          </p>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5 print:text-black">
            {order.shippingAddress?.street}
          </p>
          <p className="text-slate-600 dark:text-slate-300 print:text-black">
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <p className="text-slate-600 dark:text-slate-300 print:text-black">
            {order.shippingAddress?.country || "India"}
          </p>
          <p className="text-slate-500 mt-1 print:text-gray-600">
            Phone: <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">{order.shippingAddress?.phone || order.customerInfo?.phone}</span>
          </p>
        </div>

        <div className="sm:text-right space-y-1.5">
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5 print:text-gray-500">
            Payment & Dispatch:
          </span>
          <p className="text-slate-700 dark:text-slate-200 print:text-black">
            <strong>Payment Method:</strong> {order.paymentInfo?.method || order.paymentMethod || "Cash on Delivery"}
          </p>
          {order.paymentInfo?.transactionId && (
            <p className="text-slate-500 font-mono text-[11px] print:text-gray-600">
              Txn ID: {order.paymentInfo.transactionId}
            </p>
          )}
          <p className="text-slate-700 dark:text-slate-200 print:text-black">
            <strong>Delivery Speed:</strong> {order.deliveryOption === "express" ? "Express Priority" : "Standard 3-5 Days"}
          </p>
          <p className="text-slate-500 print:text-gray-600">
            Carrier: {order.tracking?.carrier || "Express Logistics"} ({order.tracking?.trackingNumber || order.orderNumber})
          </p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="py-6 border-b border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider print:text-gray-600">
              <th className="pb-3 font-bold">#</th>
              <th className="pb-3 font-bold">Item Description</th>
              <th className="pb-3 font-bold text-center">Qty</th>
              <th className="pb-3 font-bold text-right">Unit Price</th>
              <th className="pb-3 font-bold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 print:text-black">
            {order.items?.map((item, idx) => (
              <tr key={idx} className="py-3">
                <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 print:hidden"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white print:text-black">{item.name}</p>
                      {item.variantTitle && (
                        <p className="text-[11px] text-primary font-medium">{item.variantTitle}</p>
                      )}
                      <p className="text-[10px] text-slate-400">HSN: 8517 | GST: 5%</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-right font-mono">{symbol}{item.price?.toLocaleString()}</td>
                <td className="py-3 text-right font-bold font-mono text-slate-900 dark:text-white print:text-black">
                  {symbol}{(item.total || item.price * item.quantity)?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Footnotes */}
      <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
        <div className="sm:col-span-7 space-y-4 text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 print:border-gray-300">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 p-1 rounded-xl border flex items-center justify-center">
              <QrCodeIcon className="w-10 h-10 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-[11px] print:text-black">
                Official Digital Invoice Verification
              </p>
              <p className="text-[10px] text-slate-500">
                Scan QR code to verify invoice authenticity and track live dispatch SLA.
              </p>
            </div>
          </div>

          <div className="text-[11px] space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 print:text-black">Terms of Sale & Return:</p>
            <p>1. 7-Day easy doorstep replacement / refund for eligible items.</p>
            <p>2. Goods once sold are covered under standard manufacturer / store warranty.</p>
            <p>3. This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>

        <div className="sm:col-span-5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400 print:text-gray-600">
            <span>Items Subtotal:</span>
            <span className="font-mono text-slate-900 dark:text-white font-semibold print:text-black">
              {symbol}{(order.pricing?.subtotal ?? order.subtotal ?? order.totalAmount)?.toLocaleString()}
            </span>
          </div>

          {(order.pricing?.discount > 0 || order.couponDiscount > 0) && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Coupon Discount ({order.pricing?.couponCode || "PROMO"}):</span>
              <span className="font-mono">-{symbol}{(order.pricing?.discount || order.couponDiscount)?.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 dark:text-slate-400 print:text-gray-600">
            <span>Shipping & Packaging:</span>
            <span className="font-mono text-slate-900 dark:text-white font-semibold print:text-black">
              {order.pricing?.shippingFee === 0 ? "FREE" : `${symbol}${order.pricing?.shippingFee || 0}`}
            </span>
          </div>

          <div className="flex justify-between text-slate-500 dark:text-slate-400 print:text-gray-600">
            <span>GST Tax (5% Incl.):</span>
            <span className="font-mono text-slate-900 dark:text-white font-semibold print:text-black">
              {symbol}{(order.pricing?.tax ?? order.tax ?? 0)?.toLocaleString()}
            </span>
          </div>

          <div className="pt-3 border-t-2 border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-black text-slate-900 dark:text-white text-base print:text-black">
            <span>Grand Total:</span>
            <span className="text-xl font-mono text-primary print:text-black">
              {symbol}{(order.pricing?.totalAmount ?? order.totalAmount)?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
