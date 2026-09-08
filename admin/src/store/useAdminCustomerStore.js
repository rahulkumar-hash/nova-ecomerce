import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminCustomerStore = create((set, get) => ({
  customers: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,

  fetchCustomers: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await adminApi.get(`/admin/customers${query ? `?${query}` : ""}`);
      if (res.success && res.data) {
        set({
          customers: res.data.customers || [],
          total: res.data.total || 0,
          page: res.data.page || 1,
          pages: res.data.pages || 1,
          loading: false,
        });
        return res.data.customers;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch customers");
      return [];
    }
  },

  toggleCustomerStatus: async (id) => {
    try {
      const res = await adminApi.patch(`/admin/customers/${id}/toggle-status`);
      if (res.success && res.data) {
        set((state) => ({
          customers: state.customers.map((c) => (c._id === id ? res.data : c)),
        }));
        toast.success(`Customer status set to ${res.data.status}`);
        return res.data;
      }
    } catch (err) {
      toast.error(err.message || "Failed to update customer status");
    }
  },
}));
