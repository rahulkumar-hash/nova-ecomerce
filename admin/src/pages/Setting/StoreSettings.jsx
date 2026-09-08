import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Save, 
  Store, 
  Truck, 
  Phone, 
  CreditCard, 
  Cloud, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  Mail,
  Send,
  Eye,
  EyeOff,
  Info,
  Building2,
  Landmark,
  FileText,
  ArrowRight
} from "lucide-react";
import { useAdminTheme } from "../../context/AdminThemeContext";
import ImageUpload from "../../components/common/ImageUpload";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

export default function StoreSettings() {
  const { settings, updateStoreInfo } = useAdminTheme();
  
  // Section-specific loading states
  const [savingSection, setSavingSection] = useState(null); // 'all', 'payments', 'cloudinary', 'branding', 'shipping', 'contact'

  const [formData, setFormData] = useState({
    storeName: "",
    tagline: "",
    logo: "",
    currency: { symbol: "₹", code: "INR" },
    shipping: {
      freeShippingThreshold: 999,
      standardShippingFee: 49,
      expressShippingFee: 119,
    },
    tax: {
      taxPercentage: 5,
    },
    contact: {
      email: "",
      phone: "",
      address: "",
    },
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
    announcementBar: {
      enabled: true,
      text: "",
      link: "/shop",
    },
    paymentMethods: {
      cod: {
        enabled: true,
        label: "Cash on Delivery",
        description: "Pay with cash or UPI upon doorstep delivery.",
      },
      razorpay: {
        enabled: true,
        keyId: "rzp_test_singlevendor",
        keySecret: "",
        label: "Online Payment (Razorpay)",
        description: "Pay securely via UPI, Cards, NetBanking & Wallets.",
      },
    },
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      user: "",
      pass: "",
      fromName: "",
      fromEmail: "",
      secure: false,
    },
    cloudinary: {
      cloudName: "",
      apiKey: "",
      apiSecret: "",
    },
    deliveryGateways: {
      activeProvider: "manual",
      shiprocket: {
        enabled: false,
        email: "",
        password: "",
        token: "",
        pickupPincode: "560100",
        isSandbox: true,
      },
      delhivery: {
        enabled: false,
        apiKey: "",
        clientName: "",
        pickupLocation: "Primary Warehouse",
        isSandbox: true,
      },
      nimbuspost: {
        enabled: false,
        email: "",
        password: "",
        token: "",
        isSandbox: true,
      },
      bluedart: {
        enabled: false,
        loginId: "",
        licenseKey: "",
        customerCode: "",
        isSandbox: true,
      },
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || "",
        tagline: settings.tagline || "",
        logo: settings.logo || "",
        currency: settings.currency || { symbol: "₹", code: "INR" },
        shipping: settings.shipping || { freeShippingThreshold: 999, standardShippingFee: 49, expressShippingFee: 119 },
        tax: settings.tax || { taxPercentage: 5 },
        contact: settings.contact || { email: "", phone: "", address: "" },
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
        announcementBar: settings.announcementBar || { enabled: true, text: "", link: "/shop" },
        paymentMethods: settings.paymentMethods || {
          cod: { enabled: true, label: "Cash on Delivery", description: "Pay with cash upon delivery" },
          razorpay: { enabled: true, keyId: "rzp_test_singlevendor", keySecret: "", label: "Online Payment (Razorpay)" },
        },
        smtp: settings.smtp || {
          host: "smtp.gmail.com",
          port: 587,
          user: "",
          pass: "",
          fromName: "",
          fromEmail: "",
          secure: false,
        },
        cloudinary: settings.cloudinary || { cloudName: "", apiKey: "", apiSecret: "" },
        deliveryGateways: settings.deliveryGateways || {
          activeProvider: "manual",
          shiprocket: { enabled: false, email: "", password: "", token: "", pickupPincode: "560100", isSandbox: true },
          delhivery: { enabled: false, apiKey: "", clientName: "", pickupLocation: "Primary Warehouse", isSandbox: true },
          nimbuspost: { enabled: false, email: "", password: "", token: "", isSandbox: true },
          bluedart: { enabled: false, loginId: "", licenseKey: "", customerCode: "", isSandbox: true },
        },
      });
    }
  }, [settings]);

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState("");
  const [testingShipping, setTestingShipping] = useState(null);

  const handleTestShipping = async (provider) => {
    setTestingShipping(provider);
    try {
      const creds = formData.deliveryGateways?.[provider] || {};
      const res = await adminApi.post("/shipping/test-connection", {
        provider,
        credentials: creds,
      });
      if (res.success && res.data?.success) {
        toast.success(res.data?.message || "Connection validated successfully! 🚚");
      } else {
        toast.error(res.data?.message || res.message || "Connection verification failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to validate shipping credentials");
    } finally {
      setTestingShipping(null);
    }
  };

  const handleTestSmtp = async () => {
    if (!formData.smtp?.user || !formData.smtp?.pass) {
      toast.error("Please enter SMTP Username and Password first");
      return;
    }
    setTestingSmtp(true);
    try {
      await updateStoreInfo({ smtp: formData.smtp });
      const target = testEmailTarget || formData.smtp?.fromEmail || formData.smtp?.user;
      const res = await adminApi.post("/admin/test-smtp", { testEmail: target });
      toast.success(res.message || "Test email sent successfully! Please check inbox.");
    } catch (err) {
      toast.error(err.message || "SMTP test failed. Please verify credentials.");
    } finally {
      setTestingSmtp(false);
    }
  };

  // Partial save for specific section
  const handleSaveSection = async (sectionKey, payload) => {
    setSavingSection(sectionKey);
    try {
      await updateStoreInfo(payload);
    } finally {
      setSavingSection(null);
    }
  };

  // Global save for all settings
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSavingSection("all");
    try {
      await updateStoreInfo(formData);
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-primary" /> Store Configurations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage Payment Gateways, Branding, Cloudinary Media, Shipping & Support independently or globally
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={savingSection !== null}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {savingSection === "all" ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Saving Everything...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Full Width Multi-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full items-start">
        {/* 1. Payment Gateways Control (Highlighted Card) */}
        <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Payment Gateways Control</h3>
                <p className="text-[11px] text-slate-400">Enable/Disable COD or configure Razorpay keys</p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("payments", { paymentMethods: formData.paymentMethods })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "payments" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Payments</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cash on Delivery Toggle */}
            <div className={`p-4 rounded-xl border transition-all ${formData.paymentMethods?.cod?.enabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/2 border-white/8 opacity-75"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Cash on Delivery (COD)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${formData.paymentMethods?.cod?.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                    {formData.paymentMethods?.cod?.enabled ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods?.cod?.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethods: {
                          ...formData.paymentMethods,
                          cod: { ...formData.paymentMethods?.cod, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Display Label</label>
                <input
                  type="text"
                  value={formData.paymentMethods?.cod?.label || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethods: {
                        ...formData.paymentMethods,
                        cod: { ...formData.paymentMethods?.cod, label: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Razorpay Online Payment Config */}
            <div className={`p-4 rounded-xl border transition-all ${formData.paymentMethods?.razorpay?.enabled ? "bg-primary/5 border-primary/20" : "bg-white/2 border-white/8 opacity-75"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Razorpay Online</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${formData.paymentMethods?.razorpay?.enabled ? "bg-primary/20 text-primary" : "bg-slate-700 text-slate-400"}`}>
                    {formData.paymentMethods?.razorpay?.enabled ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods?.razorpay?.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethods: {
                          ...formData.paymentMethods,
                          razorpay: { ...formData.paymentMethods?.razorpay, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    placeholder="rzp_test_..."
                    value={formData.paymentMethods?.razorpay?.keyId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethods: {
                          ...formData.paymentMethods,
                          razorpay: { ...formData.paymentMethods?.razorpay, keyId: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Razorpay Key Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={formData.paymentMethods?.razorpay?.keySecret || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethods: {
                          ...formData.paymentMethods,
                          razorpay: { ...formData.paymentMethods?.razorpay, keySecret: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cloudinary Media Storage */}
        <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <Cloud size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloudinary Media Storage</h3>
                <p className="text-[11px] text-slate-400">Optional cloud storage for high-res product & banner uploads</p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("cloudinary", { cloudinary: formData.cloudinary })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "cloudinary" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Cloudinary</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cloud Name</label>
              <input
                type="text"
                placeholder="e.g. dxyz1234"
                value={formData.cloudinary?.cloudName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cloudinary: { ...formData.cloudinary, cloudName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">API Key</label>
              <input
                type="text"
                placeholder="1234567890"
                value={formData.cloudinary?.apiKey || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cloudinary: { ...formData.cloudinary, apiKey: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">API Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={formData.cloudinary?.apiSecret || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cloudinary: { ...formData.cloudinary, apiSecret: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Branding & Store Identity */}
        <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Store size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Branding & Store Identity</h3>
                <p className="text-[11px] text-slate-400">Store name, tagline and header logo</p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("branding", { 
                storeName: formData.storeName, 
                tagline: formData.tagline, 
                logo: formData.logo 
              })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "branding" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Branding</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>
          </div>

          <ImageUpload 
            value={formData.logo} 
            onChange={(url) => setFormData({ ...formData, logo: url })} 
            label="Store Logo (Optional)" 
          />
        </div>

        {/* 4. Shipping & Tax Rates */}
        <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Shipping & Tax Rates</h3>
                <p className="text-[11px] text-slate-400">Free delivery threshold and tax calculations</p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("shipping", { shipping: formData.shipping, tax: formData.tax })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "shipping" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Shipping</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Free Ship Min Order (₹)</label>
              <input
                type="number"
                value={formData.shipping.freeShippingThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping: { ...formData.shipping, freeShippingThreshold: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Standard Shipping (₹)</label>
              <input
                type="number"
                value={formData.shipping.standardShippingFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping: { ...formData.shipping, standardShippingFee: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">GST Tax (%)</label>
              <input
                type="number"
                value={formData.tax.taxPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tax: { ...formData.tax, taxPercentage: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 5. Support & Contact Channels */}
        <div className="p-6 rounded-2xl bg-[#131926] border border-white/8 space-y-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Support & Contact Channels</h3>
                <p className="text-[11px] text-slate-400">Customer assistance details displayed on footer and contact pages</p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("contact", { contact: formData.contact })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "contact" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Contact</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Support Email</label>
              <input
                type="text"
                placeholder="support@example.com"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Support Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.contact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, phone: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Address</label>
              <input
                type="text"
                placeholder="City, Country"
                value={formData.contact.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, address: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── Section: Warehouse & Invoice Remittance Notice & Direct Link ── */}
        <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 xl:col-span-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Warehouse, GST & Tax Invoice Remittance</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                  Dedicated Page
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fulfillment warehouse address, GSTIN, PAN, State Code & official Bank/UPI details are now managed on their own dedicated management page.
              </p>
            </div>
          </div>

          <Link
            to="/warehouse-invoice"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Open Warehouse & Invoices</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── Section 6: SMTP Email Gateway ── */}
        <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5 xl:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  SMTP Mail Server Configuration
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Database Managed
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure SMTP server for delivering OTP verification codes, order confirmations & notifications
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("smtp", { smtp: formData.smtp })}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingSection === "smtp" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save SMTP</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={formData.smtp?.host || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, host: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">SMTP Port</label>
              <input
                type="number"
                placeholder="587"
                value={formData.smtp?.port || 587}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, port: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Username / Email</label>
              <input
                type="text"
                placeholder="your-email@gmail.com"
                value={formData.smtp?.user || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, user: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password / App Password</label>
              <div className="relative">
                <input
                  type={showSmtpPass ? "text" : "password"}
                  placeholder="App Password (16 chars for Gmail)"
                  value={formData.smtp?.pass || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtp: { ...formData.smtp, pass: e.target.value },
                    })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Sender Name ("From")</label>
              <input
                type="text"
                placeholder="NovaStore Support"
                value={formData.smtp?.fromName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, fromName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Sender Email ("From Email")</label>
              <input
                type="email"
                placeholder="noreply@novastore.com"
                value={formData.smtp?.fromEmail || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, fromEmail: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.smtp?.secure || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, secure: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-white/10 text-indigo-500 focus:ring-0 bg-white/5"
              />
              <span className="text-xs font-medium text-slate-300">
                Use Secure SSL/TLS (Enable for Port 465, disable for Port 587/STARTTLS)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Test recipient email..."
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="px-3 py-1.5 bg-white/4 border border-white/10 rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none w-52"
              />
              <button
                type="button"
                disabled={testingSmtp}
                onClick={handleTestSmtp}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/15 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {testingSmtp ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Send Test Email</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 7: Order Delivery & Logistics Gateways (Shiprocket, Delhivery, NimbusPost, Blue Dart) ── */}
        <div className="rounded-3xl bg-[#111726]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Order Delivery & Logistics Gateways
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                    Active: {formData.deliveryGateways?.activeProvider?.toUpperCase() || "MANUAL"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select which shipping partner is actively used for automated dispatch, AWB generation, and tracking.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={savingSection !== null}
              onClick={() => handleSaveSection("deliveryGateways", { deliveryGateways: formData.deliveryGateways })}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 shrink-0"
            >
              {savingSection === "deliveryGateways" ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Delivery Settings</span>
            </button>
          </div>

          {/* Active Provider Selector Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
              Choose Active Delivery Partner (Live Engine)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  id: "manual",
                  name: "In-House Fleet",
                  sub: "Manual / Self Delivery",
                  icon: "🏢",
                  badge: "Default",
                },
                {
                  id: "shiprocket",
                  name: "Shiprocket",
                  sub: "25+ Couriers Automated",
                  icon: "🚀",
                  badge: "Most Popular",
                },
                {
                  id: "delhivery",
                  name: "Delhivery Direct",
                  sub: "Express B2C & Surface",
                  icon: "📦",
                  badge: "Direct API",
                },
                {
                  id: "nimbuspost",
                  name: "NimbusPost",
                  sub: "Lowest Rates Multi-Carrier",
                  icon: "⚡",
                  badge: "Cost Saver",
                },
                {
                  id: "bluedart",
                  name: "Blue Dart",
                  sub: "NetConnect Express Air",
                  icon: "✈️",
                  badge: "Premium SLA",
                },
              ].map((partner) => {
                const isActive = formData.deliveryGateways?.activeProvider === partner.id;
                return (
                  <div
                    key={partner.id}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          activeProvider: partner.id,
                        },
                      })
                    }
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isActive
                        ? "bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
                        : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{partner.icon}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isActive
                              ? "bg-indigo-500 text-white"
                              : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {isActive ? "ACTIVE" : partner.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{partner.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{partner.sub}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                        {isActive ? "✓ Selected Engine" : "Click to Activate"}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isActive ? "border-indigo-400 bg-indigo-500" : "border-slate-600"
                        }`}
                      >
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Configuration for the 4 Providers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* 1. Shiprocket Panel */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
              formData.deliveryGateways?.activeProvider === "shiprocket"
                ? "bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/20"
                : "bg-white/2 border-white/8"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. Shiprocket Integration</h4>
                    <p className="text-[10px] text-slate-400">Delhivery, Shadowfax, DTDC auto-dispatch</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={testingShipping === "shiprocket"}
                  onClick={() => handleTestShipping("shiprocket")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {testingShipping === "shiprocket" ? <RefreshCw size={11} className="animate-spin" /> : "Test API"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Email</label>
                  <input
                    type="email"
                    placeholder="shiprocket-login@store.com"
                    value={formData.deliveryGateways?.shiprocket?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          shiprocket: { ...formData.deliveryGateways?.shiprocket, email: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.deliveryGateways?.shiprocket?.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          shiprocket: { ...formData.deliveryGateways?.shiprocket, password: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pickup Pincode</label>
                  <input
                    type="text"
                    placeholder="560100"
                    value={formData.deliveryGateways?.shiprocket?.pickupPincode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          shiprocket: { ...formData.deliveryGateways?.shiprocket, pickupPincode: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.deliveryGateways?.shiprocket?.isSandbox !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryGateways: {
                            ...formData.deliveryGateways,
                            shiprocket: { ...formData.deliveryGateways?.shiprocket, isSandbox: e.target.checked },
                          },
                        })
                      }
                      className="w-3.5 h-3.5 rounded border-white/10 text-indigo-500 focus:ring-0 bg-white/5"
                    />
                    <span className="text-[11px] text-slate-300">Sandbox / Test Mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Delhivery Direct Panel */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
              formData.deliveryGateways?.activeProvider === "delhivery"
                ? "bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20"
                : "bg-white/2 border-white/8"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">2. Delhivery Direct API</h4>
                    <p className="text-[10px] text-slate-400">Direct courier integration (Zero middleman fee)</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={testingShipping === "delhivery"}
                  onClick={() => handleTestShipping("delhivery")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {testingShipping === "delhivery" ? <RefreshCw size={11} className="animate-spin" /> : "Test API"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Delhivery API Token</label>
                  <input
                    type="password"
                    placeholder="e.g. 9876543210abcdef0123456789"
                    value={formData.deliveryGateways?.delhivery?.apiKey || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          delhivery: { ...formData.deliveryGateways?.delhivery, apiKey: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pickup Location Name</label>
                  <input
                    type="text"
                    placeholder="Primary Warehouse"
                    value={formData.deliveryGateways?.delhivery?.pickupLocation || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          delhivery: { ...formData.deliveryGateways?.delhivery, pickupLocation: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.deliveryGateways?.delhivery?.isSandbox !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryGateways: {
                            ...formData.deliveryGateways,
                            delhivery: { ...formData.deliveryGateways?.delhivery, isSandbox: e.target.checked },
                          },
                        })
                      }
                      className="w-3.5 h-3.5 rounded border-white/10 text-rose-500 focus:ring-0 bg-white/5"
                    />
                    <span className="text-[11px] text-slate-300">Sandbox / Staging Mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. NimbusPost Panel */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
              formData.deliveryGateways?.activeProvider === "nimbuspost"
                ? "bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20"
                : "bg-white/2 border-white/8"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">3. NimbusPost Integration</h4>
                    <p className="text-[10px] text-slate-400">Lowest base shipping rates & fast COD payout</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={testingShipping === "nimbuspost"}
                  onClick={() => handleTestShipping("nimbuspost")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {testingShipping === "nimbuspost" ? <RefreshCw size={11} className="animate-spin" /> : "Test API"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">NimbusPost Email</label>
                  <input
                    type="email"
                    placeholder="account@store.com"
                    value={formData.deliveryGateways?.nimbuspost?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          nimbuspost: { ...formData.deliveryGateways?.nimbuspost, email: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">NimbusPost Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.deliveryGateways?.nimbuspost?.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          nimbuspost: { ...formData.deliveryGateways?.nimbuspost, password: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.deliveryGateways?.nimbuspost?.isSandbox !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryGateways: {
                            ...formData.deliveryGateways,
                            nimbuspost: { ...formData.deliveryGateways?.nimbuspost, isSandbox: e.target.checked },
                          },
                        })
                      }
                      className="w-3.5 h-3.5 rounded border-white/10 text-emerald-500 focus:ring-0 bg-white/5"
                    />
                    <span className="text-[11px] text-slate-300">Sandbox Test Mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Blue Dart Panel */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
              formData.deliveryGateways?.activeProvider === "bluedart"
                ? "bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/20"
                : "bg-white/2 border-white/8"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✈️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">4. Blue Dart Direct API</h4>
                    <p className="text-[10px] text-slate-400">Premium Express NetConnect Gateway</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={testingShipping === "bluedart"}
                  onClick={() => handleTestShipping("bluedart")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {testingShipping === "bluedart" ? <RefreshCw size={11} className="animate-spin" /> : "Test API"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Login ID</label>
                  <input
                    type="text"
                    placeholder="BLUEDART_LOGIN"
                    value={formData.deliveryGateways?.bluedart?.loginId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          bluedart: { ...formData.deliveryGateways?.bluedart, loginId: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">License Key</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.deliveryGateways?.bluedart?.licenseKey || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          bluedart: { ...formData.deliveryGateways?.bluedart, licenseKey: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Customer Code</label>
                  <input
                    type="text"
                    placeholder="CUST-100234"
                    value={formData.deliveryGateways?.bluedart?.customerCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryGateways: {
                          ...formData.deliveryGateways,
                          bluedart: { ...formData.deliveryGateways?.bluedart, customerCode: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
