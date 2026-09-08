import { create } from "zustand";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export const useAdminOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  total: 0,
  page: 1,
  pages: 1,
  loading: false,

  fetchOrders: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await adminApi.get(`/orders/admin/all${query ? `?${query}` : ""}`);
      if (res.success && res.data) {
        const orderList = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        set({
          orders: orderList,
          total: res.data.total || orderList.length,
          page: res.data.page || 1,
          pages: res.data.pages || 1,
          loading: false,
        });
        return orderList;
      }
      set({ loading: false });
      return [];
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch orders");
      return [];
    }
  },

  getOrderById: async (id) => {
    set({ loading: true });
    try {
      const res = await adminApi.get(`/orders/${id}`);
      if (res.success && res.data) {
        set({ currentOrder: res.data, loading: false });
        return res.data;
      }
      set({ loading: false });
      return null;
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || "Failed to fetch order details");
      return null;
    }
  },

  updateOrderStatus: async (id, statusData) => {
    try {
      const res = await adminApi.put(`/orders/admin/${id}/status`, statusData);
      if (res.success && res.data) {
        set((state) => ({
          orders: state.orders.map((o) => (o._id === id ? res.data : o)),
          currentOrder: state.currentOrder?._id === id ? res.data : state.currentOrder,
        }));
        toast.success("Order status updated successfully! 📦");
        return res.data;
      }
      return null;
    } catch (err) {
      toast.error(err.message || "Failed to update order status");
      throw err;
    }
  },
}));
