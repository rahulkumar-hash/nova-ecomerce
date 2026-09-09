import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  Tag, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    totalItemsCount, 
    subtotal, 
    totalMrp, 
    totalSavings, 
    shippingFee, 
    tax, 
    grandTotal, 
    appliedCoupon, 
    couponDiscount, 
    deliveryOption, 
    setDeliveryOption, 
    freeShippingProgress, 
    amountNeededForFreeShipping, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    applyCoupon, 
    removeCoupon 
  } = useCart();
  
  const { isAuthenticated, setAuthModalOpen } = useAuth();
  const [couponInput, setCouponInput] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await api.get("/coupons/public");
      if (res.success) {
        setAvailableCoupons(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApply = async (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code) return;
    setApplyingCode(true);
    const success = await applyCoupon(code);
    if (success) {
      setCouponInput("");
    }
    setApplyingCode(false);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      navigate("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your Cart is Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Looks like you haven't added anything to your cart yet. Explore our wide collection of products!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all"
          >
            Start Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Shopping Cart</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear All
        </button>
      </div>

      {/* Free Shipping Progress bar */}
      <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Truck className="w-5 h-5" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {amountNeededForFreeShipping === 0
                ? "🎉 Congratulations! You have unlocked FREE Standard Delivery!"
                : <>Add <span className="font-bold text-primary">₹{amountNeededForFreeShipping}</span> more to get FREE Standard Delivery!</>}
            </span>
            <span className="font-semibold text-primary">{freeShippingProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Cart items column */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId || "base"}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all"
              >
                {/* Thumbnail */}
                <Link to={`/product/${item.slug}`} className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 block">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300";
                    }}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.slug}`} className="font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1 text-base sm:text-lg">
                    {item.name}
                  </Link>

                  {/* Variant info */}
                  {item.variantTitle && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.variantTitle}
                      </span>
                    </div>
                  )}

                  {/* Price info */}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      ₹{item.price}
                    </span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{item.mrp}
                      </span>
                    )}
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right sm:w-28">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Delivery speed selector */}
          <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Delivery Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryOption === "standard" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="deliverySpeed"
                  value="standard"
                  checked={deliveryOption === "standard"}
                  onChange={() => setDeliveryOption("standard")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Standard Delivery (3-5 Days)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtotal >= 999 ? "FREE" : "₹49"}
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryOption === "express" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="deliverySpeed"
                  value="express"
                  checked={deliveryOption === "express"}
                  onChange={() => setDeliveryOption("express")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Express Priority (1-2 Days)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">₹119</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order summary column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>

            {/* Coupon Code Section */}
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Have a Coupon Code?
              </label>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm uppercase">{appliedCoupon.code}</p>
                      <p className="text-xs">Saved ₹{couponDiscount}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. WELCOME15)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    onClick={() => handleApply()}
                    disabled={!couponInput || applyingCode}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Available coupons pill list */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1.5">Available Offers:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleApply(c.code)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {shippingFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400">FREE</span> : `₹${shippingFee}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Tax (GST 5%)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{tax}</span>
              </div>

              {totalSavings > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>Total Savings on this order</span>
                  <span>₹{totalSavings}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900 dark:text-white">Grand Total</span>
                <span className="text-2xl font-extrabold text-primary">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="mt-6 w-full py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </button>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>100% Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-primary" />
                <span>Fast Doorstep Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>7 Days Easy Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
