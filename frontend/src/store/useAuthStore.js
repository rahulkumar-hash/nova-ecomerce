import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("userToken") || "",
  isAuthenticated: !!localStorage.getItem("userToken"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.success) {
        const { user, accessToken } = res.data;
        localStorage.setItem("userToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token: accessToken, isAuthenticated: true, loading: false });
        toast.success("Welcome back, " + (user.name || "Customer") + "!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
      set({ loading: false });
      return false;
    }
  },

  register: async (name, email, password, phone = "") => {
    set({ loading: true });
    try {
      const res = await api.post("/auth/register", { name, email, password, phone });
      if (res.success) {
        const { user, accessToken } = res.data;
        localStorage.setItem("userToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token: accessToken, isAuthenticated: true, loading: false });
        toast.success("Account created successfully! Welcome to NovaStore 🎉");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
      set({ loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      set({ user: null, token: "", isAuthenticated: false });
      toast.success("Signed out successfully");
    }
  },

  addAddress: async (addressData) => {
    try {
      const res = await api.post("/auth/address", addressData);
      if (res.success) {
        set({ user: res.data });
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success("New delivery address saved!");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to save address");
      return false;
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const res = await api.delete("/auth/address/" + addressId);
      if (res.success) {
        set({ user: res.data });
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success("Address removed");
        return true;
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove address");
      return false;
    }
  },
}));
