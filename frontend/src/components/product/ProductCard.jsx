import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Star, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useTheme } from "../../context/ThemeContext";

const getOptimizedThumbnail = (url, width = 400) => {
  if (!url) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=75";
  if (typeof url === "string" && url.includes("images.unsplash.com")) {
    let optimized = url.replace(/w=\d+/, `w=${width}`);
    if (!optimized.includes("w=")) {
      optimized += `${optimized.includes("?") ? "&" : "?"}w=${width}`;
    }
    if (!optimized.includes("auto=format")) {
      optimized += "&auto=format";
    }
    if (!optimized.includes("fit=crop")) {
      optimized += "&fit=crop";
    }
    if (optimized.includes("q=")) {
      optimized = optimized.replace(/q=\d+/, "q=75");
    } else {
      optimized += "&q=75";
    }
    return optimized;
  }
  return url;
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currency } = useTheme();

  if (!product) return null;

  const isLiked = isInWishlist(product._id);
  const symbol = currency?.symbol || "₹";

  const cartItem = cartItems?.find(
    (item) => item.productId === product._id || item.productId === product.id
  );

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants[0]
      : null;
    addToCart(product, defaultVariant, 1);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Thumbnail & Badges */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link to={"/product/" + product.slug} className="block w-full h-full">
          <img
            src={getOptimizedThumbnail(product.thumbnail || (Array.isArray(product.images) && product.images[0]))}
            alt={product.name || "Product"}
            loading="lazy"
            decoding="async"
            width="400"
            height="400"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=75";
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 items-start">
          {product.discount > 0 && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-xs font-bold text-white shadow-xs bg-emerald-800 dark:bg-emerald-800">
              {product.discount}% OFF
            </span>
          )}
          {product.hasVariants && (
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-900 text-white dark:bg-slate-800 backdrop-blur-xs border border-white/10">
              Options
            </span>
          )}
        </div>

        {/* Wishlist Heart Toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isLiked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={"absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-xl backdrop-blur-md transition-all shadow-sm cursor-pointer " + (isLiked ? "bg-rose-50 text-rose-500 dark:bg-rose-950/80 dark:text-rose-400" : "bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-rose-400")}
        >
          <Heart size={14} className="sm:w-4 sm:h-4" fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            <span className="font-semibold uppercase truncate max-w-[100px]">{product.brand || product.category?.name || "Official"}</span>
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold shrink-0">
              <Star size={12} fill="currentColor" />
              <span>{product.rating || "4.8"}</span>
            </div>
          </div>

          <Link to={"/product/" + product.slug} className="block group-hover:text-primary transition-colors">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price and Add CTA */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {symbol}{product.price?.toLocaleString()}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-600 dark:text-slate-400 line-through font-mono">
                  {symbol}{product.mrp?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {cartItem ? (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center bg-primary rounded-xl sm:rounded-2xl text-white shadow-md overflow-hidden shrink-0"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (cartItem.quantity > 1) {
                    updateQuantity(cartItem.productId, cartItem.variantId, cartItem.quantity - 1);
                  } else {
                    removeFromCart(cartItem.productId, cartItem.variantId);
                  }
                }}
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 hover:bg-primary-hover active:scale-90 transition-all font-bold text-xs"
                title="Decrease quantity"
              >
                <Minus size={12} className="stroke-[3]" />
              </button>
              <span className="px-1 text-xs sm:text-sm font-bold min-w-[18px] text-center font-mono select-none">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(cartItem.productId, cartItem.variantId, cartItem.quantity + 1);
                }}
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 hover:bg-primary-hover active:scale-90 transition-all font-bold text-xs"
                title="Increase quantity"
              >
                <Plus size={12} className="stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              aria-label={`Add ${product.name} to cart`}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-md bg-primary hover:bg-primary-hover transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer flex items-center justify-center"
              title="Add to Cart"
            >
              <ShoppingBag size={14} className="sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
