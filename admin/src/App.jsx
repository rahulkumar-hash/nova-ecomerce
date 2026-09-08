import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAdminAuthStore } from "./store/useAdminAuthStore";
import { AdminThemeProvider } from "./context/AdminThemeContext";

import Layout from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import ProductPage from "./pages/products/ProductPage";
import AddEditProduct from "./pages/products/AddEditProduct";
import Category from "./pages/category/Category";
import OrderList from "./pages/Orders/OrderList";
import OrderDetail from "./pages/Orders/OrderDetail";
import Couponlist from "./pages/Coupons/Couponlist";
import Bannerpage from "./pages/banners/Bannerpage";
import ThemeSettings from "./pages/Setting/ThemeSettings";
import StoreSettings from "./pages/Setting/StoreSettings";
import WarehouseInvoiceSettings from "./pages/Setting/WarehouseInvoiceSettings";
import Userlist from "./pages/users/Userlist";
import ReviewsPage from "./pages/Reviews/ReviewsPage";
import PagesManager from "./pages/Pages/PagesManager";
import AdminProfile from "./pages/Profile/AdminProfile";
import SubscriberList from "./pages/Subscribers/SubscriberList";
import QuestionsManager from "./pages/Questions/QuestionsManager";
import SalesGSTReports from "./pages/Reports/SalesGSTReports";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuthStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuthStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "12px",
            },
          }}
        />
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="products/new" element={<AddEditProduct />} />
            <Route path="products/edit/:id" element={<AddEditProduct />} />
            <Route path="categories" element={<Category />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="reports" element={<SalesGSTReports />} />
            <Route path="sales-reports" element={<SalesGSTReports />} />
            <Route path="coupons" element={<Couponlist />} />
            <Route path="banners" element={<Bannerpage />} />
            <Route path="theme" element={<ThemeSettings />} />
            <Route path="pages" element={<PagesManager />} />
            <Route path="settings" element={<StoreSettings />} />
            <Route path="warehouse-invoice" element={<WarehouseInvoiceSettings />} />
            <Route path="invoice-settings" element={<WarehouseInvoiceSettings />} />
            <Route path="customers" element={<Userlist />} />
            <Route path="subscribers" element={<SubscriberList />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="questions" element={<QuestionsManager />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminThemeProvider>
    </BrowserRouter>
  );
}
