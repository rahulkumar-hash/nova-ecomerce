import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  MapPin, 
  Plus, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft,
  Banknote,
  Lock,
  ChevronRight,
  AlertCircle,
  Zap,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSettingStore } from "../store/useSettingStore";
import { useOrderStore } from "../store/useOrderStore";
import toast from "react-hot-toast";

// Dynamically load Razorpay SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    subtotal, 
    tax, 
    shippingFee, 
    grandTotal, 
    appliedCoupon, 
    couponDiscount, 
    deliveryOption, 
    setDeliveryOption, 
    clearCart 
  } = useCart();
  
  const { user, isAuthenticated, setAuthModalOpen, addAddress } = useAuth();
  const { settings, fetchSettings } = useSettingStore();
  const { createOrder, createRazorpayOrder, verifyPayment } = useOrderStore();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: true,
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!orderPlacedRef.current && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  const addresses = user?.addresses || [];
  const activeAddress = addresses[selectedAddressIndex] || null;

  // Store payment config from admin settings
  const codEnabled = settings?.paymentMethods?.cod?.enabled !== false;
  const razorpayEnabled = settings?.paymentMethods?.razorpay?.enabled !== false;
  const razorpayKeyId = settings?.paymentMethods?.razorpay?.keyId || "rzp_test_1DP5mmOlF5G5ag";

  // Auto-set default payment method if COD is disabled
  useEffect(() => {
    if (!codEnabled && razorpayEnabled) {
      setPaymentMethod("Online Payment");
    } else if (codEnabled && !razorpayEnabled) {
      setPaymentMethod("Cash on Delivery");
    }
  }, [codEnabled, razorpayEnabled]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }
    const success = await addAddress(newAddress);
    if (success) {
      setShowNewAddressModal(false);
      setSelectedAddressIndex(addresses.length);
    }
  };

  const handlePlaceOrder = async () => {
    if (!activeAddress) {
      toast.error("Please select or add a shipping address");
      setStep(1);
      return;
    }

    if (paymentMethod === "Cash on Delivery") {
      executeOrderCreation({ paymentMethod: "Cash on Delivery" });
    } else {
      // Execute official default Razorpay checkout popup
      executeRazorpayPayment();
    }
  };

  const executeRazorpayPayment = async () => {
    setPlacingOrder(true);

    // Prevent Chrome from painting forced opaque white canvas on cross-origin iframe
    const prevColorScheme = document.documentElement.style.colorScheme;
    document.documentElement.style.colorScheme = "light";

    const restoreColorScheme = () => {
      document.documentElement.style.colorScheme = prevColorScheme || "";
    };

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        restoreColorScheme();
        toast.error("Razorpay SDK failed to load. Please check your internet connection.");
        setPlacingOrder(false);
        return;
      }

      // 1. Initialize Razorpay order from backend
      let rzpOrder = null;
      try {
        rzpOrder = await createRazorpayOrder(grandTotal);
      } catch (err) {
        console.warn("Backend Razorpay order creation fallback:", err);
      }

      // 2. Open official default Razorpay popup
      const options = {
        key: razorpayKeyId,
        amount: Math.round(grandTotal * 100), // in paise
        currency: "INR",
        name: settings?.storeName || "NovaStore",
        description: "Payment for Order - " + (settings?.tagline || "Online Store"),
        image: settings?.logo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=128",
        order_id: (rzpOrder?.id && !rzpOrder.id.startsWith("order_rzp_")) ? rzpOrder.id : undefined,
        prefill: {
          name: activeAddress.name || user?.name || "",
          email: user?.email || "customer@example.com",
          contact: activeAddress.phone || user?.phone || "9999999999",
        },
        theme: {
          color: settings?.theme?.primaryColor || "#6366f1",
          backdrop_color: "rgba(15, 23, 42, 0.75)",
        },
        modal: {
          backdropclose: true,
          escape: true,
          handleback: true,
          confirm_close: false,
          ondismiss: () => {
            restoreColorScheme();
            setPlacingOrder(false);
            toast("Payment cancelled", { icon: "💳" });
          },
        },
        handler: async (response) => {
          restoreColorScheme();
          try {
            await executeOrderCreation({
              paymentMethod: "Online Payment",
              transactionId: response.razorpay_payment_id || `pay_${Date.now()}`,
              status: "Completed",
            });
          } catch (err) {
            toast.error(err.message || "Failed to finalize order");
            setPlacingOrder(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", (response) => {
        restoreColorScheme();
        toast.error("Payment failed: " + (response.error?.description || "Transaction failed"));
        setPlacingOrder(false);
      });
      razorpayInstance.open();
    } catch (err) {
      restoreColorScheme();
      toast.error(err.message || "Failed to initialize Razorpay checkout");
      setPlacingOrder(false);
    }
  };

  const executeOrderCreation = async (paymentData) => {
    try {
      setPlacingOrder(true);
      const payload = {
        items: cartItems.map((item) => ({
          product: item.productId,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: activeAddress.name,
          phone: activeAddress.phone,
          street: activeAddress.street,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
          country: activeAddress.country || "India",
        },
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId || "",
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        deliveryOption,
        notes: orderNotes,
      };

      orderPlacedRef.current = true;
      const orderData = await createOrder(payload);
      clearCart();
      toast.success("Order confirmed successfully! 🎉");
      
      const orderIdentifier = orderData?._id || orderData?.orderNumber || orderData?.id;
      navigate(`/order-success/${orderIdentifier}`, {
        state: { order: orderData },
        replace: true,
      });
    } catch (err) {
      orderPlacedRef.current = false;
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <Lock className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Login Required for Checkout</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-xs sm:text-sm">
          Please log in to your account to securely complete your order and track shipping updates.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-8 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 text-xs sm:text-sm"
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Checkout Steps Progress */}
      <div>
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-3 sm:mb-6">
          <ArrowLeft size={16} /> Return to Cart
        </Link>
        <div className="flex items-center justify-center max-w-xl mx-auto w-full px-1">
          {[
            { num: 1, label: "Delivery Address" },
            { num: 2, label: "Payment Method" },
            { num: 3, label: "Review & Confirm" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => (s.num < step ? setStep(s.num) : null)}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold group cursor-pointer"
              >
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? "bg-primary text-white ring-4 ring-primary/20 shadow-md"
                      : step > s.num
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span className={`hidden sm:inline ${step === s.num ? "text-slate-900 dark:text-white font-bold" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </button>
              {idx < 2 && (
                <div className={`flex-1 h-0.5 mx-1.5 sm:mx-4 ${step > idx + 1 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left Column: Interactive Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 w-full min-w-0">
              <div className="p-3.5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Delivery Address
                  </h2>
                  <button
                    onClick={() => setShowNewAddressModal(true)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={15} /> Add New
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
                    <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-900 dark:text-white text-sm">No saved addresses found</p>
                    <p className="text-xs text-slate-500">Please add your shipping address to proceed with order delivery</p>
                    <button
                      onClick={() => setShowNewAddressModal(true)}
                      className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary text-xs"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {addresses.map((addr, idx) => (
                      <div
                        key={addr._id || idx}
                        onClick={() => setSelectedAddressIndex(idx)}
                        className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all relative break-words min-w-0 ${
                          selectedAddressIndex === idx
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">{addr.name}</span>
                            <span className="text-xs text-slate-500 block">{addr.phone}</span>
                          </div>
                          {selectedAddressIndex === idx && (
                            <CheckCircle2 size={18} className="text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 break-words">
                          {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    disabled={!activeAddress}
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all"
                  >
                    <span>Proceed to Payment</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Payment Options (Only COD and Online Razorpay as controlled by Admin) */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 w-full min-w-0">
              <div className="p-3.5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Choose Payment Option
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select your preferred payment gateway</p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Cash on Delivery */}
                  {codEnabled ? (
                    <label
                      className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all w-full min-w-0 ${
                        paymentMethod === "Cash on Delivery"
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Cash on Delivery"
                        checked={paymentMethod === "Cash on Delivery"}
                        onChange={() => setPaymentMethod("Cash on Delivery")}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary shrink-0">
                        <Banknote size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {settings?.paymentMethods?.cod?.label || "Cash on Delivery (COD)"}
                          </p>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            Available
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {settings?.paymentMethods?.cod?.description || "Pay with cash or UPI upon doorstep delivery."}
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      🚫 Cash on Delivery is currently disabled by store management.
                    </div>
                  )}

                  {/* Option 2: Razorpay Online Payment */}
                  {razorpayEnabled ? (
                    <label
                      className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all w-full min-w-0 ${
                        paymentMethod === "Online Payment"
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online Payment"
                        checked={paymentMethod === "Online Payment"}
                        onChange={() => setPaymentMethod("Online Payment")}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary shrink-0">
                        <CreditCard size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {settings?.paymentMethods?.razorpay?.label || "Online Payment (Razorpay)"}
                          </p>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                            Instant Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {settings?.paymentMethods?.razorpay?.description || "Pay securely via Google Pay, PhonePe, Paytm, Cards, NetBanking & Wallets."}
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      🚫 Online Razorpay payments are currently disabled by store management.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-7 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 flex items-center gap-2"
                  >
                    <span>Review Order</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Review & Place Order */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 w-full min-w-0">
              <div className="p-3.5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Review & Confirm Order</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verify your details before placing order</p>
                </div>

                {/* Delivery Address Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivering to:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{activeAddress?.name} ({activeAddress?.phone})</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {activeAddress?.street}, {activeAddress?.city}, {activeAddress?.state} - {activeAddress?.pincode}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="font-bold text-primary hover:underline">
                    Change
                  </button>
                </div>

                {/* Payment & Speed Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment & Delivery:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{paymentMethod}</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {deliveryOption === "express" ? "Express Priority (1-2 Days)" : "Standard Delivery (3-5 Days)"}
                    </p>
                  </div>
                  <button onClick={() => setStep(2)} className="font-bold text-primary hover:underline">
                    Change
                  </button>
                </div>

                {/* Ordered Items Preview */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Items in order ({cartItems.length}):</span>
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                        {item.variantTitle && <p className="text-[11px] font-semibold text-primary">{item.variantTitle}</p>}
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                      </div>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        ₹{(item.price * item.quantity)?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Delivery Instructions / Landmark (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Please leave parcel at front gate or call before delivery..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {placingOrder ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </div>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>{paymentMethod === "Cash on Delivery" ? "Confirm Order (COD)" : "Pay with Razorpay"} (₹{grandTotal?.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 space-y-6 w-full min-w-0">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sticky top-24 text-xs w-full max-w-full overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Payment Summary</h3>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Items Subtotal:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">₹{subtotal?.toLocaleString()}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount ({appliedCoupon?.code}):</span>
                <span className="font-mono">-₹{couponDiscount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Shipping Fee:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST Taxes (5% Incl.):</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">₹{tax?.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline font-black text-slate-900 dark:text-white text-sm">
              <span>Total Payable:</span>
              <span className="text-xl font-mono text-primary">₹{grandTotal?.toLocaleString()}</span>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>100% Encrypted Payment</span>
              </div>
              <p>Supports Razorpay 3D-Secure UPI, Cards, NetBanking & Doorstep Cash on Delivery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      <AnimatePresence>
        {showNewAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Delivery Address</h3>
              <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Street Address / House No / Landmark</label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
