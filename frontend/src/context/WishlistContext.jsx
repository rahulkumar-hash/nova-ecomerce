import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("localWishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("localWishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product) => {
    const exists = wishlist.some((p) => p._id === product._id);
    if (exists) {
      setWishlist((prev) => prev.filter((p) => p._id !== product._id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist((prev) => [...prev, product]);
      toast.success("Added to wishlist ❤️");
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => p._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
