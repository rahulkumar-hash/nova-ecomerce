import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingBag,
  Heart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Share2,
  Sparkles,
  Award,
  ChevronRight,
  HelpCircle,
  Bell,
  MapPin,
  X
} from "lucide-react";
import ImageGallery from "../components/product/ImageGallery";
import VariantSelector from "../components/product/VariantSelector";
import ProductCard from "../components/product/ProductCard";
import ProductReviews from "../components/product/ProductReviews";
import ProductQA from "../components/product/ProductQA";
import { checkPincodeDelivery, getSavedPincode } from "../utils/pincodeService";
import SEO from "../components/common/SEO";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currency, settings } = useTheme();
  const { user, isAuthenticated, setAuthModalOpen } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // description, specs, reviews
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pincode Delivery Estimator State
  const [pincodeInput, setPincodeInput] = useState(getSavedPincode() || "");
  const [pincodeResult, setPincodeResult] = useState(() => {
    const saved = getSavedPincode();
    return saved ? checkPincodeDelivery(saved) : null;
  });

  // Out of stock Notification State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(user?.email || "");
  const [notifySubmitting, setNotifySubmitting] = useState(false);

  const symbol = currency?.symbol || "₹";

  const handleCheckPincode = (e) => {
    e?.preventDefault();
    if (!pincodeInput.trim()) {
      toast.error("Please enter a 6-digit Pincode");
      return;
    }
    const res = checkPincodeDelivery(pincodeInput);
    if (!res.valid) {
      toast.error(res.message);
    } else {
      setPincodeResult(res);
      toast.success(res.message);
    }
  };

  const handleSubscribeStockAlert = async (e) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setNotifySubmitting(true);
      const res = await api.post(`/products/${product._id}/notify-stock`, {
        email: notifyEmail.trim(),
        variantId: selectedVariant?.sku || selectedVariant?._id || "",
      });
      if (res.success) {
        toast.success(res.message || "Restock alert registered!");
        setShowNotifyModal(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to register alert");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/" + slug);
      if (res.success) {
        const p = res.data.product;
        setProduct(p);
        setRelatedProducts(Array.isArray(res.data.relatedProducts) ? res.data.relatedProducts : []);

        if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
          const firstVariant = p.variants[0];
          setSelectedVariant(firstVariant);

          const initialAttrs = {};
          if (Array.isArray(firstVariant.attributes)) {
            firstVariant.attributes.forEach((attr) => {
              initialAttrs[attr.name] = attr.value;
            });
          }
          setSelectedAttributes(initialAttrs);
        }

        // Fetch reviews for product
        fetchReviews(p._id || slug);
      }
    } catch (err) {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (identifier) => {
    try {
      const res = await api.get("/reviews/product/" + identifier);
      if (res.success) {
        setReviews(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  // Handle attribute changes and match matching variant combination
  const handleSelectAttribute = (attrName, attrValue) => {
    const updated = { ...selectedAttributes, [attrName]: attrValue };
    setSelectedAttributes(updated);

    if (product?.hasVariants && Array.isArray(product.variants)) {
      const match = product.variants.find((v) => {
        return Object.entries(updated).every(([key, val]) => {
          return Array.isArray(v.attributes) && v.attributes.some((a) => a.name === key && a.value === val);
        });
      });
      if (match) setSelectedVariant(match);
    }
  };

  const handleAddToCart = () => {
    if (product?.hasVariants && !selectedVariant) {
      toast.error("Please select product options");
      return;
    }
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleReviewAdded = (newReview, updatedList) => {
    setReviews(updatedList);
    // Recalculate rating on UI
    if (product) {
      const avg = (updatedList.reduce((acc, r) => acc + (r.rating || 5), 0) / updatedList.length).toFixed(1);
      setProduct((prev) => ({
        ...prev,
        rating: Number(avg),
        reviewsCount: updatedList.length,
      }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading product details...</span>
      </div>
    );
  }

  if (!product) return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
      <p className="text-xs text-slate-500">The product you requested might have been moved or removed.</p>
      <Link to="/shop" className="inline-block px-6 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs">
        Browse Products
      </Link>
    </div>
  );

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const isLiked = isInWishlist(product._id);
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const safeRelated = Array.isArray(relatedProducts) ? relatedProducts : [];
  const safeSpecs = Array.isArray(product.specifications) ? product.specifications : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-8 sm:space-y-12 pb-24 lg:pb-12">
      <SEO
        title={product.name}
        description={product.shortDescription || product.description?.slice(0, 160) || `Buy ${product.name} online at best price on NovaStore.`}
        image={product.thumbnail || (Array.isArray(product.images) && product.images[0])}
        url={`/product/${product.slug}`}
        type="product"
        product={product}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: product.category?.name || "Shop", url: `/shop?category=${product.category?.slug || ""}` },
          { name: product.name, url: `/product/${product.slug}` },
        ]}
      />

      {/* Breadcrumbs */}
      <nav className="text-xs font-semibold text-slate-400 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 max-w-full w-full min-w-0">
        <Link to="/" className="hover:text-slate-900 dark:hover:text-white shrink-0">Home</Link>
        <span>/</span>
        <Link to={"/shop?category=" + (product.category?.slug || "")} className="hover:text-slate-900 dark:hover:text-white shrink-0">
          {product.category?.name || "Shop"}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-md">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
        {/* Left: Gallery */}
        <div className="sticky top-20">
          <ImageGallery images={Array.isArray(product.images) ? product.images : []} thumbnail={product.thumbnail} />
        </div>

        {/* Right: Product Info & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-primary">
                {product.brand || "Official Store"}
              </span>
              <div className="flex items-center gap-3">
                {currentSku && <span className="font-mono text-slate-400 text-[11px]">SKU: {currentSku}</span>}
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Share product"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl">
                <Star size={14} fill="currentColor" />
                <span>{product.rating || "4.8"}</span>
              </div>
              <button
                onClick={() => setActiveTab("reviews")}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
              >
                ({product.reviewsCount || safeReviews.length || 48} customer reviews)
              </button>
            </div>
          </div>

          {/* Pricing & Savings Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {symbol}{currentPrice?.toLocaleString()}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-mono">
                  {symbol}{currentMrp?.toLocaleString()}
                </span>
              )}
            </div>
            {currentMrp > currentPrice && (
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold text-white bg-primary shadow-sm">
                {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Stock Alert */}
          <div>
            {currentStock > 0 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                <span>In Stock ({currentStock} units available)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                <span>Currently Out of Stock</span>
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <VariantSelector
                variants={product.variants}
                selectedAttributes={selectedAttributes}
                onSelectAttribute={handleSelectAttribute}
              />
            </div>
          )}

          {/* Feature 3: Pincode Delivery & COD Estimator */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MapPin size={15} className="text-primary" />
                <span>Delivery Options & Estimated Time</span>
              </div>
              {pincodeResult?.valid && (
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              )}
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit Pincode (e.g. 110001)"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors shadow-sm shrink-0"
              >
                Check
              </button>
            </form>

            {pincodeResult?.valid && (
              <div className="text-xs space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Truck size={14} className="text-primary shrink-0" />
                  <span>
                    Delivering to <strong className="text-slate-900 dark:text-white font-semibold">{pincodeResult.city}, {pincodeResult.state}</strong> by <strong className="text-primary font-bold">{pincodeResult.deliveryDate}</strong> ({pincodeResult.estimatedDays})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Cash on Delivery (COD) is {pincodeResult.codAvailable ? <strong className="text-emerald-600 dark:text-emerald-400">Available</strong> : <strong className="text-rose-500">Not Available</strong>} for this location</span>
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Desktop CTA Actions */}
          <div className="space-y-3 pt-2">
            {currentStock > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-900 dark:text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={18} /> Add to Cart
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={"p-3.5 rounded-2xl border transition-all " + (isLiked ? "border-rose-500 bg-rose-50 text-rose-500 dark:bg-rose-950/40" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}
                  >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={18} /> Instant Buy Now
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setShowNotifyModal(true)}
                  className="w-full py-4 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Bell size={18} /> Notify Me When Available
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={"flex-1 py-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all " + (isLiked ? "border-rose-500 bg-rose-50 text-rose-500 dark:bg-rose-950/40" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}
                  >
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {isLiked ? "Saved in Wishlist" : "Save to Wishlist"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <Truck size={18} className="text-primary" />
              <span>Express Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span>100% Genuine</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw size={18} className="text-amber-500" />
              <span>7 Days Return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Reviews, Q&A */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 sm:space-x-8 mb-6 overflow-x-auto whitespace-nowrap">
          {[
            { id: "description", label: "Description" },
            { id: "specs", label: "Specifications & Details" },
            { id: "reviews", label: "Reviews (" + safeReviews.length + ")" },
            { id: "qa", label: "Questions & Answers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"pb-3 font-bold text-xs sm:text-sm transition-all border-b-2 " + (activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {product.description || "No detailed description provided for this product."}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {safeSpecs.length > 0 ? (
              safeSpecs.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{s.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{s.value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Standard specifications apply.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <ProductReviews
            productId={product._id}
            initialReviews={safeReviews}
            avgRating={product.rating}
            totalReviews={product.reviewsCount}
            onReviewAdded={handleReviewAdded}
          />
        )}

        {activeTab === "qa" && (
          <ProductQA productId={product._id} />
        )}
      </div>

      {/* Related Products */}
      {safeRelated.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Related Products
            </h2>
            <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {safeRelated.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Floating Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {symbol}{currentPrice?.toLocaleString()}
            </span>
            {currentMrp > currentPrice && (
              <span className="text-[10px] text-slate-400 line-through font-mono">
                {symbol}{currentMrp?.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">
            {currentStock > 0 ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentStock > 0 ? (
            <>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 flex items-center gap-1.5"
              >
                <ShoppingBag size={14} /> Add
              </button>
              <button
                onClick={handleBuyNow}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md flex items-center gap-1.5"
              >
                <Zap size={14} /> Buy Now
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowNotifyModal(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-1.5"
            >
              <Bell size={14} /> Notify Me
            </button>
          )}
        </div>
      </div>

      {/* Feature 4: Restock Alert / Notify Me Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowNotifyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Get Restock Alert
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We'll email you the moment this item is back in stock.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <img
                src={product.thumbnail?.url || "/placeholder.png"}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                {selectedVariant && (
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Selected: {Object.values(selectedAttributes).join(" / ")}
                  </p>
                )}
                <p className="text-xs font-mono font-bold text-primary">{symbol}{currentPrice?.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleSubscribeStockAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notifySubmitting}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {notifySubmitting ? "Subscribing..." : "Notify Me"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
