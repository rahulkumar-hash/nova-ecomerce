import { create } from "zustand";
import api from "../services/api";

export const useProductStore = create((set, get) => ({
  products: [],
  featuredProducts: [],
  categories: [],
  brands: [],
  activeProduct: null,
  loading: false,
  pagination: { page: 1, pages: 1, total: 0 },

  fetchCategories: async () => {
    try {
      const res = await api.get("/categories");
      if (res.success) {
        set({ categories: Array.isArray(res.data) ? res.data : [] });
      }
    } catch (e) {}
  },

  fetchBrands: async () => {
    try {
      const res = await api.get("/products/brands");
      if (res.success) {
        set({ brands: Array.isArray(res.data) ? res.data : [] });
      }
    } catch (e) {}
  },

  fetchProducts: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get("/products?" + query);
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        set({
          products: list,
          pagination: {
            page: res.data?.page || 1,
            pages: res.data?.pages || 1,
            total: res.data?.total || list.length,
          },
          loading: false,
        });
      }
    } catch (err) {
      set({ products: [], loading: false });
    }
  },

  fetchProductBySlug: async (slug) => {
    set({ loading: true, activeProduct: null });
    try {
      const res = await api.get("/products/" + slug);
      if (res.success) {
        set({ activeProduct: res.data, loading: false });
        return res.data;
      }
    } catch (err) {
      set({ activeProduct: null, loading: false });
      return null;
    }
  },
}));
