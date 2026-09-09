import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  Sun, 
  Moon,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Clock
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItemsCount, setCartDrawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout, setAuthModalOpen } = useAuth();
  const { settings, isDark, toggleDarkMode } = useTheme();

  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("novastore_recent_searches");
      return saved ? JSON.parse(saved) : ["Wireless Earbuds", "Smartwatch", "Casual Shoes", "Backpack"];
    } catch {
      return ["Wireless Earbuds", "Smartwatch", "Casual Shoes", "Backpack"];
    }
  });

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem("novastore_recent_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecentSearches = (e) => {
    e?.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("novastore_recent_searches");
    } catch {}
  };

  const handleRecentClick = (term) => {
    saveRecentSearch(term);
    setSearchQuery(term);
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    navigate("/shop?search=" + encodeURIComponent(term));
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get("/categories");
        if (res.success) {
          setCategories(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          const res = await api.get("/products?search=" + encodeURIComponent(searchQuery) + "&limit=5");
          if (res.success) {
            const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
            setSuggestions(list);
          }
        } catch (e) {
          setSuggestions([]);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    saveRecentSearch(searchQuery);
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    navigate("/shop?search=" + encodeURIComponent(searchQuery));
  };

  const safeCats = Array.isArray(categories) ? categories : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

  return (
    <>
      {/* 1. Top Announcement Notice (High-contrast slate-900 with clear readable text, hidden on mobile) */}
      <div className="hidden sm:block bg-slate-900 text-white dark:bg-slate-950 text-xs font-semibold py-1.5 px-3 text-center tracking-wide overflow-hidden truncate border-b border-slate-800">
        🎉 Free Express Delivery on orders above ₹{settings?.shipping?.freeShippingThreshold || 500} | Use Code <span className="underline font-bold text-amber-300">WELCOME15</span> for 15% OFF
      </div>

      {/* 2. Main Header (Sticky and Fixed to Top-0) */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border-b border-slate-200/80 dark:border-slate-800 transition-colors w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-4">
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1 sm:p-2 sm:-ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shadow-primary/30 group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col min-w-0 max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                  <span className="text-sm sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-primary transition-colors truncate">
                    {settings?.storeName || "NovaStore"}
                  </span>
                  <span className="hidden sm:block text-xs text-slate-700 dark:text-slate-300 font-semibold tracking-widest uppercase mt-0.5 truncate">
                    {settings?.tagline || "Multi-Category Store"}
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg relative mx-4">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search products, brands, clothing, electronics..."
                  className="w-full pl-10 pr-20 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  aria-label="Submit search query"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Autocomplete & Recent Searches Dropdown */}
              {showSuggestions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-20 space-y-3">
                    {/* If search query entered and suggestions exist */}
                    {searchQuery.trim().length > 1 && safeSuggestions.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                          Matching Products
                        </div>
                        {safeSuggestions.map((p) => (
                          <Link
                            key={p._id}
                            to={"/product/" + p.slug}
                            onClick={() => {
                              saveRecentSearch(p.name);
                              setShowSuggestions(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <img
                              src={p.thumbnail || (Array.isArray(p.images) && p.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64"}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                              <p className="text-xs font-mono font-semibold text-primary">
                                ₹{p.price?.toLocaleString()}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      /* Feature 8: Recent Searches Dropdown */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Clock size={13} className="text-primary" />
                            <span>Recent Searches</span>
                          </div>
                          {recentSearches.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearRecentSearches}
                              className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {recentSearches.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((term, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleRecentClick(term)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                              >
                                <span>{term}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 px-1">No recent searches yet.</p>
                        )}

                        {/* Trending Suggestions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block mb-1.5">
                            Popular Now
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {["Smartphones", "Running Shoes", "Earbuds", "Jackets"].map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleRecentClick(item)}
                                className="px-2.5 py-1 rounded-lg bg-primary/5 hover:bg-primary/15 text-primary text-[11px] font-semibold transition-colors"
                              >
                                🔥 {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile Search Button */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Dark Mode Toggle - Visible on sm+ screens, also available in mobile drawer */}
              <button
                onClick={toggleDarkMode}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle theme"
              >
                {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
              </button>

              {/* Wishlist Link - Visible on sm+ screens, also accessible in mobile drawer */}
              <Link
                to="/wishlist"
                aria-label={`View wishlist (${wishlistCount} items)`}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                title="Wishlist"
              >
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                aria-label={`Open shopping cart (${totalItemsCount} items)`}
                className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                title="Cart"
              >
                <ShoppingBag size={18} />
                {totalItemsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[10px] sm:text-xs font-black flex items-center justify-center animate-pulse">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* User Account / Login */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="User account menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-1 p-1 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-slate-900 dark:text-white max-w-[80px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown size={13} className="text-slate-400 hidden sm:inline" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-30 space-y-1 text-xs">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 mb-1">
                          <div className="w-8 h-8 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                        >
                          My Profile & Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                        >
                          My Wishlist
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Sign In"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <User size={14} />
                  <span className="sr-only sm:not-sr-only sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Category Navigation Strip */}
          <div className="hidden lg:flex items-center justify-center gap-8 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Link to="/shop" className="hover:text-primary transition-colors">
              All Products
            </Link>
            {safeCats.map((cat) => (
              <Link
                key={cat._id}
                to={"/shop?category=" + cat.slug}
                className="hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link to="/shop?sort=popular" className="text-amber-800 dark:text-amber-400 font-bold hover:underline flex items-center gap-1">
              <span>🔥 Flash Deals</span>
            </Link>
          </div>
        </div>

        {/* Mobile Inline Search Bar (Drop down on toggle) */}
        {mobileSearchOpen && (
          <div
            className="md:hidden border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-200"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                autoFocus
                placeholder="Search products, brands, mobile..."
                className="w-full pl-10 pr-20 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                aria-label="Submit mobile search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                Go
              </button>
            </form>

            {/* Mobile suggestions & Recent Searches */}
            {showSuggestions && (
              <div className="mt-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 space-y-2">
                {searchQuery.trim().length > 1 && safeSuggestions.length > 0 ? (
                  safeSuggestions.map((p) => (
                    <Link
                      key={p._id}
                      to={"/product/" + p.slug}
                      onClick={() => {
                        saveRecentSearch(p.name);
                        setShowSuggestions(false);
                        setMobileSearchOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <img
                        src={p.thumbnail || (Array.isArray(p.images) && p.images[0])}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs font-mono text-primary font-semibold">₹{p.price?.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> Recent Searches
                      </span>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearRecentSearches}
                          className="text-[10px] text-slate-400 hover:text-rose-500"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRecentClick(term)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modern Slide-In Mobile Drawer (Pure CSS transition - 0 KB Framer Motion overhead) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Sliding Drawer Container */}
          <div
            className="relative w-[85vw] max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-300 ease-out animate-in slide-in-from-left"
          >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    {settings?.storeName || "NovaStore"}
                  </span>
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleDarkMode}
                    aria-label="Toggle theme"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Search in Drawer */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any product..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </form>

                {/* Categories List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Product Categories
                  </span>
                  <div className="space-y-1">
                    <Link
                      to="/shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <span>🔥 View All Products</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    {safeCats.map((c) => (
                      <Link
                        key={c._id}
                        to={"/shop?category=" + c.slug}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>{c.name}</span>
                        <ChevronRight size={13} className="text-slate-400" />
                      </Link>
                    ))}

                    <Link
                      to="/shop?sort=popular"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      <span>⚡ Flash Sale Deals</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Customer Account shortcuts */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Account & Shortcuts
                  </span>
                  <div className="space-y-1">
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2"><ShoppingBag size={14} /> My Cart</span>
                      {totalItemsCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">{totalItemsCount}</span>}
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2"><Heart size={14} /> My Wishlist</span>
                      {wishlistCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">{wishlistCount}</span>}
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2"><User size={14} /> My Orders & Profile</span>
                      <ChevronRight size={13} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/contact-us"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span>Help & Customer Support</span>
                      <ChevronRight size={13} className="text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Drawer Footer with Auth Status */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <User size={15} /> Sign In to Your Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
}
