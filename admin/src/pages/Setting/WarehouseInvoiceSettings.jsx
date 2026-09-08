import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Landmark,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Copy,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
  CreditCard,
  QrCode,
  Sliders
} from "lucide-react";
import { useAdminTheme } from "../../context/AdminThemeContext";
import toast from "react-hot-toast";

export default function WarehouseInvoiceSettings() {
  const { settings, updateStoreInfo } = useAdminTheme();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    warehouse: {
      name: "Primary Fulfillment Warehouse",
      address: "101, Tech Avenue, Silicon City, Bangalore, India",
      gstin: "29AABCN8592M1ZK",
      pan: "AABCN8592M",
      stateCode: "29 (Karnataka)",
    },
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "5020008892182",
      ifscCode: "HDFC0000240",
      branchName: "Cyber City Branch",
      upiId: "pay.novastore@hdfcbank",
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        warehouse: settings.warehouse || {
          name: "Primary Fulfillment Warehouse",
          address: "101, Tech Avenue, Silicon City, Bangalore, India",
          gstin: "29AABCN8592M1ZK",
          pan: "AABCN8592M",
          stateCode: "29 (Karnataka)",
        },
        bankDetails: settings.bankDetails || {
          bankName: "HDFC Bank Ltd",
          accountNumber: "5020008892182",
          ifscCode: "HDFC0000240",
          branchName: "Cyber City Branch",
          upiId: "pay.novastore@hdfcbank",
        },
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const ok = await updateStoreInfo({
        warehouse: formData.warehouse,
        bankDetails: formData.bankDetails,
      });
      if (ok) {
        toast.success("Warehouse & Invoice credentials saved successfully! 📄✨");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save warehouse and invoice settings");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/settings"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Store Settings</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-emerald-400">Warehouse & Invoices</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>Warehouse, GST & Tax Invoice Remittance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure Dispatch Warehouse Name, Address, GSTIN, PAN, State Code & Bank/UPI Remittance details printed on Customer Invoices & Shipping Labels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
          >
            <Receipt size={14} />
            <span>View Orders / Invoices</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Saving Credentials...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Invoice & Warehouse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left/Center, Live Invoice Preview on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: 2 Configuration Cards (7 cols on XL) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Card 1: Fulfillment Warehouse & Tax Details */}
          <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Fulfillment Warehouse & Seller Credentials
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                      Invoice Header
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Printed at the top-left of the Tax Invoice & Shipping Labels as the origin/seller entity
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Warehouse / Seller Registered Name</span>
                  <span className="text-[10px] text-slate-500 font-normal">Legal entity or warehouse name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Fulfillment Warehouse"
                  value={formData.warehouse?.name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warehouse: { ...formData.warehouse, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Warehouse Physical Address</span>
                  <span className="text-[10px] text-slate-500 font-normal">Street, City, Pincode</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="101, Tech Avenue, Silicon City, Bangalore, India"
                  value={formData.warehouse?.address || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warehouse: { ...formData.warehouse, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">GSTIN</label>
                  <input
                    type="text"
                    placeholder="29AABCN8592M1ZK"
                    value={formData.warehouse?.gstin || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouse: { ...formData.warehouse, gstin: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500/40 focus:outline-none tracking-wider"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">15-digit GSTIN</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">PAN Card</label>
                  <input
                    type="text"
                    placeholder="AABCN8592M"
                    value={formData.warehouse?.pan || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouse: { ...formData.warehouse, pan: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500/40 focus:outline-none tracking-wider"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">10-digit PAN</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">State Code</label>
                  <input
                    type="text"
                    placeholder="29 (Karnataka)"
                    value={formData.warehouse?.stateCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouse: { ...formData.warehouse, stateCode: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Place of Supply</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Direct Bank Transfer / UPI Remittance */}
          <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Direct Bank Transfer / UPI Remittance
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                      Invoice Footer
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official remittance instructions printed at the bottom of the invoice for direct B2B / NEFT / UPI settlement
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank Ltd"
                    value={formData.bankDetails?.bankName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Account Number</label>
                  <input
                    type="text"
                    placeholder="5020008892182"
                    value={formData.bankDetails?.accountNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500/40 focus:outline-none tracking-wider"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="HDFC0000240"
                    value={formData.bankDetails?.ifscCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono uppercase focus:ring-2 focus:ring-amber-500/40 focus:outline-none tracking-wider"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    placeholder="Cyber City Branch"
                    value={formData.bankDetails?.branchName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, branchName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Official UPI ID / VPA</span>
                  <span className="text-[10px] text-slate-500">Fast remittance via PhonePe, GPay, Paytm</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="pay.novastore@hdfcbank"
                    value={formData.bankDetails?.upiId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                      })
                    }
                    className="w-full pl-3.5 pr-20 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                  />
                  {formData.bankDetails?.upiId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.bankDetails.upiId, "UPI ID")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy size={11} />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Live Visual Representation of Invoice Impact (5 cols on XL) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Live Document Preview Box */}
          <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Live Tax Invoice Simulation
                    <Sparkles size={13} className="text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time preview of how saved credentials print on documents
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated Paper Invoice Sheet */}
            <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 text-slate-800 text-[11px] leading-relaxed space-y-4">
              
              {/* Invoice Header Mockup */}
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                      Tax Invoice / Bill of Supply
                    </span>
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      {formData.warehouse?.name || "Primary Fulfillment Warehouse"}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {formData.warehouse?.address || "101, Tech Avenue, Silicon City, Bangalore, India"}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {(formData.warehouse?.name || "N").charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-600 mt-2 pt-1 border-t border-slate-100">
                  <span>GSTIN: <strong className="text-slate-900">{formData.warehouse?.gstin || "29AABCN8592M1ZK"}</strong></span>
                  <span>PAN: <strong className="text-slate-900">{formData.warehouse?.pan || "AABCN8592M"}</strong></span>
                  <span>State: <strong className="text-slate-900">{formData.warehouse?.stateCode || "29 (Karnataka)"}</strong></span>
                </div>
              </div>

              {/* Sample Items Table Mockup */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                  <span>Item Description</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-700 font-medium">Sample Flagship Order Item (Qty: 1)</span>
                  <span className="font-bold text-slate-900 font-mono">₹4,999.00</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>GST (CGST 2.5% + SGST 2.5%)</span>
                  <span className="font-mono">Included</span>
                </div>
              </div>

              {/* Remittance Box Mockup */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                  <Landmark size={12} className="text-indigo-600" />
                  <span>Direct Bank Transfer / UPI Remittance</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Bank Name:</span>
                    <strong className="text-slate-900">{formData.bankDetails?.bankName || "HDFC Bank Ltd"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">A/C Number:</span>
                    <strong className="text-slate-900 font-mono">{formData.bankDetails?.accountNumber || "5020008892182"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">IFSC Code:</span>
                    <strong className="text-slate-900 font-mono">{formData.bankDetails?.ifscCode || "HDFC0000240"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Branch:</span>
                    <strong className="text-slate-900">{formData.bankDetails?.branchName || "Cyber City Branch"}</strong>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Official UPI ID:</span>
                  <span className="font-mono font-bold text-indigo-700">{formData.bankDetails?.upiId || "pay.novastore@hdfcbank"}</span>
                </div>
              </div>

              {/* Watermark Notice */}
              <div className="text-center pt-1">
                <span className="text-[9px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Live on Customer Portal, PDF Downloads & Shipping Labels</span>
                </span>
              </div>
            </div>

            {/* Helper Info Card */}
            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-400" />
                <span>Automatic Document Synchronization</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When you click <strong>Save Invoice & Warehouse</strong>, your settings are saved to MongoDB and immediately update:
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Customer Order Details invoice sheet & printouts</li>
                <li>Admin Order Details invoice view</li>
                <li>Backend official PDF generator download</li>
                <li>Automated Courier Shipping Labels sender address</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
