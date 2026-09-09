import React from "react";
import { Download, Printer, CheckCircle2, ShieldCheck, FileText, ArrowLeft, X } from "lucide-react";
import { numberToWordsIndian } from "../../utils/numberToWords";

export default function TaxInvoiceSheet({
  order,
  settings,
  onClose,
  onDownload,
  isDownloading,
  showActions = true,
}) {
  if (!order) return null;

  const symbol = settings?.currency?.symbol || "₹";
  const storeName = settings?.warehouse?.name || settings?.storeName || "NovaStore";
  const storeTagline = settings?.tagline || "Authorized Single Vendor Platform";
  const storeAddress = settings?.warehouse?.address || settings?.contact?.address || "101, Tech Avenue, Silicon City, Bangalore, India";
  const storeEmail = settings?.contact?.email || "support@novastore.com";
  const storePhone = settings?.contact?.phone || "+91 98765 43210";
  const gstin = settings?.warehouse?.gstin || "29AABCN8592M1ZK";
  const pan = settings?.warehouse?.pan || "AABCN8592M";
  const stateCode = settings?.warehouse?.stateCode || "29 (Karnataka)";

  const bankName = settings?.bankDetails?.bankName || "HDFC Bank Ltd";
  const accountNumber = settings?.bankDetails?.accountNumber || "5020008892182";
  const ifscCode = settings?.bankDetails?.ifscCode || "HDFC0000240";
  const branchName = settings?.bankDetails?.branchName || "Cyber City Branch";
  const upiId = settings?.bankDetails?.upiId || "pay.novastore@hdfcbank";

  const grandTotal = order.pricing?.totalAmount ?? order.totalAmount ?? 0;
  const subtotal = order.pricing?.subtotal ?? order.subtotal ?? grandTotal;
  const discount = order.pricing?.discount || order.couponDiscount || 0;
  const shippingFee = order.pricing?.shippingFee ?? 0;
  const tax = order.pricing?.tax ?? Math.round(grandTotal * 0.05);
  const cgst = (tax / 2).toFixed(2);
  const sgst = (tax / 2).toFixed(2);

  const isPaid =
    order.paymentInfo?.status === "Completed" ||
    order.paymentInfo?.status === "Paid" ||
    order.paymentStatus === "Paid";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden in Print) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 no-print">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Back to Order View"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText size={15} className="text-primary" />
                <span>Official Tax Invoice Preview</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {order.invoiceNumber || `INV-${order.orderNumber}`}
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized GST Invoice with Header, Footer & Watermark
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer shadow-sm"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>

            {onDownload && (
              <button
                onClick={onDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={15} />
                <span>{isDownloading ? "Generating..." : "Download Invoice"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Sheet Container */}
      <div
        id="printable-tax-invoice"
        className="bg-white text-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 md:p-12 shadow-2xl border border-slate-200 relative overflow-hidden font-sans text-xs leading-relaxed min-h-[500px] sm:min-h-[1050px]"
      >
        {/* ── Background Watermark ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <div className="transform rotate-[-32deg] text-center opacity-[0.045] border-8 border-slate-900 rounded-3xl p-10 max-w-2xl">
            <p className="text-7xl sm:text-8xl font-black tracking-widest font-sans text-slate-900 uppercase">
              {isPaid ? "PAID" : "TAX INVOICE"}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-widest text-slate-900 mt-2 uppercase">
              {storeName} • ORIGINAL TAX INVOICE
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 space-y-6">
          {/* 1. Header: Store Identity & Tax Document Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-200 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  {storeName.charAt(0)}
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans uppercase">
                  {storeName}
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-indigo-700">{storeTagline}</p>
              <p className="text-[11px] text-slate-500 max-w-md">{storeAddress}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 font-mono">
                <span>GSTIN: <strong className="text-slate-900">{gstin}</strong></span>
                <span>PAN: <strong className="text-slate-900">{pan}</strong></span>
                <span>State Code: <strong className="text-slate-900">{stateCode}</strong></span>
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black tracking-wider uppercase">
                TAX INVOICE
              </span>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Original for Recipient
              </p>
              <p className="text-[10px] text-slate-400">
                Rule 46 GST Bill of Supply
              </p>
              <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>Support: <strong className="text-slate-900">{storeEmail}</strong></p>
                <p>Helpline: <strong className="text-slate-900">{storePhone}</strong></p>
              </div>
            </div>
          </div>

          {/* 2. Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {order.invoiceNumber || `INV-${order.orderNumber}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Date</span>
              <span className="font-medium text-slate-900">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Reference</span>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                #{order.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                <CheckCircle2 size={12} />
                <span>{order.paymentInfo?.method || order.paymentMethod || "COD"} ({order.paymentInfo?.status || "Pending"})</span>
              </span>
            </div>
          </div>

          {/* 3. Billed To & Shipped To Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                BILLED TO (BUYER DETAILS)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {order.shippingAddress?.name || order.customerInfo?.name || "Valued Customer"}
              </p>
              <p className="text-slate-600">{order.shippingAddress?.street}</p>
              <p className="text-slate-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-slate-500 pt-1 font-mono">
                Phone: {order.shippingAddress?.phone || order.customerInfo?.phone || "N/A"}
              </p>
              <p className="text-slate-500 font-mono">
                Email: {order.customerInfo?.email || "customer@example.com"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                SHIPPED TO (DELIVERY DESTINATION)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {order.shippingAddress?.name || order.customerInfo?.name || "Valued Customer"}
              </p>
              <p className="text-slate-600">{order.shippingAddress?.street}</p>
              <p className="text-slate-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-slate-500 pt-1">
                Place of Supply: <strong>{order.shippingAddress?.state || "Karnataka"} (India)</strong>
              </p>
              <p className="text-slate-500">
                Carrier: <strong>{order.tracking?.carrier || "Express Courier"}</strong> {order.tracking?.trackingNumber ? `(AWB: ${order.tracking.trackingNumber})` : ""}
              </p>
            </div>
          </div>

          {/* 4. Products Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Description of Goods</th>
                  <th className="py-3 px-3 w-24">HSN/SAC</th>
                  <th className="py-3 px-3 w-16 text-center">Qty</th>
                  <th className="py-3 px-4 w-28 text-right">Unit Rate</th>
                  <th className="py-3 px-3 w-24 text-right">GST (5%)</th>
                  <th className="py-3 px-4 w-32 text-right">Total ({symbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {order.items?.map((item, idx) => {
                  const itemPrice = item.price || 0;
                  const itemQty = item.quantity || 1;
                  const itemTotal = item.total || itemPrice * itemQty;
                  const taxAmount = ((itemTotal * 0.05) / 1.05).toFixed(2);

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                        {item.variantTitle && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Variant: {item.variantTitle}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">8517.12</td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">{itemQty}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {symbol}{itemPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {symbol}{taxAmount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {symbol}{itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Financial Summary & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            {/* Left: Amount in Words & Bank Details */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  Invoice Amount in Words
                </span>
                <p className="font-bold text-slate-900 text-sm italic">
                  {numberToWordsIndian(grandTotal)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  Direct Bank Transfer / UPI Remittance
                </span>
                <p>Bank: <strong className="text-slate-800">{bankName}</strong> • A/C No: <strong className="font-mono text-slate-900">{accountNumber}</strong></p>
                <p>IFSC: <strong className="font-mono text-slate-900">{ifscCode}</strong> • Branch: {branchName}</p>
                <p>Official UPI ID: <strong className="font-mono text-slate-900">{upiId}</strong></p>
              </div>
            </div>

            {/* Right: Calculations */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-mono font-semibold text-slate-900">{symbol}{subtotal.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Promo Discount ({order.pricing?.couponCode || "COUPON"}):</span>
                  <span className="font-mono">-{symbol}{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping & Handling:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {shippingFee === 0 ? "FREE" : `${symbol}${shippingFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST (2.5%):</span>
                <span className="font-mono text-slate-800">{symbol}{cgst}</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (2.5%):</span>
                <span className="font-mono text-slate-800">{symbol}{sgst}</span>
              </div>

              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline font-black text-slate-900">
                <span className="text-sm">TOTAL AMOUNT:</span>
                <span className="text-xl font-mono text-indigo-700">
                  {symbol}{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Footer: Terms & Authorized Signatory */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
            <div className="sm:col-span-8 space-y-1 text-[10px] text-slate-500">
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Terms & Conditions of Sale:
              </span>
              <p>1. All products sold are backed by 7-Day Hassle-Free Replacement Guarantee.</p>
              <p>2. Warranty claims are honored Pan-India through manufacturer service centers.</p>
              <p>3. Goods dispatched under valid e-Way bill regulations via registered logistics partners.</p>
              <p>4. All disputes are subject to Bangalore, Karnataka jurisdiction only.</p>
            </div>

            {/* Authorized Signature Box with Digital Seal */}
            <div className="sm:col-span-4 text-right space-y-2">
              <p className="text-[11px] font-bold text-slate-800">For {storeName}</p>
              <div className="inline-block p-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-center w-48">
                <span className="text-[10px] font-bold text-indigo-700 block items-center justify-center gap-1">
                  <ShieldCheck size={12} />
                  <span>DIGITALLY VERIFIED</span>
                </span>
                <span className="text-[8px] text-slate-500 block">
                  Electronic Tax Invoice • Seal #{order.orderNumber?.slice(-6)}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-900">Authorised Signatory</p>
            </div>
          </div>

          {/* Bottom System Notice */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            This is a computer-generated tax invoice verified electronically on {new Date().toLocaleDateString("en-IN")}. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
}
