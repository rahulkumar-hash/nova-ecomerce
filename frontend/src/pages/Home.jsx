import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Star, 
  Tag, 
  Award, 
  Percent, 
  Mail, 
  Zap, 
  ShoppingBag 
} from "lucide-react";
import HeroSlider from "../components/home/HeroSlider";
import FlashSaleBanner from "../components/home/FlashSaleBanner";
import ProductCard from "../components/product/ProductCard";
import SEO from "../components/common/SEO";
import api from "../services/api";
import toast from "react-hot-toast";

const DEFAULT_HERO_BANNER = [
  {
    _id: "default-hero-lcp",
    title: "The Future of Tech is Here",
    subtitle: "Experience next-gen speed with Apex Phone 16 Pro Max",
    tag: "FLAGSHIP LAUNCH",
    image: "/images/hero-tech-mobile.webp",
    link: "/shop",
    buttonText: "Explore Flagship",
    badgeColor: "#4338ca",
  },
];

export default function Home() {
  const [banners, setBanners] = useState(DEFAULT_HERO_BANNER);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [bannerRes, catRes, prodRes] = await Promise.all([
          api.get("/banners?type=hero_slider"),
          api.get("/categories"),
          api.get("/products?limit=16"),
        ]);
        if (bannerRes.success) {
          setBanners(Array.isArray(bannerRes.data) ? bannerRes.data : []);
        }
        if (catRes.success) {
          setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        }
        if (prodRes.success) {
          const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
          setFeaturedProducts(prods);
          setTrendingProducts(prods.filter((p) => p.isTrending || p.isBestSeller));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const safeFeatured = Array.isArray(featuredProducts) ? featuredProducts : [];
  const safeTrending = Array.isArray(trendingProducts) ? trendingProducts : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBanners = Array.isArray(banners) ? banners : [];
  const popularCategories = safeCategories.filter((c) => c.isFeatured === true);

  const displayedProducts =
    activeTab === "all"
      ? safeFeatured
      : activeTab === "trending"
      ? (safeTrending.length > 0 ? safeTrending : safeFeatured)
      : safeFeatured.filter((p) => p.category?.slug === activeTab);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.trim()) return;

    setSubscribing(true);
    try {
      const res = await api.post("/subscribers/subscribe", { email: emailInput.trim() });
      if (res.success) {
        setSubscribed(true);
        toast.success(res.message || "🎉 Welcome to VIP Club! We've sent coupon WELCOME15 to your email!");
        setEmailInput("");
      } else {
        toast.error(res.message || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      toast.error(err.message || "Subscription failed. Please check your email address.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-14 pb-16 w-full max-w-full overflow-x-hidden">
      <SEO
        title="Premium Online Shopping for Electronics, Fashion & Essentials"
        description="Shop the latest electronics, premium fashion, lifestyle gadgets, and footwear at NovaStore. Enjoy free express shipping, secure payments, and 7-day easy returns."
        url="/"
      />

      {/* 1. Hero Banners Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-6 w-full">
        <HeroSlider banners={safeBanners} />
      </section>

      {/* 2. Value Proposition Trust Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-2.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3.5 p-1 sm:p-2 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Free Fast Shipping</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1 sm:p-2 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">100% Authentic</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Direct genuine brand</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1 sm:p-2 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">7-Day Returns</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Hassle-free refund</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1 sm:p-2 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Headphones size={18} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">24/7 VIP Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Dedicated assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Explore smartphones, accessories, fashion & audio
            </p>
          </div>
          <Link to="/shop" className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 min-h-[170px] sm:min-h-[210px]">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 flex flex-col items-center text-center space-y-2 sm:space-y-3 animate-pulse">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))
          ) : (
            popularCategories.map((cat) => (
            <Link
              key={cat._id}
              to={"/shop?category=" + cat.slug}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center space-y-2 sm:space-y-3"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200"}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 w-full">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {cat.description || "Explore collection"}
                </p>
              </div>
            </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. Flash Deals Countdown Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-auto-banner w-full">
        <FlashSaleBanner />
      </section>

      {/* 5. Tabbed Product Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-auto-catalog w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Discover flagship devices with customizable variants & warranty
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full w-full min-w-0 bg-slate-100 dark:bg-slate-800 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={"px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all whitespace-nowrap " + (activeTab === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab("trending")}
              className={"px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all whitespace-nowrap " + (activeTab === "trending" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
            >
              🔥 Hot Deals
            </button>
            {safeCategories.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveTab(c.slug)}
                className={"px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all " + (activeTab === c.slug ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {displayedProducts.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900 dark:text-white text-sm">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {displayedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Promotional Split Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Promo Card 1: Electronics */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-4 sm:p-8 text-white border border-indigo-500/20 shadow-xl flex flex-col justify-between min-h-[220px] sm:min-h-[260px] group">
            <div className="relative z-10 max-w-sm">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-2 sm:mb-3 inline-block">
                Next-Gen Audio & Smart Tech
              </span>
              <h3 className="text-xl sm:text-2xl font-black leading-tight text-white mb-1.5 sm:mb-2">
                Elevate Your Sound & Performance
              </h3>
              <p className="text-xs text-indigo-200 mb-4 sm:mb-6">
                Active Noise Cancellation & 40hr Battery. Up to 40% OFF with code WELCOME15.
              </p>
            </div>
            <div className="relative z-10">
              <Link
                to="/shop?category=smartphones"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-950 hover:bg-indigo-300 transition-colors shadow-lg"
              >
                Shop Electronics <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Promo Card 2: Accessories */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-900 via-slate-900 to-rose-950 p-4 sm:p-8 text-white border border-amber-500/20 shadow-xl flex flex-col justify-between min-h-[220px] sm:min-h-[260px] group">
            <div className="relative z-10 max-w-sm">
              <span className="px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 text-xs font-extrabold uppercase tracking-wider mb-2 sm:mb-3 inline-block">
                Premium Accessories
              </span>
              <h3 className="text-xl sm:text-2xl font-black leading-tight text-white mb-1.5 sm:mb-2">
                GaN Fast Chargers & MagSafe Stands
              </h3>
              <p className="text-xs text-amber-200 mb-4 sm:mb-6">
                Braided cables, 65W chargers & protective aerospace cases.
              </p>
            </div>
            <div className="relative z-10">
              <Link
                to="/shop?category=accessories"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg"
              >
                Shop Accessories <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-auto-trust w-full">
        <div className="p-4 sm:p-12 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
          <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-2 inline-block border border-indigo-200 dark:border-indigo-800/60">
              Why Customers Love Us
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              A Superior Shopping Experience Built for Quality
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Every device is verified and safely packed with express priority courier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-left">
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Award size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Certified Brand Quality</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Direct authorized vendor distribution ensures 100% brand warranty and authentic components.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Zap size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Same-Day Dispatch</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Orders placed before 2 PM are packaged and dispatched with express priority air couriers.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Percent size={20} className="sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Direct Price Savings</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Zero middleman markups. Wholesale direct savings, verified promo coupons, and bundled flash discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VIP Newsletter Subscription Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-auto w-full">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-4 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-white">
              <Mail size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Unlock Flat 15% OFF On Your First Order
            </h2>
            <p className="text-xs text-white/90 max-w-lg mx-auto">
              Join our exclusive VIP club to receive instant flash sale alerts, private coupon drops, and new arrivals.
            </p>

            {subscribed ? (
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md font-bold text-xs sm:text-sm text-white inline-flex items-center gap-2">
                <CheckCircle2 size={16} /> You are on the VIP list! Use coupon <span className="underline font-mono">WELCOME15</span> at checkout.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none shadow-md font-medium"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-950 text-white hover:bg-slate-900 shadow-md transition-colors whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {subscribing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <span>Join VIP Club</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
