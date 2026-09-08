import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  X,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Clock,
  Star,
} from "lucide-react";
import adminApi from "../../services/adminApi";
import toast from "react-hot-toast";

export default function ShippingFulfillmentModal({ order, settings, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = Dimensions, 2 = Select Courier, 3 = Confirm
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingInProgress, setShippingInProgress] = useState(false);

  // Package specs
  const [dimensions, setDimensions] = useState({
    weight: 0.5,
    length: 15,
    breadth: 15,
    height: 10,
  });

  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);

  const volumetricWeight = ((dimensions.length * dimensions.breadth * dimensions.height) / 5000).toFixed(2);
  const billableWeight = Math.max(Number(dimensions.weight) || 0.5, Number(volumetricWeight));

  const handleFetchRates = async () => {
    try {
      setLoadingRates(true);
      const res = await adminApi.post(`/shipping/check-rates/${order.orderNumber || order._id}`, dimensions);
      if (res.success && res.data?.couriers) {
        setAvailableCouriers(res.data.couriers);
        // Pre-select the recommended or first courier
        const rec = res.data.couriers.find((c) => c.badge === "RECOMMENDED") || res.data.couriers[0];
        setSelectedCourier(rec || null);
        setStep(2);
      } else {
        toast.error("No couriers available for this route");
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch courier partner rates");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleConfirmShipment = async () => {
    if (!selectedCourier) {
      toast.error("Please select a courier partner");
      return;
    }

    try {
      setShippingInProgress(true);
      const res = await adminApi.post(`/shipping/assign-courier/${order.orderNumber || order._id}`, {
        courier: selectedCourier,
        packageDetails: {
          ...dimensions,
          volumetricWeight,
          billableWeight,
        },
      });

      if (res.success) {
        toast.success(`AWB #${res.data?.dispatchResult?.awbCode} Generated! 🚚`);
        onSuccess && onSuccess(res.data?.dispatchResult);
        onClose && onClose();
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate AWB and dispatch shipment");
    } finally {
      setShippingInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 bg-[#131926] text-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 bg-white/2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Ship Order & Generate AWB</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  #{order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Destination: {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.pincode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-2 p-3 bg-white/2 border-b border-white/5 text-xs text-center font-bold">
          <div
            onClick={() => setStep(1)}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 1 ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>1. Package Specs & Dimensions</span>
          </div>
          <div
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              step === 2 ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" : "text-slate-500"
            }`}
          >
            <span>2. Select Courier Partner & AWB</span>
          </div>
        </div>

        {/* Step 1: Dimensions & Weight */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-1 text-xs">
              <span className="font-bold text-slate-200">Parcel Contents ({order.items?.length} Items)</span>
              <p className="text-slate-400 text-[11px]">
                {order.items?.map((i) => `${i.name} (Qty: ${i.quantity})`).join(", ")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dead Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={dimensions.weight}
                  onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Length (CM)
                </label>
                <input
                  type="number"
                  min="1"
                  value={dimensions.length}
                  onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Breadth (CM)
                </label>
                <input
                  type="number"
                  min="1"
                  value={dimensions.breadth}
                  onChange={(e) => setDimensions({ ...dimensions, breadth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Height (CM)
                </label>
                <input
                  type="number"
                  min="1"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Volumetric Weight Helper Banner */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
              <span className="text-slate-400">
                Volumetric Weight: <strong className="text-white font-mono">{volumetricWeight} KG</strong>
              </span>
              <span className="text-indigo-300">
                Billable Weight: <strong className="text-white font-mono">{billableWeight} KG</strong>
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={loadingRates}
                onClick={handleFetchRates}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingRates ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>{loadingRates ? "Calculating Courier Rates..." : "Find Available Courier Partners"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Courier Partner */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Available Couriers for Pincode {order.shippingAddress?.pincode}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select the courier partner based on rate, SLA days, and delivery performance:
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Edit Dimensions
              </button>
            </div>

            {/* Couriers List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {availableCouriers.map((courier) => {
                const isSelected = selectedCourier?.id === courier.id;
                return (
                  <div
                    key={courier.id}
                    onClick={() => setSelectedCourier(courier)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
                        : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-indigo-400 bg-indigo-500" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{courier.name}</h5>
                          {courier.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                courier.badge === "FASTEST"
                                  ? "bg-sky-500/20 text-sky-300"
                                  : courier.badge === "CHEAPEST" || courier.badge === "LOWEST RATE"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {courier.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            <span>Delivery: {courier.etd}</span>
                          </span>
                          <span className="flex items-center gap-1 text-amber-400">
                            <Star size={11} fill="currentColor" />
                            <span>{courier.rating}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono text-white">₹{courier.rate}</span>
                      <span className="text-[10px] text-slate-400 block">Freight Charge</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-white/8 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Selected: <strong className="text-white">{selectedCourier?.name || "None"}</strong> (₹{selectedCourier?.rate || 0})
              </div>

              <button
                type="button"
                disabled={!selectedCourier || shippingInProgress}
                onClick={handleConfirmShipment}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {shippingInProgress ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{shippingInProgress ? "Generating AWB & Booking..." : "Confirm & Generate AWB"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
