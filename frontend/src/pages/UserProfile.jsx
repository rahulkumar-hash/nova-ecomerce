import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  Trash2, 
  Printer, 
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Camera,
  Save,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import ImageUpload from "../components/common/ImageUpload";
import { confirmDelete, confirmAction } from "../utils/swal";

export default function UserProfile() {
  const { user, logout, isAuthenticated, addAddress, deleteAddress, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders"); // orders, addresses, profile
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  // Add Address Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get("/orders/my-orders");
      if (res.success) {
        const orderList = Array.isArray(res.data) ? res.data : res.data?.orders || [];
        setOrders(orderList);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const ok = await confirmAction("Cancel Order?", "Are you sure you want to cancel this order?", "Yes, Cancel Order");
    if (!ok) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.success) {
        toast.success("Order cancelled successfully");
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: "Cancelled" }));
        }
      }
    } catch (err) {
      toast.error(err.message || "Could not cancel order");
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (savingAddress) return;
    if (!newAddress.name?.trim() || !newAddress.phone?.trim() || !newAddress.street?.trim() || !newAddress.city?.trim() || !newAddress.pincode?.trim()) {
      toast.error("Please fill in all address fields");
      return;
    }

    const isDup = user?.addresses?.some(
      (a) =>
        a.street?.trim().toLowerCase() === newAddress.street.trim().toLowerCase() &&
        a.pincode?.trim() === newAddress.pincode.trim() &&
        a.phone?.trim() === newAddress.phone.trim()
    );
    if (isDup) {
      toast.error("This address is already in your saved addresses");
      return;
    }

    setSavingAddress(true);
    try {
      const success = await addAddress(newAddress);
      if (success) {
        setShowAddressModal(false);
        setNewAddress({
          name: user?.name || "",
          phone: user?.phone || "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        });
      }
    } finally {
      setSavingAddress(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    setSavingProfile(true);
    await updateProfile(profileForm);
    setSavingProfile(false);
  };

  const handleQuickAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP)");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingAvatar(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.success && res.data?.url) {
        setProfileForm((prev) => ({ ...prev, avatar: res.data.url }));
        await updateProfile({ avatar: res.data.url });
        toast.success("Profile photo updated successfully! 📸");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200",
      Processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
      Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200",
      Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
      Cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${config[status] || "bg-slate-100 text-slate-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hidden file input for quick avatar change */}
      <input
        type="file"
        ref={avatarFileRef}
        onChange={handleQuickAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden ring-4 ring-primary/20 bg-slate-800 shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>

            {/* Quick Camera Upload Button */}
            <button
              type="button"
              onClick={() => avatarFileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-md border-2 border-white dark:border-slate-900 transition-all cursor-pointer disabled:opacity-50"
              title="Change profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Camera size={13} />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                {user?.role || "Customer"}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {user?.email} • {user?.phone || "No phone linked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-sm"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
            }`}
          >
            <User className="w-4 h-4" /> Edit Profile
          </button>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: "orders", label: "My Orders", icon: Package, count: orders.length },
          { id: "addresses", label: "Saved Addresses", icon: MapPin, count: user?.addresses?.length || 0 },
          { id: "profile", label: "Profile & Settings", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-semibold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all relative shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === "orders" && (
        <div>
          {loadingOrders ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Orders Placed Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You have not ordered anything yet. Browse our store to get started!</p>
              <Link to="/shop" className="px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover text-sm">
                Explore Store
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(orders) ? orders : []).map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
                >
                  {/* Top Bar: Order ID, Status, and Total Price */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide">
                          #{ord.orderNumber}
                        </span>
                        {getStatusBadge(ord.orderStatus || ord.status || "Pending")}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {ord.paymentInfo?.method || ord.paymentMethod ? ` • ${ord.paymentInfo?.method || ord.paymentMethod}` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-extrabold text-primary font-mono">
                        ₹{(ord.pricing?.totalAmount ?? ord.totalAmount)?.toLocaleString()}
                      </p>
                      <span className="text-[10px] font-medium text-slate-400 block">
                        {ord.items?.length || 0} {(ord.items?.length === 1) ? "item" : "items"}
                      </span>
                    </div>
                  </div>

                  {/* Items thumbnail row */}
                  <div className="space-y-2">
                    {ord.items?.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80"
                      >
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {item.variantTitle && <span className="truncate max-w-[100px]">{item.variantTitle}</span>}
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{item.price?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {ord.items?.length > 3 && (
                      <p className="text-[11px] font-medium text-slate-500 pl-1">
                        + {ord.items.length - 3} more {ord.items.length - 3 === 1 ? "product" : "products"} in this order
                      </p>
                    )}
                  </div>

                  {/* Footer / Actions */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                      <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Delivery to {ord.shippingAddress?.city || "Saved Address"}, {ord.shippingAddress?.state || ""}</span>
                    </p>

                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
                      {ord.status === "Pending" && (
                        <button
                          onClick={() => handleCancelOrder(ord._id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                      <Link
                        to={`/order/${ord._id}`}
                        className="w-full sm:w-auto px-4 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === "addresses" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Saved Addresses</h2>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user?.addresses?.map((addr) => (
              <div
                key={addr._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{addr.phone}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => deleteAddress(addr._id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE SETTINGS */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Edit Form (7 cols on lg) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" /> Personal Information & Profile Photo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Update your display name, mobile contact number, email and profile picture
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Profile Photo Upload */}
              <div>
                <ImageUpload
                  label="Profile Picture / Avatar"
                  value={profileForm.avatar}
                  onChange={(url) => setProfileForm({ ...profileForm, avatar: url })}
                />
              </div>

              {/* Full Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Registered Email Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">Used for sign in & order receipts</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side Info Card (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm pb-2 border-b border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Account Overview</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Account Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Account Type:</span>
                  <span className="font-semibold text-slate-900 dark:text-white uppercase text-[11px]">
                    {user?.role || "Customer"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Total Orders:</span>
                  <span className="font-bold text-primary">{orders.length}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Saved Addresses:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {user?.addresses?.length || 0}
                  </span>
                </div>

                {user?.createdAt && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Member Since:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
              <p className="font-semibold text-primary flex items-center gap-1">
                <Sparkles size={13} /> Quick Profile Tip
              </p>
              <p>
                Click the camera icon on your profile avatar in the header to instantly upload a new profile picture from your phone or computer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Delivery Address</h3>
              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Street Address / House No</label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingAddress && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{savingAddress ? "Saving..." : "Save Address"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
