import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminReviewStore = create((set, get) => ({
  reviews: [],
  loading: false,

  fetchReviews: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await adminApi.get(`/reviews/admin/all${query ? `?${query}` : ""}`);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        set({ reviews: list, loading: false });
        return list;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch reviews");
      return [];
    }
  },

  updateReviewStatus: async (id, status) => {
    try {
      const res = await adminApi.patch(`/reviews/admin/${id}/status`, { status });
      if (res.success && res.data) {
        set((state) => ({
          reviews: state.reviews.map((r) => (r._id === id ? res.data : r)),
        }));
        toast.success(`Review ${status} successfully! ⭐`);
        return res.data;
      }
    } catch (err) {
      toast.error(err.message || "Failed to update review status");
    }
  },

  deleteReview: async (id) => {
    try {
      const res = await adminApi.delete(`/reviews/admin/${id}`);
      if (res.success) {
        set((state) => ({
          reviews: state.reviews.filter((r) => r._id !== id),
        }));
        toast.success("Review deleted successfully");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.message || "Failed to delete review");
      return false;
    }
  },
}));
