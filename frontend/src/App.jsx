import React, { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

// Layout & Global Overlays
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import PageSkeleton from "./components/common/PageSkeleton";
import MobileInstallBanner from "./components/common/MobileInstallBanner";

// Critical First-Paint Page
import Home from "./pages/Home";

// Lazy-Loaded Route Pages (Code-Split for High-Speed Performance)
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-Loaded Auth Pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Immediately synchronize active tab in Android native bottom nav
    try {
      if (window.Android && window.Android.onRouteChanged) {
        window.Android.onRouteChanged(pathname);
      }
    } catch (e) {}
  }, [pathname, search]);
  return null;
}

// Protected Route: Only authenticated users can access
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}

// Guest Route: Only non-logged-in users can access (Redirects logged-in users to /profile or redirect param)
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/profile";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirect} replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-primary selection:text-white">
      <ScrollToTop />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3500,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
          },
        }} 
      />

      <Navbar />

      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public Storefront Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<DynamicPage defaultSlug="privacy-policy" />} />
            <Route path="/terms-and-conditions" element={<DynamicPage defaultSlug="terms-and-conditions" />} />
            <Route path="/refund-policy" element={<DynamicPage defaultSlug="refund-policy" />} />
            <Route path="/shipping-policy" element={<DynamicPage defaultSlug="shipping-policy" />} />
            <Route path="/about-us" element={<DynamicPage defaultSlug="about-us" />} />
            <Route path="/page/:slug" element={<DynamicPage />} />

            {/* Protected Routes (Require Authentication) */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route 
              path="/order/:id" 
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order-details/:id" 
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              } 
            />

            {/* Guest Routes (Redirect to /profile if already logged in) */}
            <Route 
              path="/login" 
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <GuestRoute>
                  <SignupPage />
                </GuestRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              } 
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Global Drawers & Mobile App Banner */}
      <CartDrawer />
      <MobileInstallBanner />
    </div>
  );
}
