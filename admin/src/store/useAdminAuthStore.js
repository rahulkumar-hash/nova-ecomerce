import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminAuthStore = create((set, get) => ({
  admin: (() => {
    try {
      const saved = localStorage.getItem("adminUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem("adminToken") || null,
  isAuthenticated: !!localStorage.getItem("adminToken"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/admin/login", { email, password });
      if (res.success && res.data) {
        const { admin, token } = res.data;
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(admin));
        set({ admin, token, isAuthenticated: true, loading: false });
        toast.success(`Welcome back, ${admin.name}! 👋`);
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Invalid admin credentials");
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    set({ admin: null, token: null, isAuthenticated: false, loading: false });
    toast.success("Logged out successfully");
  },

  fetchProfile: async () => {
    try {
      const res = await adminApi.get("/admin/me");
      if (res.success && res.data) {
        set({ admin: res.data });
        localStorage.setItem("adminUser", JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true });
    try {
      const res = await adminApi.put("/admin/profile", profileData);
      if (res.success && res.data) {
        set({ admin: res.data, loading: false });
        localStorage.setItem("adminUser", JSON.stringify(res.data));
        toast.success("Profile updated successfully! ✨");
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to update profile");
      return false;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true });
    try {
      const res = await adminApi.put("/admin/change-password", {
        currentPassword,
        newPassword,
      });
      set({ loading: false });
      if (res.success) {
        toast.success("Password changed successfully! 🔐");
        return true;
      }
      return false;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to change password");
      return false;
    }
  },
}));
