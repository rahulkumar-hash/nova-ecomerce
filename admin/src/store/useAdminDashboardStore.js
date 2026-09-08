import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminDashboardStore = create((set) => ({
  stats: null,
  loading: false,

  fetchDashboardStats: async () => {
    set({ loading: true });
    try {
      const res = await adminApi.get("/admin/dashboard-stats");
      if (res.success && res.data) {
        set({ stats: res.data, loading: false });
        return res.data;
      }
      set({ loading: false });
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to load dashboard statistics");
      return null;
    }
  },
}));
