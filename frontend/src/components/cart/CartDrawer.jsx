import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, Tag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems = [],
    cartDrawerOpen,
    setCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    grandTotal,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    freeShippingProgress,
    amountNeededForFreeShipping,
  } = useCart();
  const { currency } = useTheme();
  const [couponInput, setCouponInput] = useState("");

  const symbol = currency?.symbol || "₹";
  const safeItems = Array.isArray(cartItems) ? cartItems : [];

  if (!cartDrawerOpen) return null;

  const handleApply = async (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Cart ({safeItems.length})</h3>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              aria-label="Close shopping cart drawer"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5 text-slate-800 dark:text-slate-200">
              <span>
                {amountNeededForFreeShipping === 0
                  ? "🎉 You unlocked FREE Delivery!"
                  : "Add " + symbol + amountNeededForFreeShipping + " more for FREE Shipping"}
              </span>
              <span className="font-mono text-[11px] text-primary font-bold">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: freeShippingProgress + "%" }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {safeItems.length === 0 ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <ShoppingBag size={36} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Your shopping bag is empty</p>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate("/shop");
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              safeItems.map((item) => (
                <div key={item.productId + (item.variantId || "")} className="py-4 flex gap-3.5 first:pt-0 last:pb-0">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={"/product/" + item.slug}
                          onClick={() => setCartDrawerOpen(false)}
                          className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {item.variantTitle && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{item.variantTitle}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {symbol}{(item.price * item.quantity).toLocaleString()}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="font-mono text-xs font-bold w-4 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {safeItems.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
              {/* Promo Code Input */}
              {!appliedCoupon ? (
                <form onSubmit={handleApply} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Promo Code (e.g. WELCOME15)"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs uppercase font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                    🎟️ {appliedCoupon.code} (-{symbol}{couponDiscount})
                  </span>
                  <button onClick={removeCoupon} className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold text-[11px]">
                    Remove
                  </button>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{symbol}{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-{symbol}{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Estimated Total</span>
                  <span className="font-mono text-primary">
                    {symbol}{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate("/checkout");
                  }}
                  className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg bg-primary hover:bg-primary-hover transition-all hover:scale-102 active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate("/cart");
                  }}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Full Cart Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
