import React from "react";
import { Printer, X, Package, Truck, ShieldCheck, MapPin } from "lucide-react";

export default function ShippingLabelModal({ order, settings, onClose }) {
  if (!order) return null;

  const storeName = settings?.warehouse?.name || settings?.storeName || "NovaStore";
  const storeAddress = settings?.warehouse?.address || settings?.contact?.address || "101, Tech Avenue, Silicon City, Bangalore, India";
  const storePhone = settings?.contact?.phone || "+91 98765 43210";
  const gstin = settings?.warehouse?.gstin || "29AABCN8592M1ZK";

  const awb = order.tracking?.trackingNumber || "SRK-10029381";
  const carrier = order.tracking?.carrier || "Delhivery Surface";
  const pkg = order.tracking?.packageDetails || { weight: 0.5, length: 15, breadth: 15, height: 10 };
  const isCod = order.paymentInfo?.method === "Cash on Delivery" || order.paymentMethod === "COD";
  const totalAmount = order.pricing?.totalAmount || order.totalAmount || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-300">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 bg-slate-100 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Parcel Shipping Label & AWB Manifest
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Printable Label Box (4x6 Aspect) ── */}
        <div id="printable-shipping-label" className="p-6 space-y-4 bg-white font-sans text-xs">
          {/* Carrier Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Courier Partner</span>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{carrier}</h2>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-black text-xs tracking-wider">
                ROUTING: BLR/HUB-01
              </span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-300 space-y-1">
            {/* SVG Simulated Barcode */}
            <div className="flex justify-center items-center gap-0.5 h-14 px-4 overflow-hidden">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2].map(
                (w, idx) => (
                  <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }} />
                )
              )}
            </div>
            <p className="font-mono font-black text-sm tracking-widest text-slate-900">{awb}</p>
          </div>

          {/* Payment Status Badge */}
          <div className={`p-3 rounded-xl border-2 text-center font-bold ${
            isCod
              ? "border-amber-600 bg-amber-50 text-amber-900"
              : "border-emerald-600 bg-emerald-50 text-emerald-900"
          }`}>
            <span className="text-[10px] uppercase tracking-wider block">Payment Mode</span>
            <span className="text-base font-black tracking-wide">
              {isCod ? `CASH ON DELIVERY (COLLECT: ₹${totalAmount.toLocaleString()})` : "PREPAID - DO NOT COLLECT CASH"}
            </span>
          </div>

          {/* Addresses: SHIP TO & RETURN TO */}
          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
            {/* Delivery Destination */}
            <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">
                DELIVER TO (CONSIGNEE)
              </span>
              <p className="font-bold text-slate-900 text-xs">{order.shippingAddress?.name || "Customer"}</p>
              <p className="text-slate-700 leading-tight">{order.shippingAddress?.street}</p>
              <p className="font-black text-slate-900">
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
              <p className="font-mono font-black text-sm text-indigo-800 pt-0.5">
                PIN: {order.shippingAddress?.pincode}
              </p>
              <p className="text-slate-600 font-mono">PH: {order.shippingAddress?.phone}</p>
            </div>

            {/* Return Address */}
            <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                RETURN TO (SHIPPER)
              </span>
              <p className="font-bold text-slate-900 text-xs">{storeName}</p>
              <p className="text-slate-700 leading-tight">{storeAddress}</p>
              <p className="text-slate-600 font-mono">GSTIN: {gstin}</p>
              <p className="text-slate-600 font-mono">PH: {storePhone}</p>
            </div>
          </div>

          {/* Package Weight & Items Summary */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] text-center font-mono">
            <div>
              <span className="text-slate-400 block text-[9px]">ORDER NO</span>
              <strong className="text-slate-900">#{order.orderNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">WEIGHT</span>
              <strong className="text-slate-900">{pkg.weight || 0.5} KG</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">DIMENSIONS</span>
              <strong className="text-slate-900">{pkg.length || 15}x{pkg.breadth || 15}x{pkg.height || 10} CM</strong>
            </div>
          </div>

          {/* Item Items Table */}
          <div className="text-[10px] border-t border-slate-200 pt-2 space-y-1">
            <p className="font-bold text-slate-800">Box Contents ({order.items?.length} items):</p>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-1 flex justify-between text-slate-600">
                  <span className="truncate max-w-70">{item.name} {item.variantTitle ? `(${item.variantTitle})` : ""}</span>
                  <span className="font-bold font-mono">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
            Do not accept if seal is tampered or broken • E-Way bill compliant e-commerce transit
          </div>
        </div>
      </div>
    </div>
  );
}
