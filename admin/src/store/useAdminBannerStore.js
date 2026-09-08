import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminBannerStore = create((set, get) => ({
  banners: [],
  loading: false,

  fetchBanners: async (type = "") => {
    set({ loading: true });
    try {
      const query = type ? `?type=${type}` : "";
      const res = await adminApi.get(`/banners${query}`);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        set({ banners: list, loading: false });
        return list;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch banners");
      return [];
    }
  },

  createBanner: async (bannerData) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/banners", bannerData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Banner created successfully! 🎨");
        get().fetchBanners();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to create banner");
      throw err;
    }
  },

  updateBanner: async (id, bannerData) => {
    set({ loading: true });
    try {
      const res = await adminApi.put(`/banners/${id}`, bannerData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Banner updated successfully! ✨");
        get().fetchBanners();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to update banner");
      throw err;
    }
  },

  deleteBanner: async (id) => {
    try {
      const res = await adminApi.delete(`/banners/${id}`);
      if (res.success) {
        set((state) => ({
          banners: state.banners.filter((b) => b._id !== id),
        }));
        toast.success("Banner deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete banner");
      return false;
    }
  },
}));
