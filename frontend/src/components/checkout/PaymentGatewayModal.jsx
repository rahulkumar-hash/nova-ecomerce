import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  X,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Wallet,
  Search,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank", code: "HDFC", popular: true, color: "#004c8f" },
  { id: "SBI", name: "State Bank of India", code: "SBIN", popular: true, color: "#280071" },
  { id: "ICICI", name: "ICICI Bank", code: "ICIC", popular: true, color: "#f37021" },
  { id: "AXIS", name: "Axis Bank", code: "UTIB", popular: true, color: "#97144d" },
  { id: "KOTAK", name: "Kotak Mahindra Bank", code: "KKBK", popular: true, color: "#ed1c24" },
  { id: "PNB", name: "Punjab National Bank", code: "PUNB", popular: true, color: "#a20a3a" },
  { id: "BOB", name: "Bank of Baroda", code: "BARB", popular: false, color: "#f26522" },
  { id: "YES", name: "Yes Bank", code: "YESB", popular: false, color: "#005696" },
  { id: "INDUS", name: "IndusInd Bank", code: "INDB", popular: false, color: "#8a1538" },
  { id: "CANARA", name: "Canara Bank", code: "CNRB", popular: false, color: "#0093d8" },
];

const WALLET_PROVIDERS = [
  { id: "amazonpay", name: "Amazon Pay Balance", color: "#ff9900", cashback: "₹25 Cashback" },
  { id: "phonepe", name: "PhonePe Wallet", color: "#5f259f", cashback: "Instant Flat ₹15 OFF" },
  { id: "mobikwik", name: "MobiKwik SuperCash", color: "#00a0e9", cashback: "10% SuperCash" },
  { id: "payzapp", name: "PayZapp by HDFC", color: "#004c8f", cashback: "Up to ₹50 Back" },
];

