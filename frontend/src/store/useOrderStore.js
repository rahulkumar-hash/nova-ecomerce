import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

export const useOrderStore = create((set, get) => ({
  myOrders: [],
  activeOrder: null,
  loading: false,
  pagination: { page: 1, pages: 1, total: 0 },

  fetchMyOrders: async (page = 1) => {
    set({ loading: true });
    try {
      const res = await api.get(`/orders/my-orders?page=${page}&limit=10`);
      if (res.success) {
        const orderList = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
        set({
          myOrders: orderList,
          pagination: {
            page: res.data?.page || 1,
            pages: res.data?.pages || 1,
            total: res.data?.total || orderList.length,
          },
          loading: false,
        });
      }
    } catch (err) {
      set({ myOrders: [], loading: false });
    }
  },

  getOrderDetails: async (identifier) => {
    set({ loading: true });
    try {
      const res = await api.get(`/orders/${identifier}`);
      if (res.success) {
        set({ activeOrder: res.data, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ activeOrder: null, loading: false });
      return null;
    }
  },

  createOrder: async (orderPayload) => {
    try {
      const res = await api.post("/orders/create", orderPayload);
      if (res.success) {
        return res.data;
      }
    } catch (err) {
      throw err;
    }
  },

  createRazorpayOrder: async (amount) => {
    try {
      const res = await api.post("/orders/razorpay/create-order", { amount });
      if (res.success) {
        return res.data;
      }
    } catch (err) {
      throw err;
    }
  },

  verifyPayment: async (paymentPayload) => {
    try {
      const res = await api.post("/orders/verify-payment", paymentPayload);
      if (res.success) {
        return res.data;
      }
    } catch (err) {
      throw err;
    }
  },
}));
