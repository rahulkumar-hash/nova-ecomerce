import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminCouponStore = create((set, get) => ({
  coupons: [],
  loading: false,

  fetchCoupons: async () => {
    set({ loading: true });
    try {
      const res = await adminApi.get("/coupons");
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        set({ coupons: list, loading: false });
        return list;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch coupons");
      return [];
    }
  },

  createCoupon: async (couponData) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/coupons", couponData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Coupon created successfully! 🎟️");
        get().fetchCoupons();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to create coupon");
      throw err;
    }
  },

  updateCoupon: async (id, couponData) => {
    set({ loading: true });
    try {
      const res = await adminApi.put(`/coupons/${id}`, couponData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Coupon updated successfully! ✨");
        get().fetchCoupons();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to update coupon");
      throw err;
    }
  },

  deleteCoupon: async (id) => {
    try {
      const res = await adminApi.delete(`/coupons/${id}`);
      if (res.success) {
        set((state) => ({
          coupons: state.coupons.filter((c) => c._id !== id),
        }));
        toast.success("Coupon deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete coupon");
      return false;
    }
  },
}));
