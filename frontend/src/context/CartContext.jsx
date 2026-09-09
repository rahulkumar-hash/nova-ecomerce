import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { shipping, tax } = useTheme();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("localCart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("standard");

  // Sync with local storage
  useEffect(() => {
    localStorage.setItem("localCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant = null, quantity = 1) => {
    let price = product.price;
    let mrp = product.mrp || product.price;
    const fallbackImage = product.thumbnail || (Array.isArray(product.images) && product.images[0]) || "";
    let image = fallbackImage;
    let variantTitle = "";
    let attributes = [];
    let stock = product.stock;

    if (product.hasVariants && variant) {
      price = variant.price;
      mrp = variant.mrp || variant.price;
      if (variant.image && typeof variant.image === "string" && variant.image.trim() !== "") {
        image = variant.image;
      }
      variantTitle = variant.title || "";
      attributes = variant.attributes || [];
      stock = variant.stock;
    }

    const variantId = variant ? variant._id : null;

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productId === product._id &&
        (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (existingIndex > -1) {
      const currentQty = cartItems[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > stock) {
        toast.error("Cannot add more. Only " + stock + " items in stock!", { id: "cart-toast" });
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
      setCartItems(updated);
      toast.success("Updated quantity in cart!", { id: "cart-toast" });
    } else {
      if (quantity > stock) {
        toast.error("Only " + stock + " items available in stock!", { id: "cart-toast" });
        return;
      }
      const newItem = {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        variantId,
        variantTitle,
        attributes,
        price,
        mrp,
        image,
        quantity,
        stock,
      };
      setCartItems([...cartItems, newItem]);
      toast.success("Added to cart!", { id: "cart-toast" });
    }

    setCartDrawerOpen(true);
  };

  const updateQuantity = (productId, variantId, quantity) => {
    if (quantity < 1) return;
    const target = cartItems.find(
      (item) => item.productId === productId && (variantId ? item.variantId === variantId : !item.variantId)
    );
    if (target && quantity > target.stock) {
      toast.error("Maximum available stock reached (" + target.stock + ")", { id: "cart-toast" });
      return;
    }
    setCartItems(
      cartItems.map((item) => {
        if (item.productId === productId && (variantId ? item.variantId === variantId : !item.variantId)) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, variantId) => {
    setCartItems(
      cartItems.filter(
        (item) => !(item.productId === productId && (variantId ? item.variantId === variantId : !item.variantId))
      )
    );
    toast.success("Item removed from cart", { id: "cart-toast" });
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const applyCoupon = async (code) => {
    if (!code) return;
    try {
      const res = await api.post("/coupons/validate", {
        code,
        cartTotal: subtotal,
      });
      if (res.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponDiscount(res.data.discountAmount);
        toast.success("Coupon " + res.data.coupon.code + " applied! Saved ₹" + res.data.discountAmount);
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Invalid coupon code");
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast.success("Coupon removed");
  };

  // Pricing calculations
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalMrp = cartItems.reduce((acc, item) => acc + (item.mrp || item.price) * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal) + couponDiscount;

  const freeThreshold = shipping?.freeShippingThreshold || 999;
  const standardFee = shipping?.standardShippingFee || 49;
  const expressFee = shipping?.expressShippingFee || 119;

  let shippingFee = 0;
  if (deliveryOption === "express") {
    shippingFee = expressFee;
  } else {
    shippingFee = subtotal >= freeThreshold || cartItems.length === 0 ? 0 : standardFee;
  }

  const taxPct = tax?.taxPercentage || 5;
  const calculatedTax = Math.round(((subtotal - couponDiscount) * taxPct) / 100);
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee + calculatedTax);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, freeThreshold - subtotal);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount,
        subtotal,
        totalMrp,
        totalSavings,
        shippingFee,
        tax: calculatedTax,
        grandTotal,
        appliedCoupon,
        couponDiscount,
        deliveryOption,
        setDeliveryOption,
        freeShippingProgress,
        amountNeededForFreeShipping,
        cartDrawerOpen,
        setCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