export default function PaymentGatewayModal({ 
  isOpen, 
  onClose, 
  totalAmount = 0, 
  storeSettings = {}, 
  user = {}, 
  onSuccess 
}) {
  const [activeTab, setActiveTab] = useState("upi"); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiSubTab, setUpiSubTab] = useState("qr"); // 'qr' | 'apps' | 'id'
  const [customUpiId, setCustomUpiId] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min expiry
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [selectedWallet, setSelectedWallet] = useState("amazonpay");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(user?.name || "");

  // Processing state
  const [processingState, setProcessingState] = useState(null); // null | 'connecting' | 'verifying' | 'success'

  const storeName = storeSettings?.storeName || "NovaStore";
  const storeUpi = storeSettings?.paymentMethods?.razorpay?.upiId || "novastore.orders@icici";
  const upiPayload = `upi://pay?pa=${storeUpi}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR&tn=OrderPayment`;

  useEffect(() => {
    if (!isOpen) {
      setProcessingState(null);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpi);
    setCopiedUpi(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const formatCardNumber = (val) => {
    const v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "").slice(0, 16);
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const formatExpiry = (val) => {
    const v = val.replace(/[^0-9]/g, "").slice(0, 4);
    if (v.length >= 2) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const getCardBrand = (num) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (/^60|^65|^81|^82/.test(clean)) return "RuPay";
    return "Card";
  };

  const triggerPaymentFlow = (methodName) => {
    setProcessingState("connecting");

    setTimeout(() => {
      setProcessingState("verifying");
      setTimeout(() => {
        setProcessingState("success");
        setTimeout(() => {
          const txnId = `pay_rzp_${Date.now().toString().slice(-8)}_${Math.floor(1000 + Math.random() * 9000)}`;
          onSuccess({
            transactionId: txnId,
            paymentMethod: "Online Payment",
            gatewayMethod: methodName,
            status: "Completed",
          });
        }, 1000);
      }, 1200);
    }, 1000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const filteredBanks = POPULAR_BANKS.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-[#0c1322] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-white flex flex-col my-auto"
      >
        {/* Razorpay Brand Header */}
        <div className="bg-[#0b192e] px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3395ff] text-white flex items-center justify-center font-black text-base shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">{storeName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Razorpay Secured
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Order Amount: <strong className="font-mono text-emerald-400 font-bold text-xs">₹{totalAmount.toLocaleString()}</strong></p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={!!processingState}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Processing State Overlay Screen */}
        <AnimatePresence>
          {processingState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[380px]"
            >
              {processingState === "connecting" && (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <Lock className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Connecting with Bank Gateway...</h4>
                    <p className="text-xs text-slate-400 mt-1">Establishing 256-Bit SSL Encrypted Channel</p>
                  </div>
                </>
              )}

              {processingState === "verifying" && (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <ShieldCheck className="w-7 h-7 text-indigo-400 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Authorizing Payment...</h4>
                    <p className="text-xs text-slate-400 mt-1">Validating UPI / Card transaction with NPCI</p>
                  </div>
                </>
              )}

              {processingState === "success" && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"
                  >
                    <CheckCircle2 size={36} />
                  </motion.div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-400">Payment Successful!</h4>
                    <p className="text-xs text-slate-400 mt-1">Creating your confirmed order...</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal Payment Modal Navigation & Forms */}
        {!processingState && (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Left Nav Tab Column */}
            <div className="md:col-span-4 bg-[#0a101d] p-3 border-b md:border-b-0 md:border-r border-white/6 flex md:flex-col gap-1 overflow-x-auto">
              {[
                { id: "upi", label: "UPI & QR", icon: QrCode, badge: "Instant" },
                { id: "card", label: "Cards", icon: CreditCard, badge: "Visa/MC" },
                { id: "netbanking", label: "Net Banking", icon: Building2, badge: "All Banks" },
                { id: "wallet", label: "Wallets", icon: Wallet, badge: "Offers" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all shrink-0 md:w-full ${
                      isActive
                        ? "bg-[#3395ff] text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </div>
                    <span className={`hidden sm:inline text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"
                    }`}>
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Panel */}
            <div className="md:col-span-8 p-5 sm:p-6 space-y-4">
              {/* TAB 1: UPI & QR Code */}
              {activeTab === "upi" && (
                <div className="space-y-4">
                  {/* UPI sub-navigation */}
                  <div className="flex items-center gap-1.5 bg-white/4 p-1 rounded-xl border border-white/6 text-xs">
                    <button
                      onClick={() => setUpiSubTab("qr")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                        upiSubTab === "qr" ? "bg-white/15 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Scan QR Code
                    </button>
                    <button
                      onClick={() => setUpiSubTab("apps")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                        upiSubTab === "apps" ? "bg-white/15 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      UPI Apps
                    </button>
                    <button
                      onClick={() => setUpiSubTab("id")}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                        upiSubTab === "id" ? "bg-white/15 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Enter UPI ID
                    </button>
                  </div>

                  {upiSubTab === "qr" && (
                    <div className="space-y-3 text-center">
                      <div className="p-3.5 bg-white rounded-2xl inline-block mx-auto shadow-xl relative group">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayload)}`}
                          alt="Razorpay QR"
                          className="w-36 h-36 mx-auto"
                        />
                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl pointer-events-none" />
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-slate-400">UPI ID:</span>
                        <span className="font-mono font-bold text-white bg-white/6 px-2 py-0.5 rounded-lg text-[11px]">
                          {storeUpi}
                        </span>
                        <button
                          onClick={handleCopyUpi}
                          className="p-1 rounded text-blue-400 hover:bg-blue-500/10"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>

                      <div className="text-[11px] text-amber-400 font-mono">
                        ⏱️ QR expires in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                      </div>

                      <button
                        onClick={() => triggerPaymentFlow("Razorpay UPI QR")}
                        className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#3395ff] hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Simulate Scanned & Paid</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {upiSubTab === "apps" && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">Select your preferred UPI App to pay:</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { name: "Google Pay", color: "#4285f4", icon: "GPay" },
                          { name: "PhonePe", color: "#5f259f", icon: "PhonePe" },
                          { name: "Paytm UPI", color: "#00b9f1", icon: "Paytm" },
                          { name: "CRED UPI", color: "#111111", icon: "CRED" },
                          { name: "Amazon Pay", color: "#ff9900", icon: "Amazon" },
                          { name: "BHIM UPI", color: "#007a3d", icon: "BHIM" },
                        ].map((app) => (
                          <button
                            key={app.name}
                            onClick={() => triggerPaymentFlow(app.name)}
                            className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-blue-500/40 text-center space-y-1.5 transition-all group"
                          >
                            <div
                              className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                              style={{ backgroundColor: app.color }}
                            >
                              {app.icon.slice(0, 2)}
                            </div>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white block truncate">
                              {app.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {upiSubTab === "id" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Enter Virtual Payment Address (VPA)</label>
                        <div className="relative">
                          <Smartphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={customUpiId}
                            onChange={(e) => setCustomUpiId(e.target.value)}
                            placeholder="username@okhdfcbank / 9876543210@paytm"
                            className="w-full pl-9 pr-4 py-2.5 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!customUpiId.includes("@")) {
                            toast.error("Please enter a valid UPI ID (e.g. name@upi)");
                            return;
                          }
                          triggerPaymentFlow(`UPI: ${customUpiId}`);
                        }}
                        className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#3395ff] hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        <Zap size={14} />
                        <span>Verify & Pay ₹{totalAmount.toLocaleString()}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Cards */}
              {activeTab === "card" && (
                <div className="space-y-3.5">
                  {/* Interactive Card Visualizer */}
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-900 via-blue-900 to-slate-900 border border-white/15 text-white shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300 shadow-inner" />
                      <span className="font-mono font-black text-xs tracking-wider text-blue-300">
                        {getCardBrand(cardNumber)}
                      </span>
                    </div>

                    <div className="font-mono text-sm tracking-widest font-bold my-1">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-300 mt-3 pt-2 border-t border-white/10 font-mono">
                      <span>{cardHolder.toUpperCase() || "CARD HOLDER"}</span>
                      <span>{cardExpiry || "MM/YY"}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                          maxLength={4}
                          className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Name on Card</label>
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => triggerPaymentFlow(`Card Ending In ${cardNumber.slice(-4) || "8921"}`)}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#3395ff] hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <Lock size={13} />
                    <span>Pay ₹{totalAmount.toLocaleString()} via 3D Secure</span>
                  </button>
                </div>
              )}

              {/* TAB 3: Net Banking */}
              {activeTab === "netbanking" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search bank name..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white/4 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredBanks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                          selectedBank === b.id
                            ? "border-blue-500 bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/30"
                            : "border-white/8 bg-white/3 text-slate-300 hover:bg-white/6"
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {selectedBank === b.id && <CheckCircle2 size={13} className="text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => triggerPaymentFlow(`NetBanking: ${selectedBank}`)}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#3395ff] hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
                  >
                    <Building2 size={14} />
                    <span>Proceed to {selectedBank} NetBanking</span>
                  </button>
                </div>
              )}

              {/* TAB 4: Wallets */}
              {activeTab === "wallet" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Select wallet to redeem balance & cashback:</p>
                  <div className="space-y-2">
                    {WALLET_PROVIDERS.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          selectedWallet === w.id
                            ? "border-blue-500 bg-blue-500/15 text-white ring-2 ring-blue-500/20"
                            : "border-white/8 bg-white/3 text-slate-300 hover:bg-white/6"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                            style={{ backgroundColor: w.color }}
                          >
                            {w.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">{w.name}</p>
                            <span className="text-[10px] text-emerald-400 font-semibold">{w.cashback}</span>
                          </div>
                        </div>
                        {selectedWallet === w.id && <CheckCircle2 size={16} className="text-blue-400" />}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => triggerPaymentFlow(`Wallet: ${selectedWallet}`)}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#3395ff] hover:bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
                  >
                    <Wallet size={14} />
                    <span>Pay ₹{totalAmount.toLocaleString()} with Wallet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="bg-[#080d17] px-5 py-3 border-t border-white/6 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>PCI-DSS Level 1 Certified</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span>Powered by</span>
            <span className="font-extrabold text-blue-400 tracking-wider">RAZORPAY</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
