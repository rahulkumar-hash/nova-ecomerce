import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/product/ProductCard";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
          <div className="w-24 h-24 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your Wishlist is Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Explore items you love and save them to your wishlist to buy later or monitor discounts!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all"
          >
            Explore Catalog <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">My Wishlist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {wishlist.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
