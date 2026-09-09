import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Filter, 
  SlidersHorizontal, 
  Search, 
  Grid, 
  List, 
  X, 
  ShoppingBag, 
  ArrowUpDown, 
  Check, 
  RotateCcw, 
  Sparkles,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  TrendingUp,
  Star,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/product/ProductCard";
import SEO from "../components/common/SEO";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest Arrivals", icon: Sparkles, color: "text-amber-500" },
  { id: "price-low", label: "Price: Low to High", icon: ArrowDownWideNarrow, color: "text-emerald-500" },
  { id: "price-high", label: "Price: High to Low", icon: ArrowUpWideNarrow, color: "text-indigo-500" },
  { id: "popular", label: "Most Popular", icon: TrendingUp, color: "text-rose-500" },
  { id: "rating", label: "Top Rated", icon: Star, color: "text-amber-400" },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency } = useTheme();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStockOnly") === "true");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Mobile Filter Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const symbol = currency?.symbol || "₹";

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products/brands"),
        ]);
        if (catRes.success) {
          setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        }
        if (brandRes.success) {
          setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const catParam = searchParams.get("category") || "";
    const searchParam = searchParams.get("search") || "";
    const brandParam = searchParams.get("brand") || "";
    setSelectedCategory(catParam);
    setSearch(searchParam);
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        let query = "?page=" + page + "&limit=16&sort=" + sort;
        if (selectedCategory) query += "&category=" + encodeURIComponent(selectedCategory);
        if (selectedBrand) query += "&brand=" + encodeURIComponent(selectedBrand);
        if (search) query += "&search=" + encodeURIComponent(search);
        if (minPrice) query += "&minPrice=" + minPrice;
        if (maxPrice) query += "&maxPrice=" + maxPrice;
        if (inStockOnly) query += "&inStockOnly=true";

        const res = await api.get("/products" + query);
        if (res.success) {
          const prods = Array.isArray(res.data) ? res.data : (res.data?.products || []);
          setProducts(prods);
          setPagination({ 
            total: res.data?.total || prods.length, 
            pages: res.data?.pages || 1, 
            page: res.data?.page || 1 
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory, selectedBrand, search, sort, minPrice, maxPrice, inStockOnly, page]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSearchParams({});
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setPage(1);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  // Count how many non-default filters are active
  const activeFilterCount = [
    selectedCategory,
    selectedBrand,
    search,
    minPrice,
    maxPrice,
    inStockOnly,
  ].filter(Boolean).length;

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-10 space-y-4 sm:space-y-6">
      <SEO
        title={selectedCategory ? `Shop ${selectedCategory} Collection` : search ? `Search: "${search}"` : "Shop All Products"}
        description="Browse our complete collection of electronics, fashion, footwear, and accessories with exclusive discounts, genuine brand warranty, and fast shipping."
        url="/shop"
      />

      {/* 1. Header & Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 sm:pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Shop Catalog
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {safeProducts.length} of {pagination.total} products
            {selectedCategory && (
              <span className="ml-1 text-primary font-bold">
                in "{safeCategories.find(c => c.slug === selectedCategory)?.name || selectedCategory}"
              </span>
            )}
          </p>
        </div>

        {/* Desktop Sort Selector */}
        <div className="hidden lg:flex items-center gap-2 relative">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sort By:</label>
          <div className="relative">
            <button
              onClick={() => setSortModalOpen(!sortModalOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white hover:border-primary transition-all shadow-xs cursor-pointer"
            >
              {(() => {
                const current = SORT_OPTIONS.find((s) => s.id === sort) || SORT_OPTIONS[0];
                const Icon = current.icon;
                return (
                  <>
                    <Icon size={14} className={current.color} />
                    <span>{current.label}</span>
                    <ChevronDown size={14} className="text-slate-400 ml-1" />
                  </>
                );
              })()}
            </button>
            {sortModalOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSortModalOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-30 space-y-1">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = sort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSort(opt.id);
                          setSortModalOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className={opt.color} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check size={15} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Mobile Fast Category Pills Carousel (Instant 1-Tap Switching) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full w-full min-w-0 scrollbar-none">
        <button
          onClick={() => handleCategorySelect("")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            !selectedCategory
              ? "bg-primary text-white shadow-md shadow-primary/20 scale-102"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          }`}
        >
          All Items
        </button>

        {safeCategories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => handleCategorySelect(cat.slug)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === cat.slug
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-102"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 3. Mobile Compact Action Bar (Filter button + Sort dropdown) */}
      <div className="lg:hidden flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Mobile Filter Button */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <SlidersHorizontal size={14} className="text-primary" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Custom Sort Button (Theme-aware, no emojis, clean Lucide icons) */}
        <button
          onClick={() => setSortModalOpen(true)}
          className="flex-1 flex items-center justify-between gap-1.5 py-2 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {(() => {
            const current = SORT_OPTIONS.find((s) => s.id === sort) || SORT_OPTIONS[0];
            const Icon = current.icon;
            return (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon size={14} className={current.color} />
                  <span className="truncate">{current.label}</span>
                </div>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </>
            );
          })()}
        </button>
      </div>

      {/* 4. Active Filter Tags Strip (If any) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Active Filters:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
              Category: {safeCategories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              <button onClick={() => handleCategorySelect("")} className="hover:text-primary-hover"><X size={12} /></button>
            </span>
          )}
          {selectedBrand && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
              Brand: {selectedBrand}
              <button onClick={() => setSelectedBrand("")} className="hover:text-primary-hover"><X size={12} /></button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
              Search: "{search}"
              <button onClick={() => setSearch("")} className="hover:text-primary-hover"><X size={12} /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
              Price: {minPrice ? `${symbol}${minPrice}` : "₹0"} - {maxPrice ? `${symbol}${maxPrice}` : "Max"}
              <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-primary-hover"><X size={12} /></button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              In Stock Only
              <button onClick={() => setInStockOnly(false)}><X size={12} /></button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-rose-500 hover:underline ml-1"
          >
            Reset All
          </button>
        </div>
      )}

      {/* 5. Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
        {/* Desktop Sidebar Filters (Hidden on Mobile) */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" /> Filter Options
              </span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:underline">
                  Reset
                </button>
              )}
            </div>

            {/* Categories Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Categories</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategorySelect("")}
                  className={"w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors " + (!selectedCategory ? "bg-primary text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  All Categories
                </button>
                {safeCategories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleCategorySelect(c.slug)}
                    className={"w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors " + (selectedCategory === c.slug ? "bg-primary text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Price Range ({symbol})</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Brands */}
            {safeBrands.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Brand</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {safeBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                      className={"w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors " + (selectedBrand === b ? "bg-primary text-white font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In Stock Only Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">In-Stock Items Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid (Instantly visible on mobile!) */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading catalog items...</span>
            </div>
          ) : safeProducts.length === 0 ? (
            <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6 sm:p-8 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-900 dark:text-white">No products found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your category or filter selections</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6">
              {safeProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 6. Modern Mobile Filter Drawer / Bottom Sheet */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-primary" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Filter Products
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-white">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* Categories */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Categories
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleCategorySelect("")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left ${
                        !selectedCategory ? "bg-primary text-white font-bold" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      All Items
                    </button>
                    {safeCategories.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleCategorySelect(c.slug)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left truncate ${
                          selectedCategory === c.slug ? "bg-primary text-white font-bold" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Price Range ({symbol})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Brands */}
                {safeBrands.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Brand
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {safeBrands.map((b) => (
                        <button
                          key={b}
                          onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            selectedBrand === b ? "bg-primary text-white font-bold" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Stock */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      In-Stock Items Only
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-2 py-3 rounded-2xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25"
                >
                  Show {pagination.total || safeProducts.length} Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sort Bottom Sheet (Theme-Aware: Dark in Dark Mode, Light in Light Mode) */}
      <AnimatePresence>
        {sortModalOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSortModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={16} className="text-primary" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Sort Products</h3>
                </div>
                <button
                  onClick={() => setSortModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-1.5 pt-1">
                {SORT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = sort === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSort(opt.id);
                        setSortModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 text-primary dark:bg-primary/20 border border-primary/30"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary text-white" : "bg-white dark:bg-slate-700 text-slate-500 shadow-xs"}`}>
                          <Icon size={16} className={isSelected ? "text-white" : opt.color} />
                        </div>
                        <span>{opt.label}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600"}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
