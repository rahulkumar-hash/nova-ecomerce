import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminPageStore = create((set, get) => ({
  pages: [],
  currentPage: null,
  loading: false,

  fetchPages: async () => {
    set({ loading: true });
    try {
      const res = await adminApi.get("/pages/admin/all");
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        set({ pages: list, loading: false });
        return list;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch pages");
      return [];
    }
  },

  getPageBySlug: async (slug) => {
    set({ loading: true });
    try {
      const res = await adminApi.get(`/pages/admin/${slug}`);
      if (res.success && res.data) {
        set({ currentPage: res.data, loading: false });
        return res.data;
      }
      set({ loading: false });
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch page");
      return null;
    }
  },

  savePage: async (pageData) => {
    set({ loading: true });
    try {
      const res = await adminApi.post("/pages/admin", pageData);
      set({ loading: false });
      if (res.success && res.data) {
        toast.success("Page content published successfully! 📄");
        get().fetchPages();
        return res.data;
      }
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to save page");
      throw err;
    }
  },

  deletePage: async (id) => {
    try {
      const res = await adminApi.delete(`/pages/admin/${id}`);
      if (res.success) {
        set((state) => ({
          pages: state.pages.filter((p) => p._id !== id),
        }));
        toast.success("Page deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete page");
      return false;
    }
  },
}));
